import type { Metadata } from "next";
import { desc, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MagicLinkLoginForm } from "@/components/account/AccountAuthForms";
import { AdminClient } from "@/components/admin/AdminClient";

export const metadata: Metadata = {
  title: "Owner Admin Panel",
};

export default async function AdminPage() {
  const user = await getSessionUser();
  const adminEmail = process.env.ADMIN_EMAIL ?? "callistusngeywa001@gmail.com";

  if (!user || user.role !== "admin") {
    return (
      <>
        <PageHeader
          title="Owner Admin Panel"
          intro={`Protected area. Sign in with the owner email (${adminEmail}) to manage products, courses, orders, articles, and reviews.`}
          breadcrumbs={<Breadcrumbs items={[{ name: "Admin" }]} />}
        />
        <Section>
          <div className="mx-auto max-w-md">
            <MagicLinkLoginForm redirectTo="/admin" defaultEmail={adminEmail} />
          </div>
        </Section>
      </>
    );
  }

  const db = await getDb();
  const [
    allProducts,
    allOrders,
    allReviews,
    allTestimonials,
    [subCount],
  ] = await Promise.all([
    db.select().from(s.products).orderBy(desc(s.products.updatedAt)),
    db.select().from(s.orders).orderBy(desc(s.orders.createdAt)).limit(50),
    db.select().from(s.reviews).orderBy(desc(s.reviews.createdAt)).limit(30),
    db.select().from(s.testimonials).orderBy(desc(s.testimonials.createdAt)).limit(30),
    db.select({ count: sql<number>`count(*)::int` }).from(s.subscribers),
  ]);

  const paidOrders = allOrders.filter((o) => o.status === "paid");
  const pendingOrders = allOrders.filter((o) => o.status === "pending");
  const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <>
      <PageHeader
        title="Owner Admin & CMS"
        intro="Add or edit products, upload cover images and PDF/EPUB files, update USD prices, publish articles, moderate reviews, and manage orders without code."
        breadcrumbs={<Breadcrumbs items={[{ name: "Admin" }]} />}
      />

      <Section>
        <AdminClient
          stats={{
            revenueCents,
            paidOrders: paidOrders.length,
            pendingOrders: pendingOrders.length,
            subscribersCount: subCount?.count ?? 0,
          }}
          products={allProducts.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            type: p.type,
            categorySlug: p.categorySlug,
            level: p.level,
            priceCents: p.priceCents,
            salePriceCents: p.salePriceCents,
            pages: p.pages,
            featured: p.featured,
            isSample: p.isSample,
            coverUrl: p.cover?.url ?? null,
            outcomes: p.outcomes ?? [],
            toc: (p.toc ?? []).map((t) => t.title),
            status: p.status,
            wooId: p.wooId ?? null,
          }))}
          orders={allOrders.map((o) => ({
            id: o.id,
            number: o.number,
            email: o.email,
            status: o.status,
            totalCents: o.totalCents,
            createdAt: o.createdAt.toISOString(),
          }))}
          reviews={allReviews.map((r) => ({
            id: r.id,
            displayName: r.displayName,
            rating: r.rating,
            body: r.body,
            status: r.status,
          }))}
          testimonials={allTestimonials.map((t) => ({
            id: t.id,
            name: t.name,
            quote: t.quote,
            status: t.status,
          }))}
          envStatus={{
            paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
            emailConfigured: Boolean(process.env.EMAIL_API_KEY),
            woocommerceConfigured: Boolean(
              process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET,
            ),
            woocommerceUrl: process.env.WOOCOMMERCE_URL || "https://cms.akwasuccess.com",
          }}
        />
      </Section>
    </>
  );
}
