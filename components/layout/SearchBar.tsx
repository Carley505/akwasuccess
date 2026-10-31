"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge, typeLabel } from "@/components/ui/Badge";
import { track } from "@/lib/analytics/client";

type SearchHit = {
  title: string;
  href: string;
  kind: "product" | "article";
  type?: string;
  category?: string;
};

/**
 * Search dialog with debounced instant suggestions and keyboard navigation
 * (ArrowUp / ArrowDown / Enter / Escape).
 */
export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { results?: SearchHit[] };
          setHits(data.results ?? []);
          setActiveIdx(-1);
          track("search_query", { q });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  function submitFullSearch() {
    const q = query.trim();
    setOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search eBooks, courses and articles"
        className="text-fg hover:text-link hover:bg-surface-2 inline-flex size-11 items-center justify-center rounded-md"
      >
        <Search className="size-5" strokeWidth={1.75} aria-hidden />
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Search Akwasuccess"
        description="Find eBooks, courses, tutorials and free beginner guides."
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (activeIdx >= 0 && hits[activeIdx]) {
              const target = hits[activeIdx]!;
              setOpen(false);
              router.push(target.href);
            } else {
              submitFullSearch();
            }
          }}
        >
          <div className="relative">
            <label htmlFor="site-search-input" className="sr-only">
              Search query
            </label>
            <input
              ref={inputRef}
              id="site-search-input"
              type="search"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={activeIdx >= 0 ? `${listboxId}-${activeIdx}` : undefined}
              placeholder="Try: crypto wallet, electrical basics, money..."
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (v.trim().length < 2) {
                  setHits([]);
                  setActiveIdx(-1);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && hits.length > 0) {
                  e.preventDefault();
                  setActiveIdx((i) => (i + 1) % hits.length);
                } else if (e.key === "ArrowUp" && hits.length > 0) {
                  e.preventDefault();
                  setActiveIdx((i) => (i - 1 + hits.length) % hits.length);
                }
              }}
              className="border-line bg-surface text-fg min-h-12 w-full rounded-md border px-4 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-muted hover:text-fg absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <ul id={listboxId} role="listbox" className="divide-line mt-4 divide-y">
            {loading && <li className="text-muted py-3 text-sm">Searching...</li>}
            {!loading && query.trim().length >= 2 && hits.length === 0 && (
              <li className="text-muted py-3 text-sm">
                No direct matches. Press Enter to search the full shop.
              </li>
            )}
            {hits.map((hit, idx) => (
              <li
                key={hit.href}
                id={`${listboxId}-${idx}`}
                role="option"
                aria-selected={idx === activeIdx}
              >
                <Link
                  href={hit.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded px-2 py-2.5 no-underline ${
                    idx === activeIdx ? "bg-tint text-link" : "hover:bg-surface-2"
                  }`}
                >
                  <span className="font-medium">{hit.title}</span>
                  <Badge tone={hit.kind === "article" ? "neutral" : "green"}>
                    {hit.kind === "article" ? "Article" : typeLabel[hit.type ?? "ebook"] ?? "eBook"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </form>
      </Modal>
    </>
  );
}
