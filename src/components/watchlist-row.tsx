"use client";

import Link from "next/link";
import { removeTicker } from "@/app/dashboard/actions";
import { AddTickerForm } from "@/components/add-ticker-form";
import type { WatchlistItem } from "@/types/database";

type QuoteRow = {
  symbol: string;
  price: number | null;
  changePct: number;
  shortName: string;
};

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-600";
  if (pct < -0.005) return "text-red-500";
  return "text-[var(--faint)]";
}

export function WatchlistRow({
  watchlistId,
  savedItems,
  savedQuotes,
  showAddForm = true,
}: {
  watchlistId: string;
  savedItems: WatchlistItem[];
  savedQuotes: QuoteRow[];
  showAddForm?: boolean;
}) {
  const quoteBySymbol = new Map(savedQuotes.map((q) => [q.symbol.toUpperCase(), q]));

  const sorted = [...savedItems].sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <div
      className="flex overflow-x-auto overflow-hidden rounded-xl [scrollbar-width:thin]"
      style={{ border: "1px solid var(--border)" }}
    >
      {sorted.length === 0 && (
        <div className="flex min-w-[200px] items-center bg-[var(--card)] px-5 py-4 text-xs text-[var(--faint)]"
          style={{ borderRight: "1px solid var(--border)" }}>
          No tickers yet — add one →
        </div>
      )}

      {sorted.map((item) => {
        const q = quoteBySymbol.get(item.ticker.toUpperCase());
        return (
          <div
            key={item.id}
            className="group relative flex min-w-[148px] shrink-0 flex-col bg-[var(--card)] px-5 py-4 transition-colors hover:bg-[var(--surface)]"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            {/* Full-card overlay link */}
            <Link
              href={`/dashboard/research/${item.ticker}`}
              className="absolute inset-0"
              aria-label={`Research ${item.ticker}`}
            />

            {/* Remove button — z-10 so it sits above the overlay link */}
            <form action={removeTicker} className="absolute right-2 top-2 z-10">
              <input type="hidden" name="item_id" value={item.id} />
              <button
                type="submit"
                aria-label={`Remove ${item.ticker}`}
                className="flex h-5 w-5 items-center justify-center rounded text-[13px] text-[var(--faint)] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              >
                ×
              </button>
            </form>

            <p className="font-mono text-xs font-semibold text-[var(--foreground)]">{item.ticker}</p>
            <p className="mt-1.5 text-sm font-bold tabular-nums text-[var(--foreground)]">
              {q?.price != null ? `$${q.price.toFixed(2)}` : "—"}
            </p>
            <p className={`mt-0.5 text-xs font-semibold tabular-nums ${pctClass(q?.changePct ?? 0)}`}>
              {q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
            </p>
          </div>
        );
      })}

      {/* Add ticker form (inline at end of row — optional) */}
      {showAddForm && (
        <div className="flex shrink-0 items-center bg-[var(--card)] px-4 py-4">
          <AddTickerForm watchlistId={watchlistId} size="sm" />
        </div>
      )}
    </div>
  );
}
