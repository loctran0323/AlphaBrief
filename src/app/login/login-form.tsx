"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: SERIF_L, fontSize: 15,
  padding: "6px 0",
  border: "none", borderBottom: "1px solid var(--ab-fg)",
  background: "transparent", color: "var(--ab-fg)",
  outline: "none", boxSizing: "border-box",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: ACCENT, textDecoration: "none" }}>Sign up free</Link>
        </>
      }
    >
      {/* Google OAuth */}
      <button
        type="button"
        onClick={signInWithGoogle}
        style={{
          display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 10,
          border: "1px solid var(--ab-border)", background: "transparent",
          padding: "10px 0", cursor: "pointer",
          fontFamily: SANS_L, fontSize: 13, fontWeight: 500, color: "var(--ab-fg)",
          transition: "background .12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--ab-surface)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--ab-border)" }} />
        <span style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)" }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--ab-border)" }} />
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email" autoComplete="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontFamily: SANS_L, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ab-faint)", display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password" autoComplete="current-password" required
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        {error && (
          <p style={{ fontFamily: SANS_L, fontSize: 13, color: "var(--ab-down)", margin: 0 }} role="alert">{error}</p>
        )}
        <button
          type="submit" disabled={loading}
          style={{
            fontFamily: SANS_L, fontSize: 12, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            background: "var(--ab-fg)", color: "var(--ab-bg)",
            border: "none", padding: "13px", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1, width: "100%", marginTop: 4,
          }}
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
