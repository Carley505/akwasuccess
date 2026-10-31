"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Honeypot, Input, Select, Textarea } from "@/components/ui/Form";
import { whatsappLink } from "@/content/site";
import { track } from "@/lib/analytics/client";

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Client-side image compression via Canvas so slow 3G/4G connections in Kenya
 * don't upload multi-megabyte raw camera photos.
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ElectricalQuoteForm() {
  const [photos, setPhotos] = useState<{ name: string; dataUrl: string }[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    tone: "success" | "error";
    message: string;
    waSummary?: string;
  } | null>(null);

  async function onFilesChange(e: ChangeEvent<HTMLInputElement>) {
    setPhotoError(null);
    const list = Array.from(e.target.files ?? []);
    if (list.length > MAX_FILES) {
      setPhotoError(`Please select at most ${MAX_FILES} photos.`);
      return;
    }
    for (const f of list) {
      if (f.size > MAX_BYTES) {
        setPhotoError(`"${f.name}" is larger than 5 MB.`);
        return;
      }
    }
    try {
      const compressed = await Promise.all(
        list.map(async (f) => ({ name: f.name, dataUrl: await compressImage(f) })),
      );
      setPhotos(compressed);
    } catch {
      setPhotoError("Could not process one of the selected photos.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    setStatus(null);

    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      location: String(fd.get("location") ?? ""),
      serviceType: String(fd.get("serviceType") ?? ""),
      description: String(fd.get("description") ?? ""),
      photos: photos.map((p) => p.name),
      company_website: String(fd.get("company_website") ?? ""),
    };

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ tone: "error", message: data.error ?? "Could not send quote request." });
      } else {
        track("quote_request", { serviceType: payload.serviceType });
        const waSummary = [
          "Hello Akwasuccess, I requested an electrical quote:",
          `Name: ${payload.name}`,
          `Phone: ${payload.phone}`,
          `Location: ${payload.location}`,
          `Service: ${payload.serviceType}`,
          `Details: ${payload.description}`,
        ].join("\n");
        form.reset();
        setPhotos([]);
        setStatus({
          tone: "success",
          message:
            data.message ??
            "Quote request received! We will review your details and get back to you shortly.",
          waSummary,
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
      <h2 className="text-xl font-bold">Request a quote</h2>
      <p className="text-muted text-sm">
        Tell us about your domestic or industrial electrical job. You can also attach up to 3
        photos of the site or panel.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quote-name" label="Your name">
          <Input id="quote-name" name="name" autoComplete="name" required />
        </Field>
        <Field id="quote-phone" label="Phone / M-Pesa number">
          <Input
            id="quote-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0712 345 678"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="quote-location" label="Location / Estate / Town">
          <Input
            id="quote-location"
            name="location"
            placeholder="e.g. Westlands, Nairobi"
            required
          />
        </Field>
        <Field id="quote-email" label="Email address" optional>
          <Input
            id="quote-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
          />
        </Field>
      </div>

      <Field id="quote-service" label="Service type">
        <Select id="quote-service" name="serviceType" defaultValue="domestic-wiring">
          <option value="domestic-wiring">Domestic wiring &amp; consumer unit / DB</option>
          <option value="industrial-installation">Industrial installation &amp; control panels</option>
          <option value="troubleshooting">Electrical fault troubleshooting &amp; repair</option>
          <option value="instrumentation-automation">
            Instrumentation, sensors &amp; PLC automation
          </option>
          <option value="inspection">Safety inspection &amp; earthing</option>
        </Select>
      </Field>

      <Field id="quote-description" label="Describe the work needed">
        <Textarea
          id="quote-description"
          name="description"
          required
          placeholder="Tell us what needs to be installed, checked, or repaired..."
        />
      </Field>

      <Field
        id="quote-photos"
        label="Photos of the site or board"
        optional
        hint="Up to 3 images (max 5 MB each). Compressed automatically in your browser."
        error={photoError ?? undefined}
      >
        <Input
          id="quote-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesChange}
        />
        {photos.length > 0 && (
          <p className="text-link text-xs font-semibold">
            {photos.length} photo(s) compressed and ready: {photos.map((p) => p.name).join(", ")}
          </p>
        )}
      </Field>

      {status && (
        <div className="space-y-3">
          <FormAlert tone={status.tone}>{status.message}</FormAlert>
          {status.waSummary && (
            <a
              href={whatsappLink(status.waSummary)}
              target="_blank"
              rel="noopener noreferrer"
              className="border-primary text-link hover:bg-tint inline-flex min-h-11 items-center gap-2 rounded-md border-2 px-4 text-sm font-semibold no-underline"
            >
              <MessageCircle className="size-4" aria-hidden />
              <span>Send summary on WhatsApp for faster follow-up</span>
            </a>
          )}
        </div>
      )}

      <Button type="submit" loading={loading}>
        Send quote request
      </Button>
    </form>
  );
}
