import Image from "next/image";
import { getCategory } from "@/content/categories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { typeLabel } from "@/components/ui/Badge";
import type { ImageRef } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

/**
 * 2:3 flat book-cover mockup (Section 3.5).
 * When the owner uploads a real cover image in /admin, it renders with
 * next/image. Until then, it renders a clean, flat typographic cover in brand
 * green & gold with no gradients or 3D effects.
 */
export function BookMockup({
  title,
  subtitle,
  categorySlug,
  type = "ebook",
  cover,
  priority = false,
  className,
}: {
  title: string;
  subtitle?: string;
  categorySlug: string;
  type?: string;
  cover?: ImageRef | null;
  priority?: boolean;
  className?: string;
}) {
  const cat = getCategory(categorySlug);

  return (
    <div
      className={cn(
        "border-line relative aspect-[2/3] w-full overflow-hidden rounded-lg border bg-green-900 text-white shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {/* Flat spine rule on left edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2.5 border-r border-white/15 bg-black/20"
      />
      {cover?.url ? (
        <Image
          src={cover.url}
          alt={cover.alt || `${title} cover`}
          width={cover.width ?? 480}
          height={cover.height ?? 720}
          priority={priority}
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-4 pl-6 sm:p-5 sm:pl-7">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="border-gold-500 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold tracking-wide uppercase">
              {typeLabel[type] ?? "eBook"}
            </span>
            {cat && <CategoryIcon name={cat.icon} className="size-4 text-gold-500" />}
          </div>

          <div className="my-auto py-3">
            <span className="mb-2.5 block h-0.5 w-8 bg-gold-500" aria-hidden />
            <p className="font-serif text-base leading-snug font-bold text-white sm:text-lg line-clamp-4">
              {title}
            </p>
            {subtitle && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/80">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/15 pt-2.5 text-[11px] tracking-wide text-white/85 uppercase">
            <span>Akwasuccess</span>
            <span>{cat?.shortName ?? "Guide"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
