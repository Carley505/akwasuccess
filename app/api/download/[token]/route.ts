import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import {
  MAX_DOWNLOADS_PER_DAY,
  readAndWatermarkFile,
  verifySignedDownloadToken,
} from "@/lib/storage";

type Params = Promise<{ token: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;
  const verified = await verifySignedDownloadToken(token);
  if (!verified) {
    return NextResponse.json(
      { error: "This download link has expired or is invalid. Please generate a fresh link from your Account Library." },
      { status: 403 },
    );
  }

  const db = await getDb();

  // Verify entitlement is still active
  const [ent] = await db
    .select()
    .from(s.entitlements)
    .where(
      and(
        eq(s.entitlements.id, verified.entitlementId),
        isNull(s.entitlements.revokedAt),
      ),
    );
  if (!ent) {
    return NextResponse.json(
      { error: "Access to this product is no longer active." },
      { status: 403 },
    );
  }

  // Check daily download limit (max 5 per purchase per 24h, Spec 10)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(s.downloads)
    .where(
      and(
        eq(s.downloads.entitlementId, ent.id),
        gt(s.downloads.createdAt, since),
      ),
    );

  if ((countRow?.count ?? 0) >= MAX_DOWNLOADS_PER_DAY) {
    return NextResponse.json(
      {
        error: `Daily download limit (${MAX_DOWNLOADS_PER_DAY}/day) reached for this item. Please try again tomorrow or contact support to reset your limit.`,
      },
      { status: 429 },
    );
  }

  const [file] = await db
    .select()
    .from(s.productFiles)
    .where(eq(s.productFiles.id, verified.productFileId));
  if (!file) {
    return NextResponse.json({ error: "Product file not found." }, { status: 404 });
  }

  const bytes = await readAndWatermarkFile({
    fileKey: file.fileKey,
    buyerEmail: verified.buyerEmail,
    orderNumber: verified.orderNumber,
  });

  await db.insert(s.downloads).values({
    entitlementId: ent.id,
    userId: verified.userId,
    productFileId: file.id,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": file.format.toUpperCase() === "EPUB" ? "application/epub+zip" : "application/pdf",
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
