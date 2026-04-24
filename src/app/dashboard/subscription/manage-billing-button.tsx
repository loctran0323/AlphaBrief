"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not open billing portal. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && (
        <p style={{ fontFamily: `-apple-system,'Inter',system-ui,sans-serif`, fontSize: 13, color: "var(--ab-down)", border: "1px solid var(--ab-down)", padding: "8px 12px", margin: 0 }}>
          {error}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          fontFamily: `-apple-system,'Inter',system-ui,sans-serif`,
          fontSize: 11, fontWeight: 600,
          letterSpacing: ".08em", textTransform: "uppercase",
          color: "var(--ab-fg)", background: "transparent",
          border: "1px solid var(--ab-border)",
          padding: "9px 20px", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1, alignSelf: "flex-start",
        }}
      >
        {loading ? "Opening portal…" : "Manage billing & cancel"}
      </button>
    </div>
  );
}
