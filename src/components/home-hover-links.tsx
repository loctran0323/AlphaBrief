"use client";

import Link from "next/link";
import { useState } from "react";
import type { MarketMover } from "@/lib/market-home-data";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const moneyWide = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money     = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compact   = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

function formatPrice(value: number | null, symbol: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (symbol.startsWith("^") && value >= 1000) return moneyWide.format(value);
  return money.format(value);
}
function pctColor(pct: number): string {
  if (pct > 0.005) return "var(--ab-up)";
  if (pct < -0.005) return "var(--ab-down)";
  return "var(--ab-faint)";
}
function signedPct(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

/* ── Benchmark card ─────────────────────────────────────── */
export function BenchmarkCard({
  symbol, label, price, changePct, isIndex,
}: {
  symbol: string; label: string; price: number | null; changePct: number; isIndex: boolean;
}) {
  const [hov, setHov] = useState(false);

  const inner = (
    <>
      <div style={{ fontSize: 11, color: "var(--ab-muted)", letterSpacing: ".04em", fontFamily: SANS_L }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 6 }}>
        <div style={{ fontFamily: SERIF_L, fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--ab-fg)" }}>
          {formatPrice(price, symbol)}
        </div>
        <div style={{ fontSize: 13, color: pctColor(changePct), fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {signedPct(changePct)}
        </div>
      </div>
      <div style={{ fontSize: 10, color: hov ? ACCENT : "var(--ab-faint)", letterSpacing: ".08em", marginTop: 2, transition: "color .12s", fontFamily: SANS_L }}>
        {symbol}
      </div>
    </>
  );

  if (isIndex) {
    return (
      <div style={{ paddingBottom: 10, borderBottom: "1px solid var(--ab-border)" }}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/research/${symbol}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
          display: "block", textDecoration: "none",
        padding: "6px 8px 10px",
        borderBottom: "1px solid var(--ab-border)",
        outline: hov ? `1px solid ${ACCENT}` : "1px solid transparent",
        transition: "outline .12s",
      }}
    >
      {inner}
    </Link>
  );
}

/* ── Mover row ──────────────────────────────────────────── */
export function MoverRow({ r }: { r: MarketMover }) {
  const [hov, setHov] = useState(false);

  return (
    <Link
      href={`/dashboard/research/${r.symbol}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 0",
        borderBottom: "1px solid var(--ab-border)",
        display: "flex", alignItems: "baseline",
        justifyContent: "space-between",
        textDecoration: "none",
        outline: hov ? `1px solid ${ACCENT}` : "1px solid transparent",
        transition: "outline .12s",
      }}
    >
      <div>
        <div style={{
          fontFamily: SERIF_L, fontWeight: 600, fontSize: 15,
          color: hov ? ACCENT : "var(--ab-fg)", transition: "color .12s",
        }}>
          {r.symbol}
        </div>
        <div style={{ fontSize: 11, color: "var(--ab-muted)", marginTop: 1, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: SANS_L }}>
          {r.name}
        </div>
      </div>
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0, marginLeft: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ab-fg)", fontFamily: SANS_L }}>{formatPrice(r.price, r.symbol)}</div>
        <div style={{ fontSize: 11, color: pctColor(r.changePct), fontWeight: 600, fontFamily: SANS_L }}>{signedPct(r.changePct)}</div>
        {r.volume != null && (
          <div style={{ fontSize: 10, color: "var(--ab-faint)", marginTop: 1, fontFamily: SANS_L }}>{compact.format(r.volume)}</div>
        )}
      </div>
    </Link>
  );
}

/* ── Mover column (replaces MoverCol server fn) ─────────── */
export function MoverColClient({ label, rows }: { label: string; rows: MarketMover[] }) {
  return (
    <div>
      <div style={{
        fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
        color: "var(--ab-faint)", fontWeight: 700, marginBottom: 10, fontFamily: SANS_L,
      }}>{label}</div>
      <div>
        {rows.map((r) => <MoverRow key={r.symbol} r={r} />)}
      </div>
    </div>
  );
}
