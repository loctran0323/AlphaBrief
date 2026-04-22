"use client";

import Link from "next/link";
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
  if (symbol.startsWith("^") && value >= 1000) return moneyWide.format(value);
  return money.format(value);
}

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-600";
  if (pct < -0.005) return "text-red-600";
  return "text-[var(--faint)]";
}

export function HomeMoverList({
  title,
  subtitle,
  rows,
  emptyHint,
  bare = false,
}: {
  title: string;
  subtitle?: string;
  rows: MarketMover[];
  emptyHint: string;
  bare?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = rows.length > COLLAPSED_COUNT;
  const visible = expanded || !hasMore ? rows : rows.slice(0, COLLAPSED_COUNT);

  const inner = (
    <>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">{emptyHint}</p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--border)]">
            {visible.map((r) => (
              <li key={r.symbol}>
                <Link
                  href={`/dashboard/research/${r.symbol}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-[var(--surface)] -mx-1 px-1 rounded"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-[var(--foreground)]">{r.symbol}</p>
                    <p className="truncate text-[11px] text-[var(--faint)]">{r.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs tabular-nums text-[var(--foreground)]">{formatPrice(r.price, r.symbol)}</p>
                    <p className={`text-xs font-semibold tabular-nums ${pctClass(r.changePct)}`}>
                      {r.changePct >= 0 ? "+" : ""}{r.changePct.toFixed(2)}%
                    </p>
                  </div>
                  {r.volume != null && (
                    <span className="hidden w-10 shrink-0 text-right text-[10px] tabular-nums text-[var(--faint)] sm:block">
                      {compact.format(r.volume)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 w-full text-center text-[11px] text-[var(--faint)] hover:text-[var(--muted)] transition-colors"
            >
              {expanded ? "Show less" : `+${rows.length - COLLAPSED_COUNT} more`}
            </button>
          )}
        </>
      )}
    </>
  );

  if (bare) return <div>{inner}</div>;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">{title}</h2>
      {inner}
    </div>
  );
}
