"use client";

import { useState } from "react";

const SANS_L = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT = "#6C5CE7";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {error && (
        <p style={{ fontFamily: SANS_L, fontSize: 13, color: "var(--ab-down)", border: "1px solid var(--ab-down)", padding: "8px 14px", margin: 0 }}>
          {error}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          fontFamily: SANS_L, fontSize: 12, fontWeight: 700,
          letterSpacing: ".1em", textTransform: "uppercase",
          color: "#fff", background: ACCENT, border: "none",
          padding: "14px 36px", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "opacity .15s",
        }}
      >
        {loading ? "Redirecting to Stripe…" : "Upgrade to Pro · $9/month"}
      </button>
    </div>
  );
}
