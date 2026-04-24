"use client";

import { useMemo, useState } from "react";
import type { MarketEvent } from "@/types/database";
import { EventCard } from "@/components/event-card";

const SANS_L = `-apple-system, 'Inter', system-ui, sans-serif`;
const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;

type Props = {
  events: MarketEvent[];
  perPage?: number;
  readMoreUrlsByEventId?: Record<string, string>;
  showTickerBadge?: boolean;
  archiveMode?: boolean;
};

export function TimelinePager({
  events,
  perPage = 2,
  readMoreUrlsByEventId,
  showTickerBadge = true,
  archiveMode = false,
}: Props) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(events.length / perPage));
  const safePage = Math.min(page, pageCount - 1);

  const slice = useMemo(() => {
    const start = safePage * perPage;
    return events.slice(start, start + perPage);
  }, [events, perPage, safePage]);

  if (events.length === 0) {
    return (
      <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)" }}>
        Nothing in this tab for now. Try the other tab or refresh in a few minutes.
      </p>
    );
  }

  return (
    <div>
      <div>
        {slice.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            showTickerBadge={showTickerBadge}
            readMoreUrl={readMoreUrlsByEventId?.[event.id] ?? null}
            archiveMode={archiveMode}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 8, borderTop: "1px solid var(--ab-border)", paddingTop: 14, marginTop: 2,
        }}>
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{
              fontFamily: SANS_L, fontSize: 11, fontWeight: 700,
              letterSpacing: ".12em", textTransform: "uppercase",
              color: safePage <= 0 ? "var(--ab-faint)" : "var(--ab-fg)",
              background: "none", border: "1px solid var(--ab-border)",
              padding: "5px 12px", cursor: safePage <= 0 ? "not-allowed" : "pointer",
              opacity: safePage <= 0 ? .4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)", fontVariantNumeric: "tabular-nums" }}>
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            style={{
              fontFamily: SANS_L, fontSize: 11, fontWeight: 700,
              letterSpacing: ".12em", textTransform: "uppercase",
              color: safePage >= pageCount - 1 ? "var(--ab-faint)" : "var(--ab-fg)",
              background: "none", border: "1px solid var(--ab-border)",
              padding: "5px 12px", cursor: safePage >= pageCount - 1 ? "not-allowed" : "pointer",
              opacity: safePage >= pageCount - 1 ? .4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
