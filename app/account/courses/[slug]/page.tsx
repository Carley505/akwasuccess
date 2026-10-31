import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { getCourseBySlug } from "@/lib/db/queries";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CoursePlayerClient } from "@/components/courses/CoursePlayerClient";

export const metadata: Metadata = {
  title: "Course Player",
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

  const data = await getCourseBySlug(slug);
  if (!data) notFound();

  const user = await getSessionUser();
  const db = await getDb();

  let hasFullAccess = data.product.isFree;
  let initialCompletedIds: string[] = [];

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
    if (ent) hasFullAccess = true;

    const progRows = await db
      .select()
      .from(s.progress)
      .where(and(eq(s.progress.userId, user.id), eq(s.progress.kind, "lesson")));
    initialCompletedIds = progRows.map((r) => r.itemId);
  }

  return (
    <>
      <PageHeader
        title={data.product.title}
        intro="Course player — pick up right where you left off. Mobile Data Saver (360p) is enabled by default on phones."
        breadcrumbs={[
          <Breadcrumbs
            key="b"
            items={[
              { name: "Courses", href: "/courses" },
              { name: data.product.title, href: `/courses/${data.product.slug}` },
              { name: "Player" },
            ]}
          />,
        ]}
      />

      <Section>
        <CoursePlayerClient
          courseSlug={data.product.slug}
          courseTitle={data.product.title}
          modules={data.curriculum}
          hasFullAccess={hasFullAccess}
          initialCompletedIds={initialCompletedIds}
          initialLessonSlug={initialLessonSlug}
        />
      </Section>
    </>
  );
}
