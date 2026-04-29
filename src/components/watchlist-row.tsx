"use client";

import Link from "next/link";
import { useState } from "react";
import { removeTicker } from "@/app/dashboard/actions";
import { AddTickerForm } from "@/components/add-ticker-form";
import type { WatchlistItem } from "@/types/database";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;

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
          No tickers yet. Add one →
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

function WatchlistTickerCard({ item, q, pct, pctColor, pctStr }: {
  item: WatchlistItem;
  q: QuoteRow | undefined;
  pct: number;
  pctColor: string;
  pctStr: string;
}) {
  const [hov, setHov] = useState(false);
  const ACCENT = "#6C5CE7";

  return (
    <div style={{ position: "relative" }}>
      <Link
        href={`/dashboard/research/${item.ticker}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          textDecoration: "none", display: "block", padding: "6px 8px",
          border: hov ? `1px solid ${ACCENT}` : "1px solid transparent",
          transition: "border-color .12s",
        }}
      >
        <div style={{ fontFamily: SERIF_L, fontWeight: 600, fontSize: 13, color: hov ? ACCENT : "var(--ab-fg)", transition: "color .12s" }}>
          {item.ticker}
        </div>
        <div style={{ fontSize: 14, fontVariantNumeric: "tabular-nums", marginTop: 2, color: "var(--ab-fg)" }}>
          {q?.price != null ? `$${q.price.toFixed(2)}` : "—"}
        </div>
        <div style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: pctColor, marginTop: 1 }}>
          {pctStr}
        </div>
        <svg width="80" height="16" viewBox="0 0 80 16" style={{ marginTop: 4, display: "block" }}>
          <polyline
            points={Array.from({ length: 10 }, (_, i) => {
              const seed = item.ticker.charCodeAt(0) + i;
              const y = 8 + Math.sin(seed * 0.8) * (pct >= 0 ? -3 : 3) + (i * (pct >= 0 ? -0.3 : 0.3));
              return `${i * 8.9},${Math.max(1, Math.min(15, y))}`;
            }).join(" ")}
            fill="none"
            stroke={pct >= 0 ? "var(--ab-up)" : "var(--ab-down)"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {/* Remove button */}
      <form action={removeTicker} style={{ position: "absolute", top: 0, right: 0 }}>
        <input type="hidden" name="item_id" value={item.id} />
        <button
          type="submit"
          aria-label={`Remove ${item.ticker}`}
          style={{
            fontSize: 13, color: "var(--ab-faint)", background: "none",
            border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1,
          }}
        >×</button>
      </form>
    </div>
  );
}

/**
 * Ledger-style watchlist: flat 9-col grid, no card wrapper.
 * ticker (serif bold) · price · pct · mini sparkline
 */
export function WatchlistRowLedger({
  watchlistId,
  savedItems,
  savedQuotes,
}: {
  watchlistId: string;
  savedItems: WatchlistItem[];
  savedQuotes: QuoteRow[];
}) {
  const quoteBySymbol = new Map(savedQuotes.map((q) => [q.symbol.toUpperCase(), q]));
  const sorted = [...savedItems].sort((a, b) => a.ticker.localeCompare(b.ticker));

  if (sorted.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--ab-faint)", fontFamily: SERIF_L, fontStyle: "italic" }}>
        No tickers yet. Add one above.
      </p>
    );
  }

  return (
    <div className="ab-watchlist-grid" style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 18 }}>
      {sorted.map((item) => {
        const q = quoteBySymbol.get(item.ticker.toUpperCase());
        const pct = q?.changePct ?? 0;
        const pctColor = pct > 0.005 ? "var(--ab-up)" : pct < -0.005 ? "var(--ab-down)" : "var(--ab-faint)";
        const pctStr = q ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—";
        return (
          <WatchlistTickerCard key={item.id} item={item} q={q} pct={pct} pctColor={pctColor} pctStr={pctStr} />
        );
      })}
    </div>
  );
}
