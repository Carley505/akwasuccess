import "server-only";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const DOWNLOAD_EXPIRY_SEC = 10 * 60; // 10 minutes (Spec 8.11)
export const MAX_DOWNLOADS_PER_DAY = 5; // Generous daily limit (Spec 10)

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET || "akwasuccess-dev-secret-key-please-change-in-production-32chars";
  return new TextEncoder().encode(secret);
}

export type DownloadTokenPayload = {
  entitlementId: string;
  productFileId: string;
  userId: string;
  buyerEmail: string;
  orderNumber?: string;
};

export async function createSignedDownloadToken(payload: DownloadTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DOWNLOAD_EXPIRY_SEC}s`)
    .sign(getSecretKey());
}

export async function verifySignedDownloadToken(
  token: string,
): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.entitlementId !== "string" ||
      typeof payload.productFileId !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.buyerEmail !== "string"
    ) {
      return null;
    }
    return {
      entitlementId: payload.entitlementId,
      productFileId: payload.productFileId,
      userId: payload.userId,
      buyerEmail: payload.buyerEmail,
      orderNumber: typeof payload.orderNumber === "string" ? payload.orderNumber : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Reads a private product file from `storage/private/<fileKey>` (or S3/R2 when
 * configured) and applies a visible footer watermark on PDF pages (Spec 10).
 */
export async function readAndWatermarkFile(opts: {
  fileKey: string;
  buyerEmail: string;
  orderNumber?: string;
}): Promise<Uint8Array> {
  const s3Endpoint = process.env.STORAGE_S3_ENDPOINT;
  let rawBytes: Uint8Array;

  if (s3Endpoint && process.env.STORAGE_S3_ACCESS_KEY_ID && process.env.STORAGE_S3_SECRET_ACCESS_KEY) {
    const { AwsClient } = await import("aws4fetch");
    const aws = new AwsClient({
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
      region: process.env.STORAGE_S3_REGION || "auto",
      service: "s3",
    });
    const bucket = process.env.STORAGE_S3_BUCKET || "akwasuccess-private";
    const url = `${s3Endpoint.replace(/\/$/, "")}/${bucket}/${opts.fileKey}`;
    const res = await aws.fetch(url);
    if (!res.ok) throw new Error(`Could not fetch private file: ${res.status}`);
    rawBytes = new Uint8Array(await res.arrayBuffer());
  } else {
    const safeRel = opts.fileKey.replace(/\.\./g, "");
    const localPath = path.join(process.cwd(), "storage", "private", safeRel);
    rawBytes = new Uint8Array(fs.readFileSync(localPath));
  }

  if (!opts.fileKey.toLowerCase().endsWith(".pdf")) {
    return rawBytes;
  }

  try {
    const pdf = await PDFDocument.load(rawBytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const stamp = `Personal copy licensed to ${opts.buyerEmail}${
      opts.orderNumber ? ` • Order #${opts.orderNumber}` : ""
    } • Akwasuccess.com`;

    for (const page of pdf.getPages()) {
      page.drawText(stamp, {
        x: 48,
        y: 22,
        size: 8,
        font,
        color: rgb(0.35, 0.42, 0.38),
      });
    }
    return await pdf.save();
  } catch {
    return rawBytes;
  }
}
