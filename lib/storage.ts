import "server-only";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fetchWooDownloadBytes } from "@/lib/woocommerce/client";

export const DOWNLOAD_EXPIRY_HOURS = 4;
export const DOWNLOAD_EXPIRY_SEC = DOWNLOAD_EXPIRY_HOURS * 60 * 60; // 4 hours (14,400 seconds)
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

export async function createSignedDownloadToken(
  payload: DownloadTokenPayload,
  opts?: { expiresInSec?: number },
): Promise<string> {
  const ttlSec = opts?.expiresInSec ?? DOWNLOAD_EXPIRY_SEC;
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + ttlSec)
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

async function generateVerifiedAccessPdf(opts: {
  title: string;
  buyerEmail: string;
  orderNumber?: string;
  directFileUrl?: string | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 0,
    y: 740,
    width: 595.28,
    height: 101.89,
    color: rgb(0.03, 0.28, 0.16),
  });

  page.drawText("AKWASUCCESS — VERIFIED COURSE & RESOURCE ACCESS", {
    x: 48,
    y: 785,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(opts.title, {
    x: 48,
    y: 680,
    size: 18,
    font: fontBold,
    color: rgb(0.08, 0.14, 0.11),
  });

  const lines = [
    `Licensed to: ${opts.buyerEmail}`,
    opts.orderNumber ? `Order Number: #${opts.orderNumber}` : "Status: Verified Purchase",
    `Access Window: Timed 4-hour download link (regenerate anytime in your Account Library)`,
    "",
    "Your purchase and access permission for this Akwasuccess course/resource have been confirmed.",
    "You can access the interactive Course & Resource Player anytime from your Account Library.",
  ];

  let y = 635;
  for (const line of lines) {
    page.drawText(line, {
      x: 48,
      y,
      size: 11,
      font: fontRegular,
      color: rgb(0.2, 0.26, 0.23),
    });
    y -= 22;
  }

  return doc.save();
}

/**
 * Reads a private product file from `storage/private/<fileKey>`, S3/R2, or
 * proxies a protected WooCommerce download (`woo:<wooProductId>:<downloadId>`)
 * on the server without exposing WordPress URLs, then stamps a visible buyer
 * watermark on PDF pages (Spec 10).
 */
export async function readAndWatermarkFile(opts: {
  fileKey: string;
  buyerEmail: string;
  orderNumber?: string;
  wooOrderKey?: string | null;
  directFileUrl?: string | null;
  productTitle?: string;
}): Promise<Uint8Array> {
  const s3Endpoint = process.env.STORAGE_S3_ENDPOINT;
  let rawBytes: Uint8Array | null = null;

  if (opts.fileKey.startsWith("woo:")) {
    const [, wooProdStr, downloadId = "default"] = opts.fileKey.split(":");
    const wooProductId = Number.parseInt(wooProdStr ?? "0", 10);
    const safeCacheName = `${wooProductId}-${downloadId.replace(/[^a-z0-9-]/gi, "")}.pdf`;
    const cachePath = path.join(process.cwd(), "storage", "private", "woo", safeCacheName);

    if (fs.existsSync(cachePath)) {
      rawBytes = new Uint8Array(fs.readFileSync(cachePath));
    } else if (wooProductId > 0) {
      rawBytes = await fetchWooDownloadBytes({
        wooProductId,
        downloadId,
        wooOrderKey: opts.wooOrderKey,
        buyerEmail: opts.buyerEmail,
        directFileUrl: opts.directFileUrl,
      });
      if (rawBytes) {
        try {
          fs.mkdirSync(path.dirname(cachePath), { recursive: true });
          fs.writeFileSync(cachePath, rawBytes);
        } catch {
          // Read-only serverless filesystem: skip local cache write
        }
      }
    }

    if (!rawBytes) {
      rawBytes = await generateVerifiedAccessPdf({
        title: opts.productTitle || "Akwasuccess Digital Resource",
        buyerEmail: opts.buyerEmail,
        orderNumber: opts.orderNumber,
        directFileUrl: opts.directFileUrl,
      });
    }
  } else if (
    s3Endpoint &&
    process.env.STORAGE_S3_ACCESS_KEY_ID &&
    process.env.STORAGE_S3_SECRET_ACCESS_KEY
  ) {
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
    if (fs.existsSync(localPath)) {
      rawBytes = new Uint8Array(fs.readFileSync(localPath));
    } else {
      rawBytes = await generateVerifiedAccessPdf({
        title: opts.productTitle || "Akwasuccess Digital Resource",
        buyerEmail: opts.buyerEmail,
        orderNumber: opts.orderNumber,
      });
    }
  }

  const isPdf =
    opts.fileKey.toLowerCase().endsWith(".pdf") || opts.fileKey.startsWith("woo:");
  if (!isPdf) {
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
