import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema as s } from "@/lib/db";
import { issueMagicLoginToken } from "@/lib/auth";
import { createSignedDownloadToken } from "@/lib/storage";
import { sendOrderReceiptEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/security";
import { absoluteUrl } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Please enter the email address used on your order."),
});

/**
 * "Resend my download links" endpoint (Spec 8.11: fixes the #1 support request).
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`resend:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const db = await getDb();
  const [user] = await db.select().from(s.users).where(eq(s.users.email, email));

  if (user) {
    const ents = await db
      .select()
      .from(s.entitlements)
      .where(and(eq(s.entitlements.userId, user.id), isNull(s.entitlements.revokedAt)));

    if (ents.length > 0) {
      const items: { title: string; downloadUrl?: string }[] = [];
      for (const ent of ents) {
        const [prod] = await db.select().from(s.products).where(eq(s.products.id, ent.productId));
        const [file] = await db
          .select()
          .from(s.productFiles)
          .where(eq(s.productFiles.productId, ent.productId));
        if (prod) {
          const token = file
            ? await createSignedDownloadToken({
                entitlementId: ent.id,
                productFileId: file.id,
                userId: user.id,
                buyerEmail: user.email,
              })
            : undefined;
          items.push({
            title: prod.title,
            downloadUrl: token ? absoluteUrl(`/api/download/${token}`) : undefined,
          });
        }
      }

      const rawLogin = await issueMagicLoginToken(user.email, "/account/library");
      await sendOrderReceiptEmail({
        email: user.email,
        orderNumber: "LIBRARY-RESEND",
        totalKes: 0,
        items,
        magicLinkUrl: absoluteUrl(`/api/auth/verify?token=${encodeURIComponent(rawLogin)}`),
      });
    }
  }

  return NextResponse.json({
    message:
      "If any purchases exist for that email address, we have sent fresh download links and a sign-in link to your inbox.",
  });
}
