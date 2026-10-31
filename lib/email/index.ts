import "server-only";
import fs from "node:fs";
import path from "node:path";
import { site } from "@/content/site";
import { absoluteUrl, formatKes } from "@/lib/utils";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Branded, mobile-first HTML email wrapper (Section 16: single column, 600px max,
 * 16px text, bulletproof buttons, plain-text alternative).
 */
function wrapHtml(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const buttonHtml = cta
    ? `<p style="margin:24px 0;">
         <a href="${cta.url}" style="display:inline-block;background:#0B6B3A;color:#FFFFFF;font-weight:600;font-size:16px;padding:14px 24px;border-radius:8px;text-decoration:none;">
           ${cta.label}
         </a>
       </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:24px 12px;background:#FAF8F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#14231B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #C9D3CD;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#08472A;color:#FFFFFF;padding:20px 24px;font-size:20px;font-weight:700;">
        Akwasuccess
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#14231B;">${title}</h1>
        ${bodyHtml}
        ${buttonHtml}
        <hr style="border:none;border-top:1px solid #C9D3CD;margin:24px 0;">
        <p style="margin:0;font-size:13px;color:#4A5A52;">
          ${site.name} — ${site.tagline}<br>
          Need help? Reply to this email or write to ${site.email}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(msg: EmailMessage) {
  // Always persist to .data/outbox so dev & automated tests can inspect sent emails.
  try {
    const outDir = path.join(process.cwd(), ".data", "outbox");
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(
      outDir,
      `${Date.now()}-${msg.to.replace(/[^a-z0-9]/gi, "_")}.json`,
    );
    fs.writeFileSync(file, JSON.stringify({ ...msg, sentAt: new Date().toISOString() }, null, 2));
  } catch {
    /* ignore fs errors in read-only runtimes */
  }

  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) return { queued: true, provider: "local-outbox" };

  const from = process.env.EMAIL_FROM || `Akwasuccess <${site.email}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    }),
  });
  return { queued: res.ok, provider: "resend" };
}

export async function sendMagicLinkEmail(email: string, rawToken: string) {
  const url = absoluteUrl(`/api/auth/verify?token=${encodeURIComponent(rawToken)}`);
  return sendEmail({
    to: email,
    subject: "Your sign-in link for Akwasuccess",
    html: wrapHtml(
      "Sign in to your Akwasuccess library",
      `<p>Click the button below to access your purchased eBooks, courses, and receipts. This link is valid for 30 minutes.</p>`,
      { label: "Sign in to my account", url },
    ),
    text: `Sign in to your Akwasuccess library:\n${url}\n\nThis link expires in 30 minutes.`,
  });
}

export async function sendOrderReceiptEmail(opts: {
  email: string;
  orderNumber: string;
  totalKes: number;
  items: { title: string; downloadUrl?: string }[];
  magicLinkUrl: string;
}) {
  const listHtml = opts.items
    .map(
      (i) =>
        `<li style="margin-bottom:8px;"><strong>${i.title}</strong>${
          i.downloadUrl ? ` — <a href="${i.downloadUrl}" style="color:#0B6B3A;">Download</a>` : ""
        }</li>`,
    )
    .join("");

  const listText = opts.items
    .map((i) => `- ${i.title}${i.downloadUrl ? `: ${i.downloadUrl}` : ""}`)
    .join("\n");

  return sendEmail({
    to: opts.email,
    subject: `Receipt & download links for Order #${opts.orderNumber}`,
    html: wrapHtml(
      `Thank you for your order (#${opts.orderNumber})`,
      `<p>We have confirmed your payment of <strong>${formatKes(opts.totalKes)}</strong>. Your digital items are ready below:</p>
       <ul>${listHtml}</ul>
       <p>You can also re-download your files anytime from your Account Library.</p>`,
      { label: "Open my Account Library", url: opts.magicLinkUrl },
    ),
    text: `Thank you for your order (#${opts.orderNumber}) — ${formatKes(opts.totalKes)}.\n\nYour items:\n${listText}\n\nOpen your library: ${opts.magicLinkUrl}`,
  });
}

export async function sendNewsletterWelcomeEmail(email: string, unsubscribeToken: string) {
  const checklistUrl = absoluteUrl("/samples/crypto-safety-checklist.pdf");
  const unsubUrl = absoluteUrl(`/api/newsletter/unsubscribe?token=${unsubscribeToken}`);
  return sendEmail({
    to: email,
    subject: "Your Free Cryptocurrency Safety Checklist (PDF)",
    html: wrapHtml(
      "Welcome to Akwasuccess!",
      `<p>Here is your free <strong>Cryptocurrency Safety Checklist (PDF)</strong>. Keep it handy before setting up a wallet or using P2P.</p>
       <p style="font-size:13px;color:#4A5A52;">To unsubscribe at any time, <a href="${unsubUrl}">click here</a>.</p>`,
      { label: "Download the Checklist (PDF)", url: checklistUrl },
    ),
    text: `Welcome to Akwasuccess!\nDownload your Cryptocurrency Safety Checklist: ${checklistUrl}\n\nUnsubscribe: ${unsubUrl}`,
  });
}
