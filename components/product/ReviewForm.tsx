"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Honeypot, Input, Select, Textarea } from "@/components/ui/Form";

/**
 * Verified-buyer review submission form.
 * The server verifies that the submitted email has a valid entitlement for the
 * product before accepting the review, and holds it for admin moderation.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          email: fd.get("email"),
          displayName: fd.get("displayName"),
          rating: Number(fd.get("rating") ?? 5),
          title: fd.get("title"),
          body: fd.get("body"),
          company_website: fd.get("company_website"),
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not submit review." });
      } else {
        form.reset();
        setStatus({
          tone: "success",
          message:
            data.message ??
            "Thank you! Your verified review has been received and queued for moderation.",
        });
      }
    } catch {
      setStatus({ tone: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5" noValidate>
      <Honeypot />
      <h3 className="text-lg font-bold">Write a verified buyer review</h3>
      <p className="text-muted text-xs">
        Only readers who purchased this item can leave a review. Enter the email address used on
        your order.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rev-email" label="Order email address">
          <Input id="rev-email" name="email" type="email" required />
        </Field>
        <Field id="rev-name" label="Name or initials to display">
          <Input id="rev-name" name="displayName" required placeholder="e.g. P. Ochieng" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rev-rating" label="Rating">
          <Select id="rev-rating" name="rating" defaultValue="5">
            <option value="5">5 stars — Very helpful</option>
            <option value="4">4 stars — Good</option>
            <option value="3">3 stars — Average</option>
            <option value="2">2 stars — Needs improvement</option>
            <option value="1">1 star — Not satisfied</option>
          </Select>
        </Field>
        <Field id="rev-title" label="Short headline" optional>
          <Input id="rev-title" name="title" placeholder="Clear and practical" />
        </Field>
      </div>

      <Field id="rev-body" label="Your review">
        <Textarea
          id="rev-body"
          name="body"
          required
          placeholder="What did you find most useful about this guide?"
        />
      </Field>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      <Button type="submit" size="sm" loading={loading}>
        Submit review
      </Button>
    </form>
  );
}
