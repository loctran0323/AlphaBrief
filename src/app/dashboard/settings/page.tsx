import Link from "next/link";
import type { Metadata } from "next";
import { sendTestDigest, updateDigest } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import type { DigestFrequency } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Digest · AlphaBrief" };

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

type DigestTest = "sent" | "fail" | "noemail";
function parseDigestTest(raw: string | string[] | undefined): DigestTest | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "sent" || v === "fail" || v === "noemail") return v;
  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const digestTest = parseDigestTest(sp.digestTest);
  const failReason = typeof sp.reason === "string" ? sp.reason : Array.isArray(sp.reason) ? sp.reason[0] : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";
  const isPro = tier === "pro";

  let frequency: DigestFrequency = "none";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("digest_frequency")
      .eq("id", user.id).maybeSingle();
    if (profile?.digest_frequency) frequency = profile.digest_frequency;
  }

  const options: { value: DigestFrequency; label: string; hint: string }[] = [
    { value: "none",   label: "Off",    hint: "No scheduled digest emails." },
    { value: "daily",  label: "Daily",  hint: "A daily morning briefing sent to your inbox." },
    { value: "weekly", label: "Weekly", hint: "A weekly recap every Monday morning." },
  ];

  return (
    <div style={{ maxWidth: 680, fontFamily: SANS_L }}>

      {/* Masthead */}
      <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 10 }}>
          Settings
        </div>
        <h1 style={{ fontFamily: SERIF_L, fontSize: 42, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: "var(--ab-fg)" }}>
          Email &amp; digest
        </h1>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16, color: "var(--ab-muted)", marginTop: 10, marginBottom: 0 }}>
          Choose how often you want a digest. Test emails use{" "}
          <strong style={{ fontStyle: "normal", color: "var(--ab-fg)" }}>{user?.email ?? "your account address"}</strong>.
        </p>
      </div>

      {/* Status banners */}
      {digestTest === "sent" && (
        <div style={{ border: "1px solid var(--ab-up)", padding: "12px 16px", marginBottom: 24, fontFamily: SANS_L, fontSize: 13, color: "var(--ab-up)" }}>
          Test digest sent. Check your inbox (and spam).
        </div>
      )}
      {digestTest === "fail" && (
        <div style={{ border: "1px solid var(--ab-down)", padding: "12px 16px", marginBottom: 24, fontFamily: SANS_L, fontSize: 13, color: "var(--ab-down)" }}>
          <strong>Could not send test digest.</strong>{failReason ? ` ${failReason}` : ""}
        </div>
      )}
      {digestTest === "noemail" && (
        <div style={{ border: "1px solid var(--ab-border)", padding: "12px 16px", marginBottom: 24, fontFamily: SANS_L, fontSize: 13, color: "var(--ab-muted)" }}>
          No email on file. Sign in with an email provider or add one in your account settings.
        </div>
      )}

      {/* Pro gate */}
      {!isPro && (
        <div style={{ border: `1px solid ${ACCENT}`, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, color: "var(--ab-fg)", marginBottom: 8 }}>
            Email digest is a Pro feature
          </div>
          <p style={{ fontFamily: SERIF_L, fontSize: 15, color: "var(--ab-muted)", lineHeight: 1.6, marginBottom: 16 }}>
            Upgrade to Pro to receive daily or weekly briefings: headlines, upcoming earnings, and price alerts, straight to your inbox.
          </p>
          <Link href="/dashboard/upgrade" style={{
            display: "inline-block",
            fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "#fff", background: ACCENT, padding: "8px 18px", textDecoration: "none",
          }}>
            Upgrade to Pro · $9/month
          </Link>
        </div>
      )}

      {isPro && (
        <>
          {/* Frequency */}
          <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginBottom: 32 }}>
            <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--ab-fg)" }}>
              Digest frequency
            </div>
            <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)", marginBottom: 20 }}>
              Saved on your profile.
            </p>
            <form action={updateDigest} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {options.map((o) => (
                <label key={o.value} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 0", borderBottom: "1px solid var(--ab-border)", cursor: "pointer",
                }}>
                  <input type="radio" name="digest_frequency" value={o.value} defaultChecked={frequency === o.value} style={{ marginTop: 3, accentColor: ACCENT }} />
                  <span>
                    <span style={{ fontFamily: SERIF_L, fontSize: 16, fontWeight: 600, color: "var(--ab-fg)", display: "block" }}>{o.label}</span>
                    <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>{o.hint}</span>
                  </span>
                </label>
              ))}
              <button type="submit" style={{
                marginTop: 20, alignSelf: "flex-start",
                fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
                letterSpacing: ".08em", textTransform: "uppercase",
                color: "#fff", background: "var(--ab-fg)", border: "none",
                padding: "9px 20px", cursor: "pointer",
              }}>
                Save preference
              </button>
            </form>
          </div>

          {/* Test email */}
          <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginBottom: 32 }}>
            <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--ab-fg)" }}>
              Test email
            </div>
            <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)", marginBottom: 20 }}>
              Sends one sample digest now. Briefing headlines and upcoming events from your watchlist.
            </p>
            <form action={sendTestDigest}>
              <button type="submit" style={{
                fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
                letterSpacing: ".08em", textTransform: "uppercase",
                color: "var(--ab-fg)", background: "transparent",
                border: "1px solid var(--ab-border)", padding: "9px 20px", cursor: "pointer",
              }}>
                Send test digest
              </button>
            </form>
          </div>
        </>
      )}

      <Link href="/dashboard" style={{ fontFamily: SANS_L, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ab-muted)", textDecoration: "none" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
