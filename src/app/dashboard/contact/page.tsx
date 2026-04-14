import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us — Alpha Brief",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Support
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Questions or Feedback? We read every message and usually reply within 24 hours.
        </p>
      </header>

      <div className="mt-10">
        <ContactForm defaultEmail={user?.email ?? ""} />
      </div>
    </div>
  );
}
