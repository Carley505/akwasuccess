import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_EXPIRY_HOURS,
  DOWNLOAD_EXPIRY_SEC,
  createSignedDownloadToken,
  verifySignedDownloadToken,
} from "@/lib/storage";
import { isPaystackAmountValid, verifyPaystackSignature } from "@/lib/payments";
import {
  classifyWooProduct,
  formatPaystackWooReference,
  parseWooOrderIdFromReference,
  parseWooPriceToCents,
  stripHtmlToText,
  verifyWooWebhookSignature,
} from "@/lib/woocommerce/classify";

describe("Signed 4-hour download tokens & webhook signature verification", () => {
  it("enforces a 4-hour (14,400s) expiry window on download tokens and rejects expired or tampered tokens", async () => {
    expect(DOWNLOAD_EXPIRY_HOURS).toBe(4);
    expect(DOWNLOAD_EXPIRY_SEC).toBe(4 * 60 * 60);

    const token = await createSignedDownloadToken({
      entitlementId: "ent-1",
      productFileId: "file-1",
      userId: "user-1",
      buyerEmail: "reader@example.com",
      orderNumber: "AK-TEST-1001",
    });

    const verified = await verifySignedDownloadToken(token);
    expect(verified).toEqual({
      entitlementId: "ent-1",
      productFileId: "file-1",
      userId: "user-1",
      buyerEmail: "reader@example.com",
      orderNumber: "AK-TEST-1001",
    });

    // Tampered token is rejected
    expect(await verifySignedDownloadToken(`${token}tampered`)).toBeNull();

    // Token past its 4-hour expiration is rejected
    const expiredToken = await createSignedDownloadToken(
      {
        entitlementId: "ent-1",
        productFileId: "file-1",
        userId: "user-1",
        buyerEmail: "reader@example.com",
      },
      { expiresInSec: -60 },
    );
    expect(await verifySignedDownloadToken(expiredToken)).toBeNull();
  });

  it("verifies Paystack HMAC-SHA512 webhook signatures and USD amount matching", () => {
    process.env.PAYSTACK_SECRET_KEY = "test_paystack_secret";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "232_1789554637" } });
    const sig = crypto
      .createHmac("sha512", "test_paystack_secret")
      .update(body)
      .digest("hex");

    expect(verifyPaystackSignature(body, sig)).toBe(true);
    expect(verifyPaystackSignature(body, "0".repeat(128))).toBe(false);

    expect(isPaystackAmountValid(500, 500, "USD")).toBe(true);
    expect(isPaystackAmountValid(500, 400, "USD")).toBe(false);
    expect(isPaystackAmountValid(500, 500, "NGN")).toBe(false);
  });

  it("classifies WooCommerce products into categories, formats, and integer USD cents", () => {
    expect(parseWooPriceToCents("1.5")).toBe(150);
    expect(parseWooPriceToCents("$4.00")).toBe(400);
    expect(parseWooPriceToCents("")).toBe(0);

    expect(stripHtmlToText("<p><strong>Hello<!--comment--> &amp; welcome</strong></p>")).toBe(
      "Hello & welcome",
    );

    const tiktok = classifyWooProduct({
      id: 115,
      name: "TikTok Marketing Strategy",
      slug: "tiktok-marketing-strategy",
      status: "publish",
      type: "simple",
      price: "1.5",
      regular_price: "1.5",
      sale_price: "",
      virtual: false,
      downloadable: true,
      downloads: [],
    });
    expect(tiktok.categorySlug).toBe("marketing");
    expect(tiktok.type).toBe("course");
    expect(tiktok.priceCents).toBe(150);
    expect(tiktok.salePriceCents).toBeNull();

    const genuineMoney = classifyWooProduct({
      id: 151,
      name: "The Secret of Genuine Money",
      slug: "the-secret-of-genuine-money",
      status: "publish",
      type: "simple",
      price: "4",
      regular_price: "20",
      sale_price: "4",
      virtual: true,
      downloadable: true,
      downloads: [],
    });
    expect(genuineMoney.categorySlug).toBe("finance");
    expect(genuineMoney.type).toBe("ebook");
    expect(genuineMoney.priceCents).toBe(2000);
    expect(genuineMoney.salePriceCents).toBe(400);

    const psych = classifyWooProduct({
      id: 117,
      name: "Psychology Clinic Health Tips",
      slug: "117",
      status: "publish",
      type: "simple",
      price: "5",
      regular_price: "5",
      sale_price: "",
      virtual: false,
      downloadable: true,
      downloads: [],
    });
    expect(psych.slug).toBe("psychology-clinic-health-tips");
    expect(psych.categorySlug).toBe("psychology");
  });

  it("formats Paystack references for WooCommerce compatibility and verifies Woo webhooks", () => {
    const ref = formatPaystackWooReference(232, "AK-TEST", 1789554637000);
    expect(ref).toBe("232_1789554637");
    expect(parseWooOrderIdFromReference(ref)).toBe(232);

    const raw = JSON.stringify({ id: 151, slug: "the-secret-of-genuine-money" });
    const secret = "woo_webhook_secret_key";
    const sig = crypto.createHmac("sha256", secret).update(raw).digest("base64");
    expect(verifyWooWebhookSignature(raw, sig, secret)).toBe(true);
    expect(verifyWooWebhookSignature(raw, "invalid", secret)).toBe(false);
  });
});
