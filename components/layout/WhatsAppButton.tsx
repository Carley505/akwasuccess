"use client";

import { MessageCircle } from "lucide-react";
import { site, whatsappLink } from "@/content/site";
import { track } from "@/lib/analytics/client";

/**
 * Floating WhatsApp support button on desktop (`sm+`).
 * Hidden when `site.whatsapp` is empty so no broken link renders.
 */
export function WhatsAppButton() {
  if (!site.whatsapp) return null;
  return (
    <a
      href={whatsappLink("Hello Akwasuccess, I have a question about your resources.")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { location: "floating" })}
      aria-label="Chat with Akwasuccess on WhatsApp"
      className="bg-primary text-primary-fg hover:bg-primary-hover fixed right-5 bottom-5 z-40 hidden min-h-12 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold no-underline shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
    >
      <MessageCircle className="size-5" strokeWidth={1.75} aria-hidden />
      <span>WhatsApp help</span>
    </a>
  );
}
