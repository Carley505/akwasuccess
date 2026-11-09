"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Honeypot, Input, Select, Textarea } from "@/components/ui/Form";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          topic: fd.get("topic"),
          message: fd.get("message"),
          company_website: fd.get("company_website"),
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not send message right now." });
      } else {
        track("contact_submission", { topic: String(fd.get("topic") ?? "") });
        form.reset();
        setStatus({
          tone: "success",
          message:
            data.message ??
            "We have received your message and sent a confirmation to your email.",
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
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Your name">
          <Input id="contact-name" name="name" autoComplete="name" required />
        </Field>
        <Field id="contact-email" label="Email address">
          <Input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-phone" label="Phone number" optional>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 234 5678"
          />
        </Field>
        <Field id="contact-topic" label="Topic">
          <Select id="contact-topic" name="topic" defaultValue="ebooks">
            <option value="ebooks">eBooks &amp; downloads</option>
            <option value="courses">Courses &amp; tutorials</option>
            <option value="consulting">Crypto / financial education consulting</option>
            <option value="electrical">Electrical installation &amp; troubleshooting</option>
            <option value="other">General enquiry</option>
          </Select>
        </Field>
      </div>

      <Field id="contact-message" label="Message">
        <Textarea
          id="contact-message"
          name="message"
          required
          placeholder="How can we help you?"
        />
      </Field>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      <Button type="submit" loading={loading}>
        {t.actions.send}
      </Button>
    </form>
  );
}
