import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

/**
 * Dynamically serves runtime-uploaded public assets (cover images and sample PDFs)
 * so files uploaded via `/admin` after `npm run build` are immediately available
 * in `npm run start` without requiring a rebuild.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Prevent directory traversal
  const safeSegments = segments.map((s) => path.basename(s));
  const publicUploadsRoot = path.join(process.cwd(), "public", "uploads");
  const publicSamplesRoot = path.join(process.cwd(), "public", "samples");

  let absPath: string;
  if (safeSegments[0] === "samples") {
    absPath = path.join(publicSamplesRoot, ...safeSegments.slice(1));
  } else {
    absPath = path.join(publicUploadsRoot, ...safeSegments);
  }

  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    const staticFallbackPath =
      safeSegments[0] === "samples"
        ? `/samples/${safeSegments.slice(1).join("/")}`
        : `/uploads/${safeSegments.join("/")}`;
    return NextResponse.redirect(new URL(staticFallbackPath, _req.url), 307);
  }

  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const bytes = fs.readFileSync(absPath);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
