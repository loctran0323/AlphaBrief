"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SANS_L = `-apple-system, 'Inter', system-ui, sans-serif`;

export function RefreshSummaryButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market/refresh-summary", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={handleRefresh}
        disabled={loading}
        style={{
          fontFamily: SANS_L, fontSize: 10, fontWeight: 600,
          letterSpacing: ".1em", textTransform: "uppercase",
          color: "var(--ab-faint)", background: "none", border: "none",
          cursor: loading ? "not-allowed" : "pointer", padding: 0,
          opacity: loading ? 0.5 : 1,
          textDecoration: "underline", textDecorationStyle: "dotted",
        }}
      >
        {loading ? "Refreshing…" : "↻ Refresh"}
      </button>
      {error && (
        <span style={{ fontFamily: SANS_L, fontSize: 10, color: "var(--ab-down)" }}>{error}</span>
      )}
    </span>
  );
}
