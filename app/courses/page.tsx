import type { Metadata } from "next";
import Link from "next/link";
import { Clock, PlayCircle } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge, LevelBadge, SampleBadge, typeLabel } from "@/components/ui/Badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { BookMockup } from "@/components/product/BookMockup";
import { LinkButton } from "@/components/ui/Button";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { getCoursesWithCurriculum } from "@/lib/db/queries";
import { effectivePrice, isOnSale, isPurchasable } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses & Tutorials",
  description:
    "Structured courses and tutorials on cryptocurrency, blockchain, personal finance, and technical skills.",
  alternates: { canonical: "/courses" },
};

function formatDuration(sec: number) {
  if (!sec) return "Self-paced";
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export default async function CoursesCatalogPage() {
  const courses = await getCoursesWithCurriculum();

  return (
    <>
      <PageHeader
        title="Courses & Tutorials"
        intro="Step-by-step video and guided courses designed for mobile and desktop learners, with progress tracking and completion certificates."
        breadcrumbs={<Breadcrumbs items={[{ name: "Courses" }]} />}
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((c) => {
            const price = effectivePrice(c);
            const canBuy = isPurchasable(c);
            const onSale = isOnSale(c);
            return (
              <article
                key={c.id}
                className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/courses/${c.slug}`}
                  className="mx-auto block w-40 shrink-0 no-underline sm:mx-0"
                >
                  <BookMockup
                    title={c.title}
                    subtitle={c.subtitle}
                    categorySlug={c.categorySlug}
                    type={c.type}
                    cover={c.cover}
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone="green">{typeLabel[c.type] ?? "Course"}</Badge>
                      <LevelBadge level={c.level} />
                      {c.isSample && <SampleBadge />}
                    </div>

                    <h2 className="text-xl font-bold">
                      <Link href={`/courses/${c.slug}`} className="hover:text-link no-underline">
                        {c.title}
                      </Link>
                    </h2>

                    {c.subtitle && <p className="text-muted mt-1 text-sm">{c.subtitle}</p>}

                    <div className="text-muted mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle className="text-link size-4" aria-hidden />
                        {c.lessonsCount > 0 ? `${c.lessonsCount} lessons` : "Curriculum updating"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="text-link size-4" aria-hidden />
                        {formatDuration(c.totalDurationSec)}
                      </span>
                    </div>
                  </div>

                  <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <PriceTag
                      amountCents={price}
                      originalCents={onSale ? c.priceCents : null}
                      isFree={c.isFree}
                      comingSoon={!canBuy}
                    />
                    <LinkButton href={`/courses/${c.slug}`} size="sm">
                      View curriculum
                    </LinkButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12">
          <DisclaimerBanner variant="crypto" compact />
        </div>
      </Section>
    </>
  );
}
