import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { CheckCircle2, FileDown, BookOpen, ArrowRight } from "lucide-react";
import { getDb, schema as s } from "@/lib/db";
import { createSignedDownloadToken } from "@/lib/storage";
import { PageHeader, Section } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";
import { formatDate, formatKes } from "@/lib/utils";
import { learningPaths } from "@/content/paths";

export const metadata: Metadata = {
  title: "Order Confirmation & Downloads",
};

type Params = Promise<{ id: string }>;

export default async function OrderConfirmationPage({ params }: { params: Params }) {
  const { id } = await params;
  const db = await getDb();
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!order) notFound();

  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, order.id));

  // Fetch entitlements + generate fresh 10-minute signed download links
  const downloads: {
    productId: string;
    slug: string;
    title: string;
    type: string;
    downloadUrl?: string;
    format?: string;
  }[] = [];

  if (order.status === "paid" && order.userId) {
    const ents = await db
      .select()
      .from(s.entitlements)
      .where(eq(s.entitlements.userId, order.userId));

    const orderProductIds = new Set(items.map((i) => i.productId));
    const prods =
      orderProductIds.size > 0
        ? await db
            .select()
            .from(s.products)
            .where(inArray(s.products.id, Array.from(orderProductIds)))
        : [];
    for (const p of prods) {
      for (const childId of p.bundleItems ?? []) {
        orderProductIds.add(childId);
      }
    }

    for (const ent of ents) {
      if (!orderProductIds.has(ent.productId)) continue;
      const [prod] = await db.select().from(s.products).where(eq(s.products.id, ent.productId));
      const [file] = await db
        .select()
        .from(s.productFiles)
        .where(eq(s.productFiles.productId, ent.productId));

      if (prod) {
        const token = file
          ? await createSignedDownloadToken({
              entitlementId: ent.id,
              productFileId: file.id,
              userId: order.userId,
              buyerEmail: order.email,
              orderNumber: order.number,
            })
          : undefined;
        downloads.push({
          productId: prod.id,
          slug: prod.slug,
          title: prod.title,
          type: prod.type,
          downloadUrl: token ? `/api/download/${token}` : undefined,
          format: file?.format ?? "PDF",
        });
      }
    }
  }

  return (
    <>
      <PageHeader
        title={
          order.status === "paid"
            ? `Thank you! Order #${order.number} is confirmed`
            : `Order #${order.number} (${order.status})`
        }
        intro={
          order.status === "paid"
            ? `We have also emailed your receipt and download links to ${order.email}.`
            : "Your order is awaiting payment confirmation."
        }
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {order.status === "paid" && (
              <div className="card space-y-4 p-6">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="text-link size-6" aria-hidden />
                  <h2 className="text-xl font-bold">Your instant downloads</h2>
                </div>
                <p className="text-muted text-sm">
                  Signed download links expire after 10 minutes for security, and you can generate
                  fresh links anytime in your{" "}
                  <Link href="/account/library" className="link">
                    Account Library
                  </Link>
                  .
                </p>

                <ul className="divide-line divide-y">
                  {downloads.map((d) => (
                    <li
                      key={d.productId}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="font-serif font-bold">{d.title}</p>
                        <p className="text-muted text-xs capitalize">{d.type}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.downloadUrl && (
                          <a
                            href={d.downloadUrl}
                            className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold no-underline"
                          >
                            <FileDown className="size-4" aria-hidden />
                            <span>Download {d.format}</span>
                          </a>
                        )}
                        {d.type === "course" && (
                          <LinkButton
                            href={`/account/courses/${d.slug}`}
                            size="sm"
                            variant="secondary"
                            icon={<BookOpen className="size-4" aria-hidden />}
                          >
                            Open course player
                          </LinkButton>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Non-aggressive "Continue your path" suggestion (Spec 9 #8) */}
            <div className="card bg-surface-2 space-y-3 p-6">
              <h2 className="text-lg font-bold">Continue your learning path</h2>
              <p className="text-muted text-sm">
                Pair your new guide with our free step-by-step learning paths and track each topic
                as you complete it.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-sm">
                {learningPaths.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/learn/paths/${p.slug}`}
                    className="text-link inline-flex items-center gap-1 font-semibold no-underline hover:underline"
                  >
                    {p.title} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="card space-y-4 p-6">
              <h2 className="text-lg font-bold">Receipt summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Order number</dt>
                  <dd className="font-semibold">#{order.number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Date</dt>
                  <dd className="font-semibold">{formatDate(order.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Email</dt>
                  <dd className="font-semibold">{order.email}</dd>
                </div>
                <div className="border-line flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total paid</dt>
                  <dd>{formatKes(order.totalKes)}</dd>
                </div>
              </dl>

              <LinkButton href="/account/library" variant="secondary" block size="sm">
                Go to my Account Library
              </LinkButton>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
