"use client";

import { Section } from "@/components/ui/Layout";
import { Button, LinkButton } from "@/components/ui/Button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Section className="text-center">
      <div className="mx-auto max-w-lg space-y-5">
        <p className="text-gold-text text-sm font-bold tracking-wider uppercase">
          Something went wrong
        </p>
        <h1 className="gold-rule text-center text-3xl">We hit an unexpected issue</h1>
        <p className="text-muted">
          Please try loading the page again. Your cart and library are safe.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button onClick={() => reset()}>Try again</Button>
          <LinkButton href="/shop" variant="secondary">
            Go to shop
          </LinkButton>
          <LinkButton href="/" variant="ghost">
            Home
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
