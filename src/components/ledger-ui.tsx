/**
 * Ledger design-system primitives.
 * Matches direction-ledger.jsx / direction-ledger-pages.jsx exactly.
 * Uses --ab-* CSS variable aliases (defined in globals.css) and inline SERIF_L font string.
 */

import React from "react";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

/** Full-width editorial page masthead — eyebrow + large serif h1 + italic dek */
export function LedgerMasthead({
  eyebrow,
  title,
  dek,
  dekStyle,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  dek?: string;
  dekStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 20, marginBottom: 14 }}>
      {/* Mobile eyebrow — tighter spacing so it stays on one line */}
      <div className="sm:hidden" style={{
        fontFamily: SANS_L, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
        color: ACCENT, fontWeight: 700, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{eyebrow}</div>
      {/* Desktop eyebrow */}
      <div className="hidden sm:block" style={{
        fontFamily: SANS_L, fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase",
        color: ACCENT, fontWeight: 700, marginBottom: 10,
      }}>{eyebrow}</div>
      <h1 className="ab-masthead-h1" style={{
        fontFamily: SERIF_L, fontSize: 46, lineHeight: 1.02, letterSpacing: "-.02em",
        fontWeight: 600, color: "var(--ab-fg)", margin: 0,
      }}>{title}</h1>
      {dek && <p style={{
        fontFamily: SERIF_L, fontStyle: "italic", fontSize: 17, lineHeight: 1.5,
        color: "var(--ab-muted)", marginTop: 12, maxWidth: 720, marginBottom: 0,
        ...dekStyle,
      }}>{dek}</p>}
    </div>
  );
}

/** Italic byline bar below masthead */
export function LedgerByline({
  left,
  leftMobile,
  right,
}: {
  left: React.ReactNode;
  leftMobile?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2" style={{
      borderBottom: "1px solid var(--ab-border)", paddingBottom: 10, marginBottom: 24,
      fontSize: 12, color: "var(--ab-muted)",
    }}>
      {/* Mobile: shorter text, single line */}
      <div className="sm:hidden" style={{
        fontFamily: SERIF_L, fontStyle: "italic", fontSize: 11,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        minWidth: 0, flex: 1,
      }}>{leftMobile ?? left}</div>
      {/* Desktop: full text */}
      <div className="hidden sm:block" style={{ fontFamily: SERIF_L, fontStyle: "italic" }}>{left}</div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

/** Uppercase rule label: TEXT ─────── [optional right label] */
export function LedgerRuleLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontFamily: SANS_L, fontSize: 10, letterSpacing: ".22em",
      textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700,
      margin: "24px 0 12px",
    }}>
      <span style={{ whiteSpace: "nowrap" }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--ab-border)" }} />
      {right && (
        <span className="hidden sm:inline" style={{ letterSpacing: ".1em", color: "var(--ab-muted)", whiteSpace: "nowrap" }}>
          {right}
        </span>
      )}
    </div>
  );
}

/** Serif price display for benchmarks — matches L_Home quote strip */
export function LedgerPrice({
  label,
  price,
  pct,
  symbol,
}: {
  label: string;
  price: string;
  pct: string;
  symbol: string;
}) {
  const isPositive = pct.startsWith("+");
  return (
    <div style={{ paddingBottom: 10, borderBottom: "1px solid var(--ab-border)" }}>
      <div style={{ fontSize: 11, color: "var(--ab-muted)", letterSpacing: ".04em" }}>{label}</div>
      <div className="flex items-baseline justify-between" style={{ marginTop: 6 }}>
        <div style={{
          fontFamily: SERIF_L, fontSize: 22, fontWeight: 600,
          fontVariantNumeric: "tabular-nums", color: "var(--ab-fg)",
        }}>{price}</div>
        <div style={{
          fontSize: 13,
          color: isPositive ? "var(--ab-up)" : "var(--ab-down)",
          fontVariantNumeric: "tabular-nums", fontWeight: 600,
        }}>{pct}</div>
      </div>
      <div style={{ fontSize: 10, color: "var(--ab-faint)", letterSpacing: ".08em", marginTop: 2 }}>
        {symbol}
      </div>
    </div>
  );
}
