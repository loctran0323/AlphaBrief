import { removeTicker } from "@/app/dashboard/actions";
import { AddTickerForm } from "@/components/add-ticker-form";
import type { WatchlistItem } from "@/types/database";

export function WatchlistPanel({
  watchlistId,
  items,
}: {
  watchlistId: string;
  items: WatchlistItem[];
}) {
  const sorted = [...items].sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <div className="space-y-4">
      <AddTickerForm watchlistId={watchlistId} size="md" placeholder="Ticker (e.g. AAPL)" />

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No tickers yet. Add a few symbols to pull in headline matches and ticker timeline rows.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-highlight)] pl-3 text-sm text-[var(--foreground)]"
            >
              <span className="font-semibold">{item.ticker}</span>
              <form action={removeTicker}>
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-r-full px-2 py-1 text-[var(--faint)] transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${item.ticker}`}
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
