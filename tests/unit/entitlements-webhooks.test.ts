import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createSignedDownloadToken,
  verifySignedDownloadToken,
} from "@/lib/storage";
import { verifyPaystackSignature } from "@/lib/payments";

describe("Signed download tokens & webhook signature verification", () => {
  it("signs and verifies short-lived download tokens", async () => {
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

    expect(await verifySignedDownloadToken(`${token}tampered`)).toBeNull();
  });

  it("verifies Paystack HMAC-SHA512 webhook signatures", () => {
    process.env.PAYSTACK_SECRET_KEY = "test_paystack_secret";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "REF_123" } });
    const sig = crypto
      .createHmac("sha512", "test_paystack_secret")
      .update(body)
      .digest("hex");

    expect(verifyPaystackSignature(body, sig)).toBe(true);
    expect(verifyPaystackSignature(body, "0".repeat(128))).toBe(false);
  });
});
