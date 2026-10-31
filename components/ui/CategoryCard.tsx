"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/content/categories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { track } from "@/lib/analytics/client";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      onClick={() => track("category_click", { category: category.slug })}
      className="card group flex flex-col justify-between gap-4 p-5 no-underline transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary"
    >
      <div>
        <div className="bg-tint text-link mb-4 inline-flex size-12 items-center justify-center rounded-lg">
          <CategoryIcon name={category.icon} className="size-6" />
        </div>
        <h3 className="group-hover:text-link text-lg font-bold transition-colors">
          {category.name}
        </h3>
        <p className="text-muted mt-1.5 text-sm">{category.description}</p>
      </div>
      <span className="text-link inline-flex items-center gap-1.5 text-sm font-semibold">
        Explore {category.shortName}
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
