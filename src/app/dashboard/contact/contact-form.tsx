"use client";

import { useActionState } from "react";
import { sendContactMessage } from "./actions";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: SERIF_L, fontSize: 15,
  padding: "6px 0", border: "none",
  borderBottom: "1px solid var(--ab-fg)",
  background: "transparent", color: "var(--ab-fg)",
  outline: "none", boxSizing: "border-box",
};

const initial = { ok: false as boolean | undefined, error: undefined as string | undefined };

export function ContactForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const res = await sendContactMessage(formData);
      return res as typeof initial;
    },
    initial,
  );

  if (state.ok === true) {
    return (
      <div style={{ border: "1px solid var(--ab-up)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, color: "var(--ab-fg)", marginBottom: 8 }}>
          Message sent.
        </div>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 15, color: "var(--ab-muted)", margin: 0 }}>
          We got your message and will reply shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {state.error && (
        <div style={{ border: "1px solid var(--ab-down)", padding: "10px 14px", fontFamily: SANS_L, fontSize: 13, color: "var(--ab-down)" }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" as const, color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
            Name
          </label>
          <input type="text" name="name" required autoComplete="name" placeholder="Your name" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" as const, color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input type="email" name="email" required autoComplete="email" defaultValue={defaultEmail} placeholder="you@example.com" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" as const, color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
          Message
        </label>
        <textarea
          name="message" rows={6} required
          placeholder="Questions, feature requests, or anything else…"
          style={{ ...inputStyle, resize: "none" as const, paddingTop: 4 }}
        />
      </div>

      <div>
        <button type="submit" disabled={pending} style={{
          fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
          letterSpacing: ".08em", textTransform: "uppercase" as const,
          color: "#fff", background: ACCENT, border: "none",
          padding: "9px 20px", cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}>
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
