"use client";

import { useMemo, useState } from "react";
import type { MarketEvent, WatchlistItem } from "@/types/database";
import { filterUpcomingMarketEvents } from "@/lib/timeline-upcoming";
import { formatEtTimeShort } from "@/lib/date-utils";
import { TimelinePager } from "@/components/timeline-pager";

const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const ACCENT  = "#6C5CE7";

type Tab = "macro" | "tickers";

export function DashboardTimelineTabs({
  events,
  watchlistItems,
  perPage = 2,
  guestMode = false,
  pastArchiveMode = false,
  sectionTitle = "Timeline",
  sectionSubtitle,
  readMoreUrlsByEventId,
  dataFetchedAt,
}: {
  events: MarketEvent[];
  watchlistItems: WatchlistItem[];
  perPage?: number;
  guestMode?: boolean;
  pastArchiveMode?: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  readMoreUrlsByEventId?: Record<string, string>;
  dataFetchedAt?: string;
}) {
  const processed = useMemo(() => {
    if (pastArchiveMode) return events;
    return filterUpcomingMarketEvents(events);
  }, [events, pastArchiveMode]);

  const macroEvents  = useMemo(() => processed.filter((e) => !e.ticker?.trim()), [processed]);
  const tickerEvents = useMemo(() => processed.filter((e) => Boolean(e.ticker?.trim())), [processed]);

  const [tab, setTab] = useState<Tab>("macro");
  const activeList = tab === "macro" ? macroEvents : tickerEvents;

  const sortedWatchlist = useMemo(
    () => [...watchlistItems].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [watchlistItems],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Meta line */}
      {(sectionSubtitle || dataFetchedAt) && (
        <div>
          {sectionSubtitle && (
            <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)", margin: 0 }}>
              {sectionSubtitle}
            </p>
          )}
          {dataFetchedAt && (
            <p style={{ fontFamily: SANS_L, fontSize: 11, color: "var(--ab-faint)", marginTop: 4 }}>
              Updated {formatEtTimeShort(new Date(dataFetchedAt))}
            </p>
          )}
        </div>
      )}

      {/* Pill tab strip — matches L_Dashboard & LP_Archive reference */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {(["macro", "tickers"] as const).map((id) => {
          const active = tab === id;
          const count = id === "macro" ? macroEvents.length : tickerEvents.length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                fontFamily: SERIF_L,
                fontSize: 13,
                padding: "3px 12px",
                borderRadius: 99,
                border: `1px solid ${active ? ACCENT : "var(--ab-border)"}`,
                color: active ? ACCENT : "var(--ab-muted)",
                background: active ? "var(--ab-surface-hi)" : "transparent",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
              }}
            >
              {id === "macro" ? "Macro" : "Tickers"}{" "}
              <span style={{ color: "var(--ab-faint)" }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tickers watchlist row */}
      {tab === "tickers" && sortedWatchlist.length > 0 && (
        <div>
          <p style={{
            fontFamily: SANS_L, fontSize: 10, fontWeight: 700,
            letterSpacing: ".18em", textTransform: "uppercase",
            color: "var(--ab-faint)", marginBottom: 8,
          }}>
            Your watchlist
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sortedWatchlist.map((item) => (
              <span
                key={item.id}
                style={{
                  fontFamily: SANS_L, fontSize: 11, fontWeight: 700,
                  color: "var(--ab-fg)", border: "1px solid var(--ab-border)",
                  background: "var(--ab-surface)", padding: "2px 8px",
                }}
              >
                {item.ticker}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "tickers" && sortedWatchlist.length === 0 && (
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)" }}>
          {guestMode
            ? "Sign in and add tickers to see company-specific catalysts in this tab."
            : "Add tickers in the watchlist above to populate ticker-linked events."}
        </p>
      )}

      <TimelinePager
        key={tab}
        events={activeList}
        perPage={perPage}
        readMoreUrlsByEventId={readMoreUrlsByEventId}
        showTickerBadge={tab === "tickers"}
        archiveMode={pastArchiveMode}
      />
    </div>
  );
}
