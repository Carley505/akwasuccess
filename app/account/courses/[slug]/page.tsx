import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { getCourseBySlug } from "@/lib/db/queries";
import { createSignedDownloadToken } from "@/lib/storage";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CoursePlayerClient } from "@/components/courses/CoursePlayerClient";

export const metadata: Metadata = {
  title: "Course & Resource Access Player",
};

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialLessonSlug = Array.isArray(sp.lesson) ? sp.lesson[0] : sp.lesson;
  const orderIdParam = Array.isArray(sp.order) ? sp.order[0] : sp.order;

  const data = await getCourseBySlug(slug);
  if (!data) notFound();

  const user = await getSessionUser();
  const db = await getDb();

  let hasFullAccess = data.product.isFree;
  let initialCompletedIds: string[] = [];
  let activeEntitlement: typeof s.entitlements.$inferSelect | null = null;
  let buyerEmail = user?.email ?? "";
  let orderNumber: string | undefined;

  if (user) {
    if (user.role === "admin") hasFullAccess = true;
    const [ent] = await db
      .select()
      .from(s.entitlements)
      .where(
        and(
          eq(s.entitlements.userId, user.id),
          eq(s.entitlements.productId, data.product.id),
          isNull(s.entitlements.revokedAt),
        ),
      );
    if (ent) {
      hasFullAccess = true;
      activeEntitlement = ent;
    }

    const progRows = await db
      .select()
      .from(s.progress)
      .where(and(eq(s.progress.userId, user.id), eq(s.progress.kind, "lesson")));
    initialCompletedIds = progRows.map((r) => r.itemId);
  }

  // Also allow a guest who just completed payment to access via ?order=<orderId>
  if (!activeEntitlement && orderIdParam) {
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderIdParam));
    if (order && order.status === "paid" && order.userId) {
      const [ent] = await db
        .select()
        .from(s.entitlements)
        .where(
          and(
            eq(s.entitlements.userId, order.userId),
            eq(s.entitlements.productId, data.product.id),
            isNull(s.entitlements.revokedAt),
          ),
        );
      if (ent) {
        hasFullAccess = true;
        activeEntitlement = ent;
        buyerEmail = order.email;
        orderNumber = order.number;
      }
    }
  }

  let resourceDownloadUrl: string | null = null;
  if (hasFullAccess && activeEntitlement && buyerEmail) {
    const [file] = await db
      .select()
      .from(s.productFiles)
      .where(eq(s.productFiles.productId, data.product.id));
    if (file) {
      const token = await createSignedDownloadToken({
        entitlementId: activeEntitlement.id,
        productFileId: file.id,
        userId: activeEntitlement.userId,
        buyerEmail,
        orderNumber,
      });
      resourceDownloadUrl = `/api/download/${token}`;
    }
  }

  return (
    <>
      <PageHeader
        title={data.product.title}
        intro="Course & Resource Player — your verified access page for course videos and 4-hour timed resource downloads."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[
              { name: "Courses", href: "/courses" },
              { name: data.product.title, href: `/courses/${data.product.slug}` },
              { name: "Player & Access" },
            ]}
          />,
        ]}
      />

      <Section>
        <CoursePlayerClient
          courseSlug={data.product.slug}
          courseTitle={data.product.title}
          courseDescription={data.product.description}
          modules={data.curriculum}
          hasFullAccess={hasFullAccess}
          resourceDownloadUrl={resourceDownloadUrl}
          initialCompletedIds={initialCompletedIds}
          initialLessonSlug={initialLessonSlug}
        />
      </Section>
    </>
  );
}
