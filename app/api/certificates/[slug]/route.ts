import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

/**
 * Generates a printable PDF Certificate of Completion (Spec 8.5).
 */
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const user = await getSessionUser();
  const learnerName = user?.name || user?.email || "Akwasuccess Learner";

  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 Landscape
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  // Outer border in brand green & inner accent in gold
  page.drawRectangle({
    x: 28,
    y: 28,
    width: 841.89 - 56,
    height: 595.28 - 56,
    borderColor: rgb(8 / 255, 71 / 255, 42 / 255),
    borderWidth: 4,
  });
  page.drawRectangle({
    x: 38,
    y: 38,
    width: 841.89 - 76,
    height: 595.28 - 76,
    borderColor: rgb(212 / 255, 160 / 255, 23 / 255),
    borderWidth: 1.5,
  });

  page.drawText("AKWASUCCESS — CERTIFICATE OF COMPLETION", {
    x: 80,
    y: 480,
    size: 14,
    font: sans,
    color: rgb(11 / 255, 107 / 255, 58 / 255),
  });

  page.drawText("This certifies that", {
    x: 80,
    y: 420,
    size: 14,
    font: sans,
    color: rgb(74 / 255, 90 / 255, 82 / 255),
  });

  page.drawText(learnerName, {
    x: 80,
    y: 375,
    size: 32,
    font: serif,
    color: rgb(20 / 255, 35 / 255, 27 / 255),
  });

  page.drawText("has completed the educational course:", {
    x: 80,
    y: 325,
    size: 14,
    font: sans,
    color: rgb(74 / 255, 90 / 255, 82 / 255),
  });

  page.drawText(data.product.title, {
    x: 80,
    y: 280,
    size: 22,
    font: serif,
    color: rgb(8 / 255, 71 / 255, 42 / 255),
  });

  page.drawText(`Issued on ${formatDate(new Date())} • Akwasuccess.com`, {
    x: 80,
    y: 110,
    size: 11,
    font: sans,
    color: rgb(74 / 255, 90 / 255, 82 / 255),
  });

  const bytes = await doc.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Akwasuccess-Certificate-${slug}.pdf"`,
    },
  });
}
