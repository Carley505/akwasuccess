import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { BookOpen, Clock, FileDown, LogOut, Shield } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { DOWNLOAD_EXPIRY_HOURS, createSignedDownloadToken } from "@/lib/storage";
import { syncUserWooOrders } from "@/lib/woocommerce";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MagicLinkLoginForm,
  ResendDownloadsForm,
} from "@/components/account/AccountAuthForms";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Account & Library",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = (await searchParams) ?? {};
  const redirectParam = Array.isArray(sp.redirect) ? sp.redirect[0] : sp.redirect;
  const emailParam = Array.isArray(sp.email) ? sp.email[0] : sp.email;
  const redirectTo =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/account";

  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <PageHeader
          title="Sign Up / Log In to My Account"
          intro="Sign in or create your account with a passwordless magic link to view your complete order history, save & persist your cart items across devices, and generate fresh 4-hour download links anytime."
          breadcrumbs={<Breadcrumbs items={[{ name: "Account" }]} />}
        />

        <Section>
          <div className="grid gap-8 md:grid-cols-2">
            <MagicLinkLoginForm redirectTo={redirectTo} defaultEmail={emailParam} />
            <ResendDownloadsForm />
          </div>
        </Section>
      </>
    );
  }

  // Sync any orders (including past guest checkouts) from WooCommerce for this user
  await syncUserWooOrders(user).catch(() => {});

  const db = await getDb();
  const [ents, userOrders] = await Promise.all([
    db
      .select()
      .from(s.entitlements)
      .where(and(eq(s.entitlements.userId, user.id), isNull(s.entitlements.revokedAt)))
      .orderBy(desc(s.entitlements.createdAt)),
    db
      .select()
      .from(s.orders)
      .where(eq(s.orders.userId, user.id))
      .orderBy(desc(s.orders.createdAt)),
  ]);

  const libraryItems: {
    entitlementId: string;
    product: s.Product;
    downloadUrl?: string;
    format?: string;
  }[] = [];

  for (const ent of ents) {
    const [prod] = await db.select().from(s.products).where(eq(s.products.id, ent.productId));
    if (!prod) continue;
    const [file] = await db
      .select()
      .from(s.productFiles)
      .where(eq(s.productFiles.productId, prod.id));

    const token = file
      ? await createSignedDownloadToken({
          entitlementId: ent.id,
          productFileId: file.id,
          userId: user.id,
          buyerEmail: user.email,
        })
      : undefined;

    libraryItems.push({
      entitlementId: ent.id,
      product: prod,
      downloadUrl: token ? `/api/download/${token}` : undefined,
      format: file?.format ?? "PDF",
    });
  }

  return (
    <>
      <PageHeader
        title="My Account"
        intro={`Signed in as ${user.email} • Your cart items and order history are synced to your account.`}
        breadcrumbs={<Breadcrumbs items={[{ name: "Account" }]} />}
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LinkButton href="/account/library" size="sm">
            My Library ({libraryItems.length})
          </LinkButton>
          {user.role === "admin" && (
            <LinkButton
              href="/admin"
              size="sm"
              variant="secondary"
              icon={<Shield className="size-4" aria-hidden />}
            >
              Owner Admin Panel
            </LinkButton>
          )}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-muted hover:text-fg inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold"
            >
              <LogOut className="size-4" aria-hidden />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Library */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="gold-rule text-2xl">My Library &amp; Courses</h2>
              <span className="text-muted inline-flex items-center gap-1 text-xs">
                <Clock className="size-3.5" aria-hidden />
                Links valid for {DOWNLOAD_EXPIRY_HOURS} hours (refresh anytime for a new link)
              </span>
            </div>

            {libraryItems.length === 0 ? (
              <div className="card space-y-3 p-6">
                <p className="text-muted text-sm">
                  You do not have any eBooks or courses in your library yet.
                </p>
                <LinkButton href="/shop" size="sm">
                  Browse eBooks &amp; Courses
                </LinkButton>
              </div>
            ) : (
              <ul className="space-y-3">
                {libraryItems.map(({ entitlementId, product, downloadUrl, format }) => (
                  <li
                    key={entitlementId}
                    className="card flex flex-wrap items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="green">{product.type}</Badge>
                        <span className="text-link text-xs font-semibold">Access Confirmed</span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold">{product.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold no-underline"
                        >
                          <FileDown className="size-4" aria-hidden />
                          <span>
                            Download {format} ({DOWNLOAD_EXPIRY_HOURS}h link)
                          </span>
                        </a>
                      )}
                      {(product.type === "course" || product.type === "tutorial") && (
                        <LinkButton
                          href={`/account/courses/${product.slug}`}
                          size="sm"
                          variant="secondary"
                          icon={<BookOpen className="size-4" aria-hidden />}
                        >
                          Course &amp; video player
                        </LinkButton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Orders & Resend tool */}
          <div className="space-y-6 lg:col-span-5">
            <div>
              <h2 className="gold-rule text-2xl">Order history &amp; receipts</h2>
              {userOrders.length === 0 ? (
                <p className="text-muted mt-3 text-sm">No orders yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {userOrders.map((o) => (
                    <li
                      key={o.id}
                      className="card flex items-center justify-between gap-3 p-4 text-sm"
                    >
                      <div>
                        <Link
                          href={`/checkout/order/${o.id}`}
                          className="font-bold hover:underline"
                        >
                          Order #{o.number}
                        </Link>
                        <p className="text-muted text-xs">
                          {formatDate(o.createdAt)} • <span className="capitalize">{o.status}</span>
                          {o.wooOrderId ? ` • WC #${o.wooOrderId}` : ""}
                        </p>
                      </div>
                      <span className="font-bold">{formatMoney(o.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ResendDownloadsForm />
          </div>
        </div>
      </Section>
    </>
  );
}
