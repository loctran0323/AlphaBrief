"use client";

import { useState } from "react";

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
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-highlight)] p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Price alert</h2>
        <span className="rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-semibold text-[#6C5CE7]">Pro</span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Get emailed in your digest when {symbol} hits your target price.
      </p>
      {currentPrice != null && (
        <p className="mt-1 text-xs text-[var(--faint)]">Current: ${currentPrice.toFixed(2)}</p>
      )}

      {status === "saved" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Alert set — you&apos;ll be notified in your digest when the price is reached.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-2">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "above" | "below")}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
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
            className="w-36 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={status === "saving" || !targetPrice}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)] disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Set alert"}
          </button>
          {status === "error" && (
            <p className="w-full text-xs text-red-500">Failed to save alert. Try again.</p>
          )}
        </form>
      )}
    </div>
  );
}
