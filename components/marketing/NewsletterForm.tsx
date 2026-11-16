"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormAlert, Honeypot, Input } from "@/components/ui/Form";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n";

/**
 * Single-field newsletter / lead-magnet form with explicit privacy consent text
 * (Section 7, 8.1, 9.2).
 */
export function NewsletterForm({
  source = "footer",
  buttonLabel = t.actions.subscribe,
  idPrefix = "newsletter",
}: {
  source?: string;
  buttonLabel?: string;
  idPrefix?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDownloadUrl(null);
    const formData = new FormData(e.currentTarget);
    const honeypot = String(formData.get("company_website") ?? "");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source, company_website: honeypot }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        downloadUrl?: string;
      };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not subscribe right now." });
      } else {
        track("newsletter_signup", { source });
        setEmail("");
        const url = data.downloadUrl ?? "/samples/crypto-safety-checklist.pdf";
        setDownloadUrl(url);
        setStatus({
          tone: "success",
          message:
            data.message ??
            "Thank you! Your free Cryptocurrency Safety Checklist (PDF) is ready below.",
        });
        if (typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      setStatus({ tone: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const inputId = `${idPrefix}-email`;

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <Honeypot />
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <Input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:flex-1"
        />
        <Button type="submit" loading={loading} className="shrink-0">
          {buttonLabel}
        </Button>
      </div>
      <p className="text-muted text-xs">
        {t.trust.privacy} See our{" "}
        <Link href="/privacy-policy" className="link">
          privacy policy
        </Link>
        .
      </p>
      {status && (
        <FormAlert tone={status.tone}>
          <div className="space-y-2">
            <p>{status.message}</p>
            {downloadUrl && (
              <p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-xs font-semibold no-underline"
                >
                  Open &amp; Download Checklist (PDF) →
                </a>
              </p>
            )}
          </div>
        </FormAlert>
      )}
    </form>
  );
}
