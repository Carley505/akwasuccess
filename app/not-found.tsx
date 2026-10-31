import type { Metadata } from "next";
import { Section } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Section className="text-center">
      <div className="mx-auto max-w-lg space-y-5">
        <p className="text-gold-text text-sm font-bold tracking-wider uppercase">404 error</p>
        <h1 className="gold-rule text-center text-3xl">We could not find that page</h1>
        <p className="text-muted">
          The link may have changed, or the page may have moved when we rebuilt Akwasuccess. Try
          searching below or visit the shop.
        </p>

        <form action="/shop" method="get" role="search" className="mx-auto flex max-w-md gap-2 pt-2">
          <label htmlFor="notfound-q" className="sr-only">
            Search eBooks and courses
          </label>
          <input
            id="notfound-q"
            name="q"
            type="search"
            placeholder="Search eBooks, courses, guides..."
            className="border-line bg-surface min-h-12 flex-1 rounded-md border px-3.5"
          />
          <button
            type="submit"
            className="bg-primary text-primary-fg hover:bg-primary-hover min-h-12 rounded-md px-5 font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <LinkButton href="/shop">Browse eBooks</LinkButton>
          <LinkButton href="/" variant="secondary">
            Back to home
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
