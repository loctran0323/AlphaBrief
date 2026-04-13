"use client";

import { useState } from "react";
import type { MarketMover } from "@/lib/market-home-data";

const COLLAPSED_COUNT = 7;

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const moneyWide = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatPrice(value: number | null, symbol: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (symbol.startsWith("^") && value >= 1000) {
    return moneyWide.format(value);
  }
  return money.format(value);
}

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-600";
  if (pct < -0.005) return "text-red-600";
  return "text-[var(--muted)]";
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function HomeMoverList({
  title,
  subtitle,
  rows,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  rows: MarketMover[];
  emptyHint: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = rows.length > COLLAPSED_COUNT;
  const visible = expanded || !hasMore ? rows : rows.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">{emptyHint}</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {visible.map((r) => (
              <li key={r.symbol} className="flex items-center gap-3 py-2.5 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium text-[var(--foreground)]">{r.symbol}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{r.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-[var(--foreground)]">{formatPrice(r.price, r.symbol)}</p>
                  <p className={`text-xs tabular-nums ${pctClass(r.changePct)}`}>
                    {r.changePct >= 0 ? "+" : ""}
                    {r.changePct.toFixed(2)}%
                  </p>
                </div>
                {r.volume != null && (
                  <span className="hidden w-14 shrink-0 text-right text-[10px] tabular-nums text-[var(--muted)] sm:block">
                    {compact.format(r.volume)} sh
                  </span>
                )}
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
            >
              {expanded ? (
                <>
                  <ChevronRight className="rotate-180 opacity-80" />
                  Show less
                </>
              ) : (
                <>
                  Show more
                  <ChevronRight className="opacity-80" />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
