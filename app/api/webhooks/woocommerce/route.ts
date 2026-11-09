import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { syncWooProducts, verifyWooWebhookSignature } from "@/lib/woocommerce";

/**
 * WooCommerce webhook receiver (HMAC-SHA256 verified via `x-wc-webhook-signature`).
 * Triggers an immediate catalog sync and revalidates Shop and Course pages
 * whenever products are created or updated in WordPress.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // WooCommerce sends a webhook ping with `webhook_id=...` when first saved in WP Admin
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") && rawBody.includes("webhook_id=")) {
    return NextResponse.json({ ok: true, ping: true });
  }

  const sig = req.headers.get("x-wc-webhook-signature");
  if (!verifyWooWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid WooCommerce webhook signature" }, { status: 401 });
  }

  const result = await syncWooProducts();

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]", "page");
  revalidatePath("/courses");
  revalidatePath("/courses/[slug]", "page");

  return NextResponse.json({
    received: true,
    syncedCount: result.syncedCount,
  });
}
