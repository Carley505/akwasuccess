import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { getSessionUser, findOrCreateUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const db = await getDb();

  if (action === "upsert-product") {
    const slug = String(body.slug ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-");
    const title = String(body.title ?? "").trim();
    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required." }, { status: 400 });
    }

    const values = {
      slug,
      title,
      subtitle: String(body.subtitle ?? "").trim(),
      description: String(body.description ?? "").trim(),
      type: (body.type as "ebook" | "course" | "tutorial" | "service" | "bundle") ?? "ebook",
      categorySlug: String(body.categorySlug ?? "crypto"),
      level: (body.level as "beginner" | "intermediate" | "advanced") ?? "beginner",
      priceKes: Math.max(0, Math.round(Number(body.priceKes ?? 0))),
      salePriceKes: body.salePriceKes ? Math.round(Number(body.salePriceKes)) : null,
      isFree: Boolean(body.isFree),
      status: (body.status as "draft" | "published") ?? "published",
      isSample: false,
      pages: body.pages ? Number(body.pages) : null,
      outcomes: String(body.outcomesText ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      seoTitle: body.seoTitle ? String(body.seoTitle) : null,
      seoDescription: body.seoDescription ? String(body.seoDescription) : null,
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(s.products)
      .values(values)
      .onConflictDoUpdate({ target: s.products.slug, set: values })
      .returning();

    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "upsert-product",
      entity: "product",
      entityId: saved?.id,
      data: { slug, priceKes: values.priceKes },
    });

    return NextResponse.json({ message: `Saved product "${title}".` });
  }

  if (action === "upsert-article") {
    const slug = String(body.slug ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-");
    const title = String(body.title ?? "").trim();
    if (!slug || !title) {
      return NextResponse.json({ error: "Article slug and title are required." }, { status: 400 });
    }

    const values = {
      slug,
      title,
      excerpt: String(body.excerpt ?? "").trim(),
      body: String(body.body ?? "").trim(),
      categorySlug: String(body.categorySlug ?? "crypto"),
      level: (body.level as "beginner" | "intermediate" | "advanced") ?? "beginner",
      status: (body.status as "draft" | "published") ?? "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(s.articles)
      .values(values)
      .onConflictDoUpdate({ target: s.articles.slug, set: values })
      .returning();

    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "upsert-article",
      entity: "article",
      entityId: saved?.id,
      data: { slug },
    });

    return NextResponse.json({ message: `Saved article "${title}".` });
  }

  if (action === "grant-access") {
    const email = String(body.email ?? "").toLowerCase().trim();
    const productId = String(body.productId ?? "");
    if (!email || !productId) {
      return NextResponse.json({ error: "Email and product are required." }, { status: 400 });
    }
    const user = await findOrCreateUser({ email });
    await db
      .insert(s.entitlements)
      .values({ userId: user.id, productId, source: "manual" })
      .onConflictDoUpdate({
        target: [s.entitlements.userId, s.entitlements.productId],
        set: { revokedAt: null, source: "manual" },
      });

    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "grant-access",
      entity: "entitlement",
      entityId: productId,
      data: { email },
    });

    return NextResponse.json({ message: `Granted access to ${email}.` });
  }

  if (action === "refund-order") {
    const orderId = String(body.orderId ?? "");
    await db
      .update(s.orders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(s.orders.id, orderId));
    await db
      .update(s.entitlements)
      .set({ revokedAt: new Date() })
      .where(eq(s.entitlements.orderId, orderId));

    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "refund-order",
      entity: "order",
      entityId: orderId,
    });
    return NextResponse.json({ message: "Order marked refunded and entitlements revoked." });
  }

  if (action === "moderate-review") {
    const id = String(body.id ?? "");
    const status = body.status === "approved" ? "approved" : "rejected";
    await db.update(s.reviews).set({ status }).where(eq(s.reviews.id, id));
    return NextResponse.json({ message: `Review ${status}.` });
  }

  if (action === "moderate-testimonial") {
    const id = String(body.id ?? "");
    const status = body.status === "approved" ? "approved" : "rejected";
    await db.update(s.testimonials).set({ status }).where(eq(s.testimonials.id, id));
    return NextResponse.json({ message: `Story ${status}.` });
  }

  if (action === "create-coupon") {
    const code = String(body.code ?? "").toUpperCase().trim();
    const type = body.type === "fixed" ? "fixed" : "percent";
    const value = Math.max(1, Math.round(Number(body.value ?? 10)));
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    await db
      .insert(s.coupons)
      .values({ code, type, value, active: true })
      .onConflictDoUpdate({ target: s.coupons.code, set: { type, value, active: true } });
    return NextResponse.json({ message: `Saved coupon ${code}.` });
  }

  if (action === "send-abandoned-reminders") {
    // Spec 8.4: Abandoned-cart email (1h and 24h) if email captured & consent respected
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const pendingOrders = await db
      .select()
      .from(s.orders)
      .where(
        and(
          eq(s.orders.status, "pending"),
          eq(s.orders.marketingConsent, true),
          lt(s.orders.createdAt, oneHourAgo),
        ),
      );

    let sent = 0;
    for (const o of pendingOrders) {
      if (o.abandonedStage >= 2) continue;
      await sendEmail({
        to: o.email,
        subject: "Need help completing your Akwasuccess order?",
        html: `<p>We noticed your order (#${o.number}) was not completed. You can resume checkout anytime at <a href="${absoluteUrl("/checkout")}">${absoluteUrl("/checkout")}</a>.</p>`,
        text: `Resume your Akwasuccess checkout anytime: ${absoluteUrl("/checkout")}`,
      });
      await db
        .update(s.orders)
        .set({ abandonedStage: o.abandonedStage + 1 })
        .where(eq(s.orders.id, o.id));
      sent += 1;
    }
    return NextResponse.json({ message: `Sent ${sent} abandoned-cart reminder(s).` });
  }

  if (action === "delete-user-data") {
    // Spec 19: Kenya Data Protection Act deletion request tool
    const email = String(body.email ?? "").toLowerCase().trim();
    await db.delete(s.subscribers).where(eq(s.subscribers.email, email));
    await db.delete(s.users).where(eq(s.users.email, email));
    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "delete-user-data",
      entity: "user",
      data: { emailRedacted: email.slice(0, 2) + "***" },
    });
    return NextResponse.json({ message: `Deleted personal profile & subscriber record for ${email}.` });
  }

  return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
}
