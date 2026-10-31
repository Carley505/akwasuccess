"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input } from "@/components/ui/Form";

export function MagicLinkLoginForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDevUrl(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        devVerifyUrl?: string;
      };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not send sign-in link." });
      } else {
        setStatus({
          tone: "success",
          message: data.message ?? "Sign-in link sent! Check your email inbox.",
        });
        if (data.devVerifyUrl) setDevUrl(data.devVerifyUrl);
      }
    } catch {
      setStatus({ tone: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-xl font-bold">Sign in with a magic link</h2>
      <p className="text-muted text-sm">
        No password to remember. Enter the email address you used at checkout and we will email you
        a one-click sign-in link.
      </p>

      <Field id="magic-email" label="Email address">
        <Input
          id="magic-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      {devUrl && (
        <p className="border-line bg-surface-2 rounded border p-3 text-xs">
          <strong>Development preview link:</strong>{" "}
          <a href={devUrl} className="link font-semibold">
            Click here to complete sign-in immediately
          </a>
        </p>
      )}

      <Button type="submit" loading={loading}>
        Send sign-in link
      </Button>
    </form>
  );
}

export function ResendDownloadsForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account/resend-downloads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not resend download links." });
      } else {
        setStatus({
          tone: "success",
          message:
            data.message ??
            "If any purchases exist for that email, fresh download links are on their way.",
        });
      }
    } catch {
      setStatus({ tone: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-xl font-bold">Resend my download links</h2>
      <p className="text-muted text-sm">
        Lost your receipt email or switched phones? Enter your order email and we will email fresh
        download links for every eBook you own.
      </p>

      <Field id="resend-email" label="Order email address">
        <Input
          id="resend-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      <Button type="submit" variant="secondary" loading={loading}>
        Resend my download links
      </Button>
    </form>
  );
}
