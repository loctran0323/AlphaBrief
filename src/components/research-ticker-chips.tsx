"use client";

import { useState } from "react";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const ACCENT  = "#6C5CE7";

function TickerChip({ ticker }: { ticker: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={`/dashboard/research/${ticker}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: SERIF_L,
        fontSize: 17,
        fontWeight: 600,
        color: hov ? ACCENT : "var(--ab-fg)",
        textDecoration: "none",
        padding: "3px 8px",
        border: hov ? `1px solid ${ACCENT}` : "1px solid transparent",
        background: "transparent",
        transition: "color .12s, border-color .12s",
        display: "inline-block",
        cursor: "pointer",
      }}
    >
      {ticker}
    </a>
  );
}

export function ResearchTickerChips({ tickers }: { tickers: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, alignItems: "center" }}>
      {tickers.map((t, i) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
          <TickerChip ticker={t} />
          {i < tickers.length - 1 && <span style={{ color: "var(--ab-faint)", fontSize: 17 }}>·</span>}
        </span>
      ))}
    </div>
  );
}
