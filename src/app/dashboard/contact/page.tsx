import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact · AlphaBrief" };

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ maxWidth: 680, fontFamily: SANS_L }}>

      {/* Masthead */}
      <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 10 }}>
          Support
        </div>
        <h1 style={{ fontFamily: SERIF_L, fontSize: 42, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: "var(--ab-fg)" }}>
          Contact us
        </h1>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16, color: "var(--ab-muted)", marginTop: 10, marginBottom: 0 }}>
          Questions or feedback? We read every message and usually reply within 24 hours.
        </p>
      </div>

      <ContactForm defaultEmail={user?.email ?? ""} />
    </div>
  );
}
