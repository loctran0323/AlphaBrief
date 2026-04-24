"use client";

import { useState } from "react";

const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const ACCENT  = "#6C5CE7";

type Props = { symbol: string; currentPrice: number | null };

export function PriceAlertForm({ symbol, currentPrice }: Props) {
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (!price || isNaN(price)) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/research/price-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, targetPrice: price, direction }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTargetPrice("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: SANS_L, fontSize: 13, fontWeight: 600, color: "var(--ab-fg)" }}>Price alert</span>
        <span style={{ fontFamily: SANS_L, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "rgba(108,92,231,.12)", color: ACCENT, padding: "2px 6px" }}>
          Pro
        </span>
      </div>
      <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)", marginBottom: 4 }}>
        Get emailed in your digest when {symbol} hits your target price.
      </p>
      {currentPrice != null && (
        <p style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)", fontVariantNumeric: "tabular-nums", marginBottom: 14 }}>
          Current: ${currentPrice.toFixed(2)}
        </p>
      )}

      {status === "saved" ? (
        <div style={{
          fontFamily: SERIF_L, fontSize: 13, color: "#065F46",
          background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.3)",
          padding: "8px 14px",
        }}>
          Alert set — you&apos;ll be notified in your digest when the price is reached.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "stretch" }}>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "above" | "below")}
            style={{
              fontFamily: SANS_L, fontSize: 13, color: "var(--ab-fg)",
              background: "var(--ab-card)", border: "1px solid var(--ab-border)",
              padding: "7px 10px", outline: "none",
            }}
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Target price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={{
              fontFamily: SANS_L, fontSize: 13, color: "var(--ab-fg)",
              background: "var(--ab-card)", border: "1px solid var(--ab-border)",
              padding: "7px 10px", outline: "none", width: 140,
              fontVariantNumeric: "tabular-nums",
            }}
            required
          />
          <button
            type="submit"
            disabled={status === "saving" || !targetPrice}
            style={{
              fontFamily: SANS_L, fontSize: 11, fontWeight: 700,
              letterSpacing: ".1em", textTransform: "uppercase",
              color: "#fff", background: ACCENT, border: "none",
              padding: "7px 18px", cursor: "pointer",
              opacity: (status === "saving" || !targetPrice) ? .5 : 1,
            }}
          >
            {status === "saving" ? "Saving…" : "Set alert"}
          </button>
          {status === "error" && (
            <p style={{ width: "100%", fontFamily: SANS_L, fontSize: 11, color: "#DC2626" }}>
              Failed to save alert. Try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
