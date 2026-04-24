import { removeTicker } from "@/app/dashboard/actions";
import { AddTickerForm } from "@/components/add-ticker-form";
import type { WatchlistItem } from "@/types/database";

const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;

export function WatchlistPanel({
  watchlistId,
  items,
}: {
  watchlistId: string;
  items: WatchlistItem[];
}) {
  const sorted = [...items].sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AddTickerForm watchlistId={watchlistId} size="md" placeholder="Ticker (e.g. AAPL)" />

      {sorted.length === 0 ? (
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)" }}>
          No tickers yet. Add a few symbols to pull in headline matches and ticker timeline rows.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {sorted.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex", alignItems: "center", gap: 0,
                border: "1px solid var(--ab-border)", background: "var(--ab-surface)",
              }}
            >
              <span style={{ fontFamily: SANS_L, fontSize: 11, fontWeight: 700, color: "var(--ab-fg)", padding: "3px 8px" }}>
                {item.ticker}
              </span>
              <form action={removeTicker}>
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  style={{
                    fontFamily: SANS_L, fontSize: 13, color: "var(--ab-faint)",
                    background: "none", border: "none", borderLeft: "1px solid var(--ab-border)",
                    padding: "2px 7px", cursor: "pointer", lineHeight: 1.5,
                  }}
                  aria-label={`Remove ${item.ticker}`}
                >
                  ×
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
