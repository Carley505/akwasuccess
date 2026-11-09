"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Honeypot, Input, Textarea } from "@/components/ui/Form";

export function ShareStoryForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          location: fd.get("location"),
          productUsed: fd.get("productUsed"),
          quote: fd.get("quote"),
          consent: fd.get("consent") === "on",
          company_website: fd.get("company_website"),
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not submit your story." });
      } else {
        form.reset();
        setStatus({
          tone: "success",
          message:
            data.message ??
            "Thank you for sharing your story! It will appear here once reviewed by our team.",
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
      <h2 className="text-xl font-bold">Share your learning story</h2>
      <p className="text-muted text-sm">
        Have you read an Akwasuccess eBook, taken a course, or worked with us? Share an honest note
        about what you learned.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="story-name" label="Your name or initials">
          <Input id="story-name" name="name" required placeholder="e.g. A. Rivera" />
        </Field>
        <Field id="story-location" label="City / Country" optional>
          <Input id="story-location" name="location" placeholder="e.g. Toronto, Canada" />
        </Field>
      </div>

      <Field id="story-product" label="Which eBook, course or service did you use?" optional>
        <Input
          id="story-product"
          name="productUsed"
          placeholder="e.g. Basic Electrical, Electronics & Instrumentation eBook"
        />
      </Field>

      <Field id="story-quote" label="What did you learn or find helpful?">
        <Textarea
          id="story-quote"
          name="quote"
          required
          placeholder="Share your honest experience in 2 to 4 sentences..."
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 size-5 rounded border-line accent-[var(--green-700)]"
        />
        <span>
          I confirm this is my genuine experience and I give Akwasuccess permission to display my
          quote and name/initials on the website.
        </span>
      </label>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      <Button type="submit" loading={loading}>
        Submit story
      </Button>
    </form>
  );
}
