"use server";

import { Resend } from "resend";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactMessage(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Message is too short." };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email service is not configured. Please try again later." };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const to = process.env.CONTACT_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Alpha Brief — message from ${name}`,
    html: `
<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111827;">
  <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;">New contact message</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6B7280;width:80px;">Name</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#6C5CE7;">${escapeHtml(email)}</a></td></tr>
  </table>
  <hr style="margin:16px 0;border:none;border-top:1px solid #E5E7EB;" />
  <p style="font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(message)}</p>
</div>`,
  });

  if (error) {
    return { ok: false, error: "Failed to send message. Please try again." };
  }
  return { ok: true };
}
