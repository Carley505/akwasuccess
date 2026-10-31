"use client";

import { useState, type FormEvent } from "react";
import { consultingPackages } from "@/content/services";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Honeypot, Input, Select, Textarea } from "@/components/ui/Form";

export function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          packageId: fd.get("packageId"),
          preferredDate: fd.get("preferredDate"),
          notes: fd.get("notes"),
          company_website: fd.get("company_website"),
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not submit booking request." });
      } else {
        form.reset();
        setStatus({
          tone: "success",
          message:
            data.message ??
            "Booking request received! We will confirm your time slot by email and WhatsApp.",
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
      <h3 className="text-xl font-bold">Request a session slot</h3>
      <p className="text-muted text-sm">
        Choose a package below and tell us what you would like to cover. We will reply within one
        working day to confirm your slot and M-Pesa/card payment details.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="book-name" label="Your name">
          <Input id="book-name" name="name" autoComplete="name" required />
        </Field>
        <Field id="book-email" label="Email address">
          <Input
            id="book-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="book-phone" label="Phone / WhatsApp number">
          <Input
            id="book-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0712 345 678"
            required
          />
        </Field>
        <Field id="book-date" label="Preferred date" optional>
          <Input id="book-date" name="preferredDate" type="date" />
        </Field>
      </div>

      <Field id="book-package" label="Session package">
        <Select id="book-package" name="packageId" defaultValue="session-60">
          {consultingPackages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.duration})
            </option>
          ))}
        </Select>
      </Field>

      <Field id="book-notes" label="Topics or questions you want to cover" optional>
        <Textarea
          id="book-notes"
          name="notes"
          placeholder="e.g. Setting up a hardware/software wallet safely, understanding P2P escrow..."
        />
      </Field>

      {status && <FormAlert tone={status.tone}>{status.message}</FormAlert>}

      <Button type="submit" loading={loading}>
        Request booking
      </Button>
    </form>
  );
}
