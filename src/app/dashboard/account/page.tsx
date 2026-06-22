import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account · AlphaBrief" };

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

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const error = get("error");
  const passwordChanged = get("passwordChanged") === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/account");

  return (
    <div style={{ maxWidth: 680, fontFamily: SANS_L }}>

      {/* Masthead */}
      <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 10 }}>
          Account
        </div>
        <h1 style={{ fontFamily: SERIF_L, fontSize: 42, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: "var(--ab-fg)" }}>
          Account settings
        </h1>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16, color: "var(--ab-muted)", marginTop: 10, marginBottom: 0 }}>
          Signed in as <strong style={{ fontStyle: "normal", color: "var(--ab-fg)" }}>{user?.email ?? "—"}</strong>
        </p>
      </div>

      {error && (
        <div style={{ border: "1px solid var(--ab-down)", padding: "12px 16px", marginBottom: 24, fontFamily: SANS_L, fontSize: 13, color: "var(--ab-down)" }}>
          {error}
        </div>
      )}
      {passwordChanged && (
        <div style={{ border: "1px solid var(--ab-up)", padding: "12px 16px", marginBottom: 24, fontFamily: SANS_L, fontSize: 13, color: "var(--ab-up)" }}>
          Password updated successfully.
        </div>
      )}

      {/* Change password */}
      <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginBottom: 32 }}>
        <div style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, marginBottom: 6, color: "var(--ab-fg)" }}>
          Change password
        </div>
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)", marginBottom: 24 }}>
          Enter your current password to confirm, then choose a new one.
        </p>
        <form action={updatePassword} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
              Current password
            </label>
            <input type="password" name="current" required placeholder="Current password" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
              New password
            </label>
            <input type="password" name="password" required minLength={8} placeholder="At least 8 characters" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
              Confirm new password
            </label>
            <input type="password" name="confirm" required placeholder="Confirm new password" style={inputStyle} />
          </div>
          <div>
            <button type="submit" style={{
              fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
              letterSpacing: ".08em", textTransform: "uppercase",
              color: "#fff", background: "var(--ab-fg)", border: "none",
              padding: "9px 20px", cursor: "pointer",
            }}>
              Update password
            </button>
          </div>
        </form>
      </div>

      <Link href="/dashboard" style={{ fontFamily: SANS_L, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ab-muted)", textDecoration: "none" }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
