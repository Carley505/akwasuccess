"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { BookMockup } from "@/components/product/BookMockup";
import { Modal } from "@/components/ui/Modal";
import type { ImageRef, TocSection } from "@/lib/db/schema";

/**
 * Product cover + preview-pages gallery (Section 8.3).
 * Shows the 2:3 cover mockup plus 3–4 flat preview page thumbnails that open
 * in a zoomable modal when tapped or clicked.
 */
export function ProductGallery({
  title,
  subtitle,
  categorySlug,
  type,
  cover,
  previewImages,
  toc,
  outcomes,
}: {
  title: string;
  subtitle?: string;
  categorySlug: string;
  type: string;
  cover?: ImageRef | null;
  previewImages: ImageRef[];
  toc: TocSection[];
  outcomes: string[];
}) {
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);

  const generatedPages = [
    {
      heading: "Page Preview 1 — Table of Contents",
      lines:
        toc.length > 0
          ? toc.map((t, i) => `${i + 1}. ${t.title}`)
          : [
              "1. Introduction & core concepts",
              "2. Step-by-step practical fundamentals",
              "3. Real-world examples & safety checklist",
              "4. Summary & next steps",
            ],
    },
    {
      heading: "Page Preview 2 — What You Will Learn",
      lines:
        outcomes.length > 0
          ? outcomes.slice(0, 4)
          : [
              "Understand the fundamentals in plain, everyday English",
              "Follow clear diagrams and real East African examples",
              "Avoid common beginner mistakes and stay safe",
            ],
    },
    {
      heading: "Page Preview 3 — Key Takeaways & Checklist",
      lines: [
        "• Written for complete beginners—no prior background needed.",
        "• Read comfortably on any Android phone, iPhone, tablet, or computer.",
        "• Includes a printable summary checklist at the end of each part.",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-[280px] sm:max-w-[320px]">
        <BookMockup
          title={title}
          subtitle={subtitle}
          categorySlug={categorySlug}
          type={type}
          cover={cover}
          priority
        />
      </div>

      <div>
        <p className="text-muted mb-2 text-xs font-bold tracking-wider uppercase">
          Inside the book (tap to zoom)
        </p>

        {previewImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {previewImages.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setZoomIdx(i)}
                className="card group relative aspect-[3/4] overflow-hidden p-1 text-left"
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${title} preview page ${i + 1}`}
                  width={img.width ?? 360}
                  height={img.height ?? 480}
                  className="h-full w-full rounded object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {generatedPages.map((pg, i) => (
              <button
                key={pg.heading}
                type="button"
                onClick={() => setZoomIdx(i)}
                aria-label={`Zoom ${pg.heading}`}
                className="card hover:border-primary group flex aspect-[3/4] flex-col justify-between p-3 text-left transition-colors"
              >
                <div>
                  <span className="mb-1.5 block h-0.5 w-6 bg-gold-500" aria-hidden />
                  <p className="font-serif text-xs leading-snug font-bold line-clamp-2">
                    {pg.heading}
                  </p>
                  <ul className="text-muted mt-1.5 space-y-1 text-[11px] leading-snug">
                    {pg.lines.slice(0, 3).map((l) => (
                      <li key={l} className="line-clamp-1">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="text-link inline-flex items-center gap-1 text-[11px] font-semibold">
                  <ZoomIn className="size-3.5" aria-hidden /> Zoom
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={zoomIdx !== null}
        onOpenChange={(o) => {
          if (!o) setZoomIdx(null);
        }}
        title={
          zoomIdx !== null
            ? (generatedPages[zoomIdx]?.heading ?? `${title} — Preview`)
            : "Preview"
        }
      >
        {zoomIdx !== null && (
          <div className="bg-surface-2 border-line space-y-3 rounded-lg border p-6">
            <p className="text-gold-text text-xs font-bold tracking-wider uppercase">{title}</p>
            <h4 className="font-serif text-lg font-bold">
              {generatedPages[zoomIdx]?.heading}
            </h4>
            <ul className="space-y-2 text-sm">
              {(generatedPages[zoomIdx]?.lines ?? []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
