"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

export function TickerSearch({ ledger = false }: { ledger?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) router.push(`/dashboard/research/${ticker}`);
  }

  if (ledger) {
    return (
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2" style={{
          borderBottom: "2px solid var(--ab-fg)", padding: "10px 2px",
        }}>
          <span style={{ color: "var(--ab-faint)", fontSize: 18 }}>⌕</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL, MSFT, NVDA"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: SERIF_L, fontSize: 22, color: "var(--ab-fg)",
            }}
          />
          <span style={{ fontFamily: SANS_L, fontSize: 10, color: "var(--ab-faint)", letterSpacing: ".12em", whiteSpace: "nowrap" }}>
            RETURN ↵
          </span>
        </div>
      </form>
    );
  }

  // Standard (non-ledger) search used on the detail page search strip
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="Search ticker…"
        style={{
          flex: 1, border: "none", outline: "none", background: "transparent",
          fontFamily: SERIF_L, fontSize: 16, color: "var(--ab-fg)",
        }}
      />
    </form>
  );
}
