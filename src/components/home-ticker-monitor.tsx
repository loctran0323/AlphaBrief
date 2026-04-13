"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addTicker, removeTicker } from "@/app/dashboard/actions";
import type { WatchlistItem } from "@/types/database";

export type HomeQuoteRow = {
  symbol: string;
  shortName: string;
  price: number | null;
  changePct: number;
};

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function pctClass(pct: number): string {
  if (pct > 0.005) return "text-emerald-600";
  if (pct < -0.005) return "text-red-600";
  return "text-[var(--muted)]";
}

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatSidebarPrice(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1000) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return money.format(value);
}

export function HomeTickerMonitor({
  layout = "default",
  isAuthenticated,
  watchlistId,
  savedItems,
  savedQuotes,
}: {
  layout?: "default" | "sidebar";
  isAuthenticated: boolean;
  watchlistId: string | null;
  savedItems: WatchlistItem[];
  savedQuotes: HomeQuoteRow[];
}) {
  const side = layout === "sidebar";

  const [guestSymbols, setGuestSymbols] = useState<string[]>([]);
  const [guestQuotes, setGuestQuotes] = useState<HomeQuoteRow[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestInput, setGuestInput] = useState("");

  const fetchGuestQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) {
      setGuestQuotes([]);
      return;
    }
    setGuestLoading(true);
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
      if (!res.ok) throw new Error("quotes failed");
      const data = (await res.json()) as { quotes: HomeQuoteRow[] };
      setGuestQuotes(data.quotes ?? []);
    } catch {
      setGuestQuotes([]);
    } finally {
      setGuestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;
    void fetchGuestQuotes(guestSymbols);
  }, [isAuthenticated, guestSymbols, fetchGuestQuotes]);

  const sortedSaved = useMemo(
    () => [...savedItems].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [savedItems],
  );

  function addGuestTicker(e: React.FormEvent) {
    e.preventDefault();
    const t = normalizeTicker(guestInput);
    setGuestInput("");
    if (!t || guestSymbols.includes(t)) return;
    setGuestSymbols((prev) => [...prev, t]);
  }

  function removeGuestTicker(sym: string) {
    setGuestSymbols((prev) => prev.filter((s) => s !== sym));
  }

  const shell = side
    ? "rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm"
    : "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5";

  if (isAuthenticated && !watchlistId) {
    return (
      <div className={shell}>
        <h2 className={side ? "text-sm font-semibold text-[var(--foreground)]" : "text-base font-semibold text-[var(--foreground)]"}>
          Your tickers
        </h2>
        <p className={`mt-2 text-[var(--muted)] ${side ? "text-[11px] leading-snug" : "text-sm"}`}>
          Watchlist could not load.{" "}
          <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
            Dashboard
          </Link>
        </p>
      </div>
    );
  }

  if (isAuthenticated && watchlistId) {
    const quoteBySymbol = new Map(savedQuotes.map((q) => [q.symbol.toUpperCase(), q]));

    if (side) {
      return (
        <div className={shell}>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Your tickers</h2>
          <p className="mt-0.5 text-[10px] leading-snug text-[var(--muted)]">
            Synced with dashboard · news &amp; timeline
          </p>

          <form action={addTicker} className="mt-2.5 flex gap-1.5">
            <input type="hidden" name="watchlist_id" value={watchlistId} />
            <label className="sr-only" htmlFor="home-ticker-add">
              Ticker
            </label>
            <input
              id="home-ticker-add"
              name="ticker"
              placeholder="AAPL"
              maxLength={16}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--accent-muted)]"
            >
              Add
            </button>
          </form>

          {sortedSaved.length === 0 ? (
            <p className="mt-2 text-[11px] text-[var(--muted)]">Add symbols above.</p>
          ) : (
            <ul className="mt-2 space-y-0">
              {sortedSaved.map((item) => {
                const q = quoteBySymbol.get(item.ticker.toUpperCase());
                const name = q?.shortName ?? "—";
                const pct = q
                  ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
                  : "—";
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-1 border-b border-[var(--border)] py-1.5 last:border-0"
                  >
                    <span
                      className="w-[3.25rem] shrink-0 truncate font-mono text-[11px] font-semibold text-[var(--foreground)]"
                      title={name}
                    >
                      {item.ticker}
                    </span>
                    <div className="min-w-0 flex-1 text-right">
                      <span className="tabular-nums text-[11px] text-[var(--foreground)]">
                        {q?.price != null && Number.isFinite(q.price)
                          ? formatSidebarPrice(q.price)
                          : "—"}
                      </span>
                      <span className={`ml-1 tabular-nums text-[10px] ${pctClass(q?.changePct ?? 0)}`}>
                        {pct}
                      </span>
                    </div>
                    <form action={removeTicker} className="shrink-0">
                      <input type="hidden" name="item_id" value={item.id} />
                      <button
                        type="submit"
                        className="flex h-6 w-6 items-center justify-center rounded text-[14px] leading-none text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.ticker}`}
                      >
                        ×
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    }

    return (
      <div className={shell}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">Your tickers</h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Saved to your account — same list as on Dashboard (news &amp; timeline use these symbols).
        </p>

        <form action={addTicker} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="watchlist_id" value={watchlistId} />
          <label className="sr-only" htmlFor="home-ticker-add-wide">
            Ticker symbol
          </label>
          <input
            id="home-ticker-add-wide"
            name="ticker"
            placeholder="e.g. AAPL"
            maxLength={16}
            autoComplete="off"
            className="min-w-[7rem] max-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)]"
          >
            Add
          </button>
        </form>

        {sortedSaved.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No symbols yet — add a ticker above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {sortedSaved.map((item) => {
              const q = quoteBySymbol.get(item.ticker.toUpperCase());
              return (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-[var(--foreground)]">{item.ticker}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{q?.shortName ?? "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm tabular-nums text-[var(--foreground)]">
                      {q?.price != null && Number.isFinite(q.price) ? money.format(q.price) : "—"}
                    </p>
                    <p className={`text-xs tabular-nums ${pctClass(q?.changePct ?? 0)}`}>
                      {q
                        ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>
                  <form action={removeTicker}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-red-300 hover:text-red-600"
                      aria-label={`Remove ${item.ticker}`}
                    >
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  const guestQuoteBySymbol = new Map(guestQuotes.map((q) => [q.symbol.toUpperCase(), q]));

  if (side) {
    return (
      <div className={shell}>
        <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Your tickers</h2>
        <p className="mt-0.5 text-[10px] leading-snug text-[var(--muted)]">
          Not saved until you sign in.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] leading-tight text-amber-700">
          <Link href="/login?next=/home" className="font-semibold text-[var(--accent)] hover:underline">
            Log in
          </Link>
          <span className="text-[var(--muted)]">·</span>
          <Link href="/signup?next=/home" className="font-semibold text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </div>

        <form onSubmit={addGuestTicker} className="mt-2 flex gap-1.5">
          <label className="sr-only" htmlFor="home-guest-ticker">
            Ticker
          </label>
          <input
            id="home-guest-ticker"
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            placeholder="AAPL"
            maxLength={16}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/25"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--accent-muted)]"
          >
            Add
          </button>
        </form>

        {guestSymbols.length === 0 ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">Add symbols to quote.</p>
        ) : (
          <>
            {guestLoading && <p className="mt-1.5 text-[10px] text-[var(--muted)]">Loading…</p>}
            <ul className="mt-1.5 space-y-0">
              {guestSymbols.map((sym) => {
                const q = guestQuoteBySymbol.get(sym.toUpperCase());
                const pct = q
                  ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
                  : "—";
                return (
                  <li
                    key={sym}
                    className="flex items-center gap-1 border-b border-[var(--border)] py-1.5 last:border-0"
                  >
                    <span
                      className="w-[3.25rem] shrink-0 truncate font-mono text-[11px] font-semibold text-[var(--foreground)]"
                      title={q?.shortName ?? sym}
                    >
                      {sym}
                    </span>
                    <div className="min-w-0 flex-1 text-right">
                      <span className="tabular-nums text-[11px] text-[var(--foreground)]">
                        {q?.price != null && Number.isFinite(q.price)
                          ? formatSidebarPrice(q.price)
                          : "—"}
                      </span>
                      <span className={`ml-1 tabular-nums text-[10px] ${pctClass(q?.changePct ?? 0)}`}>
                        {pct}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGuestTicker(sym)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[14px] text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${sym}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={shell}>
      <h2 className="text-base font-semibold text-[var(--foreground)]">Your tickers</h2>
      <p className="mt-0.5 text-xs text-[var(--muted)]">
        Track any symbols for this visit.{" "}
        <span className="text-[var(--foreground)]">Sign in to save your list to your account</span> and
        sync with the full dashboard.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <span>You&apos;re not signed in — tickers below are not saved.</span>
        <Link href="/login?next=/home" className="font-semibold text-[var(--accent)] hover:underline">
          Log in
        </Link>
        <span className="text-[var(--muted)]">·</span>
        <Link href="/signup?next=/home" className="font-semibold text-[var(--accent)] hover:underline">
          Sign up
        </Link>
      </div>

      <form onSubmit={addGuestTicker} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="sr-only" htmlFor="home-guest-ticker-wide">
          Ticker symbol
        </label>
        <input
          id="home-guest-ticker-wide"
          value={guestInput}
          onChange={(e) => setGuestInput(e.target.value)}
          placeholder="e.g. AAPL"
          maxLength={16}
          autoComplete="off"
          className="min-w-[7rem] max-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-muted)]"
        >
          Add
        </button>
      </form>

      {guestSymbols.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Add tickers to see live price and day change.</p>
      ) : (
        <>
          {guestLoading && <p className="mt-3 text-xs text-[var(--muted)]">Loading quotes…</p>}
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {guestSymbols.map((sym) => {
              const q = guestQuoteBySymbol.get(sym.toUpperCase());
              return (
                <li key={sym} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-[var(--foreground)]">{sym}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{q?.shortName ?? "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm tabular-nums text-[var(--foreground)]">
                      {q?.price != null && Number.isFinite(q.price) ? money.format(q.price) : "—"}
                    </p>
                    <p className={`text-xs tabular-nums ${pctClass(q?.changePct ?? 0)}`}>
                      {q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGuestTicker(sym)}
                    className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-red-300 hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
