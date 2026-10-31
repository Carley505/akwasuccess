import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Section } from "@/components/ui/Layout";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "You are offline",
};

export default function OfflinePage() {
  return (
    <Section className="text-center">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="bg-tint text-link mx-auto grid size-14 place-items-center rounded-full">
          <WifiOff className="size-7" aria-hidden />
        </div>
        <h1 className="gold-rule text-center text-3xl">You appear to be offline</h1>
        <p className="text-muted">
          Please check your mobile data or Wi-Fi connection and refresh this page. Any eBooks you
          have already downloaded to your phone can still be opened from your device files.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <LinkButton href="/">Retry home</LinkButton>
          <LinkButton href="/shop" variant="secondary">
            Browse shop
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
