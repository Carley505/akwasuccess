import type { Metadata } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { BookOpen, FileDown } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { createSignedDownloadToken } from "@/lib/storage";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  MagicLinkLoginForm,
  ResendDownloadsForm,
} from "@/components/account/AccountAuthForms";

export const metadata: Metadata = {
  title: "My Digital Library",
};

export default async function AccountLibraryPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <PageHeader
          title="My Digital Library"
          intro="Sign in with your email magic link or resend your download links below."
          breadcrumbs={[
            <Breadcrumbs
              key="b"
              items={[{ name: "Account", href: "/account" }, { name: "Library" }]}
            />,
          ]}
        />
        <Section>
          <div className="grid gap-8 md:grid-cols-2">
            <MagicLinkLoginForm redirectTo="/account/library" />
            <ResendDownloadsForm />
          </div>
        </Section>
      </>
    );
  }

  const db = await getDb();
  const ents = await db
    .select()
    .from(s.entitlements)
    .where(and(eq(s.entitlements.userId, user.id), isNull(s.entitlements.revokedAt)))
    .orderBy(desc(s.entitlements.createdAt));

  const items: {
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

    items.push({
      entitlementId: ent.id,
      product: prod,
      downloadUrl: token ? `/api/download/${token}` : undefined,
      format: file?.format ?? "PDF",
    });
  }

  return (
    <>
      <PageHeader
        title="My Digital Library"
        intro="Every eBook and course you own. Signed download links expire after 10 minutes—refresh this page anytime for a new link."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[{ name: "Account", href: "/account" }, { name: "Library" }]}
          />,
        ]}
      />

      <Section>
        {items.length === 0 ? (
          <div className="card space-y-4 p-8 text-center">
            <h2 className="text-xl font-bold">Your library is empty</h2>
            <p className="text-muted text-sm">
              Purchased eBooks and courses appear here immediately after checkout.
            </p>
            <LinkButton href="/shop">Browse eBooks</LinkButton>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map(({ entitlementId, product, downloadUrl, format }) => (
              <article
                key={entitlementId}
                className="card flex flex-col justify-between gap-4 p-6"
              >
                <div>
                  <Badge tone="green">{product.type}</Badge>
                  <h2 className="mt-2 text-xl font-bold">{product.title}</h2>
                  {product.subtitle && (
                    <p className="text-muted mt-1 text-sm">{product.subtitle}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold no-underline"
                    >
                      <FileDown className="size-4" aria-hidden />
                      <span>Download ({format})</span>
                    </a>
                  )}
                  {product.type === "course" && (
                    <LinkButton
                      href={`/account/courses/${product.slug}`}
                      size="sm"
                      variant="secondary"
                      icon={<BookOpen className="size-4" aria-hidden />}
                    >
                      Open course player
                    </LinkButton>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
