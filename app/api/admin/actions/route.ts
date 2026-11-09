import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { getSessionUser, findOrCreateUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { syncWooProducts } from "@/lib/woocommerce";
import { absoluteUrl, dollarsToCents } from "@/lib/utils";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

function safeExt(fileName: string, fallback: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 6 ? ext : fallback;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, unknown> = {};
  let formData: FormData | null = null;

  if (contentType.includes("multipart/form-data")) {
    formData = await req.formData();
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") {
        body[k] = v;
      }
    }
  } else {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const action = String(body.action ?? "");
  const db = await getDb();

  if (action === "sync-woocommerce") {
    try {
      const res = await syncWooProducts({ pushCategoriesToWoo: true });
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/shop/[slug]", "page");
      revalidatePath("/courses");
      revalidatePath("/courses/[slug]", "page");
      revalidatePath("/admin");
      return NextResponse.json({
        message: `Synced ${res.syncedCount} products from WooCommerce${
          res.graphqlVerified ? " (REST + WooGraphQL verified)" : ""
        }.`,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not sync products from WooCommerce.",
        },
        { status: 500 },
      );
    }
  }

  if (action === "upsert-product") {
    const slug = String(body.slug ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const title = String(body.title ?? "").trim();
    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required." }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(s.products)
      .where(eq(s.products.slug, slug));

    // Optional uploaded cover image -> automatically compressed to 960x1440 WebP (<200KB)
    let cover = existing?.cover ?? null;
    const coverFile = formData?.get("coverFile");
    if (coverFile instanceof File && coverFile.size > 0) {
      const rawBuf = Buffer.from(await coverFile.arrayBuffer());
      let outBuf: Buffer = rawBuf;
      let outExt = safeExt(coverFile.name, ".webp");
      let outMime = coverFile.type || "image/webp";

      if (outExt !== ".svg") {
        try {
          const sharpMod = await import("sharp");
          const sharpFn = sharpMod.default ?? sharpMod;
          outBuf = await sharpFn(rawBuf)
            .resize(960, 1440, { fit: "cover" })
            .webp({ quality: 80, effort: 5 })
            .toBuffer();
          outExt = ".webp";
          outMime = "image/webp";
        } catch {
          // Fallback to original buffer if sharp is unavailable
        }
      }

      const fileName = `${slug}-${Date.now()}${outExt}`;
      try {
        const absPath = path.join(process.cwd(), "public", "uploads", "covers", fileName);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, outBuf);
        cover = {
          url: `/api/uploads/covers/${fileName}`,
          alt: `${title} cover`,
          width: 960,
          height: 1440,
        };
      } catch {
        cover = {
          url: `data:${outMime};base64,${outBuf.toString("base64")}`,
          alt: `${title} cover`,
          width: 960,
          height: 1440,
        };
      }
    }

    // Optional uploaded free sample PDF -> public/samples/<slug>-sample.pdf
    let sampleFileKey = existing?.sampleFileKey ?? null;
    const sampleFile = formData?.get("sampleFile");
    if (sampleFile instanceof File && sampleFile.size > 0) {
      const sampleName = `${slug}-${Date.now()}-sample.pdf`;
      const absSample = path.join(process.cwd(), "public", "samples", sampleName);
      fs.mkdirSync(path.dirname(absSample), { recursive: true });
      fs.writeFileSync(absSample, Buffer.from(await sampleFile.arrayBuffer()));
      sampleFileKey = `api/uploads/samples/${sampleName}`;
    }

    // Optional uploaded digital product file (PDF / EPUB) -> storage/private/products/<slug>.<ext>
    const productFile = formData?.get("productFile");
    let uploadedProductFile: {
      format: "PDF" | "EPUB";
      fileKey: string;
      fileName: string;
      sizeBytes: number;
    } | null = null;
    if (productFile instanceof File && productFile.size > 0) {
      const ext = safeExt(productFile.name, ".pdf");
      const format: "PDF" | "EPUB" = ext === ".epub" ? "EPUB" : "PDF";
      const fileKey = `products/${slug}${ext}`;
      const absPrivate = path.join(process.cwd(), "storage", "private", fileKey);
      fs.mkdirSync(path.dirname(absPrivate), { recursive: true });
      const buf = Buffer.from(await productFile.arrayBuffer());
      fs.writeFileSync(absPrivate, buf);
      uploadedProductFile = {
        format,
        fileKey,
        fileName: productFile.name || `${title}${ext}`,
        sizeBytes: buf.byteLength,
      };
    }

    const type =
      (body.type as "ebook" | "course" | "tutorial" | "service" | "bundle") ?? "ebook";
    const defaultFormat: s.Format =
      type === "course" ? "Video" : type === "service" ? "Live" : "PDF";
    const existingFormats = existing?.formats ?? [];
    const formats: s.Format[] = uploadedProductFile
      ? Array.from(new Set([...existingFormats, uploadedProductFile.format]))
      : existingFormats.length > 0
        ? existingFormats
        : [defaultFormat];

    const outcomes = String(body.outcomesText ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const tocLines = String(body.tocText ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const toc =
      tocLines.length > 0
        ? tocLines.map((line) => ({ title: line }))
        : (existing?.toc ?? []);

    const priceCents = dollarsToCents(body.priceUsd);
    const salePriceCents = body.salePriceUsd
      ? dollarsToCents(body.salePriceUsd) || null
      : null;

    const values = {
      slug,
      title,
      subtitle: String(body.subtitle ?? "").trim(),
      description: String(body.description ?? "").trim(),
      type,
      categorySlug: String(body.categorySlug ?? "crypto"),
      level: (body.level as "beginner" | "intermediate" | "advanced") ?? "beginner",
      priceCents,
      salePriceCents,
      isFree: Boolean(body.isFree === true || body.isFree === "on" || body.isFree === "true"),
      featured: Boolean(
        body.featured === true || body.featured === "on" || body.featured === "true",
      ),
      status: (body.status as "draft" | "published") ?? "published",
      isSample: false,
      pages: body.pages ? Number(body.pages) : null,
      cover,
      sampleFileKey,
      formats,
      outcomes: outcomes.length > 0 ? outcomes : (existing?.outcomes ?? []),
      toc,
      seoTitle: body.seoTitle ? String(body.seoTitle) : null,
      seoDescription: body.seoDescription ? String(body.seoDescription) : null,
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(s.products)
      .values(values)
      .onConflictDoUpdate({ target: s.products.slug, set: values })
      .returning();

    if (saved && uploadedProductFile) {
      await db
        .delete(s.productFiles)
        .where(
          and(
            eq(s.productFiles.productId, saved.id),
            eq(s.productFiles.format, uploadedProductFile.format),
          ),
        );
      await db.insert(s.productFiles).values({
        productId: saved.id,
        format: uploadedProductFile.format,
        fileKey: uploadedProductFile.fileKey,
        fileName: uploadedProductFile.fileName,
        sizeBytes: uploadedProductFile.sizeBytes,
      });
    }

    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "upsert-product",
      entity: "product",
      entityId: saved?.id,
      data: {
        slug,
        priceCents: values.priceCents,
        uploadedCover: Boolean(coverFile instanceof File && coverFile.size > 0),
        uploadedFile: Boolean(uploadedProductFile),
      },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ message: `Saved product "${title}".` });
  }

  if (action === "delete-product") {
    const productId = String(body.productId ?? "");
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }
    await db.delete(s.products).where(eq(s.products.id, productId));
    await db.insert(s.auditLogs).values({
      actorId: admin.id,
      action: "delete-product",
      entity: "product",
      entityId: productId,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ message: "Product deleted from store." });
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

    revalidatePath("/", "layout");
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
    const value =
      type === "fixed"
        ? Math.max(1, dollarsToCents(body.value ?? 5))
        : Math.min(100, Math.max(1, Math.round(Number(body.value ?? 10))));
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
