import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchStockDetail,
  fetchStockChart,
  fetchTickerNews,
  formatLargeNumber,
  formatVolume,
  formatNum,
} from "@/lib/stock-research";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { StockChart } from "./stock-chart";
import { TickerSearch } from "../ticker-search";
import { PriceAlertForm } from "./price-alert-form";

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} — AlphaBrief Research` };
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="text-xs font-semibold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FREE_NEWS_LIMIT = 3;

export default async function ResearchSymbolPage({ params }: Props) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tier = user ? await getUserTier(supabase, user.id, user.email) : "free";
  const isPro = tier === "pro";

  const [quote, chartData, news] = await Promise.all([
    fetchStockDetail(symbol),
    fetchStockChart(symbol, "3mo"),
    fetchTickerNews(symbol),
  ]);

  if (!quote) notFound();

  const isPositive = quote.changePct >= 0;
  const changeColor = isPositive ? "text-emerald-600" : "text-red-500";
  const changeSign = isPositive ? "+" : "";
  const price = quote.price != null
    ? `$${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

  const visibleNews = isPro ? news : news.slice(0, FREE_NEWS_LIMIT);
  const hiddenCount = news.length - visibleNews.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Search bar */}
      <div className="pt-2">
        <TickerSearch />
      </div>

      {/* Header + Chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[var(--accent)]">{symbol}</span>
              {quote.exchange && (
                <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--faint)]">
                  {quote.exchange}
                </span>
              )}
            </div>
            <h1 className="mt-0.5 text-xl font-bold text-[var(--foreground)]">{quote.shortName}</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums text-[var(--foreground)]">{price}</p>
            <p className={`mt-0.5 text-sm font-semibold tabular-nums ${changeColor}`}>
              {changeSign}{quote.change.toFixed(2)} ({changeSign}{quote.changePct.toFixed(2)}%)
            </p>
          </div>
        </div>
        <div className="mt-6">
          <StockChart symbol={symbol} initialData={chartData} initialRange="3mo" isPositive={isPositive} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Price statistics</h2>
          <StatRow label="Previous close" value={quote.previousClose != null ? `$${quote.previousClose.toFixed(2)}` : "—"} />
          <StatRow label="Open" value={quote.open != null ? `$${quote.open.toFixed(2)}` : "—"} />
          <StatRow label="Day range" value={quote.dayLow != null && quote.dayHigh != null ? `$${quote.dayLow.toFixed(2)} – $${quote.dayHigh.toFixed(2)}` : "—"} />
          <StatRow label="52-week range" value={quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null ? `$${quote.fiftyTwoWeekLow.toFixed(2)} – $${quote.fiftyTwoWeekHigh.toFixed(2)}` : "—"} />
          <StatRow label="Volume" value={formatVolume(quote.volume)} />
          <StatRow label="Avg volume" value={formatVolume(quote.avgVolume)} />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Valuation</h2>
          <StatRow label="Market cap" value={formatLargeNumber(quote.marketCap)} />
          <StatRow label="P/E ratio (TTM)" value={formatNum(quote.trailingPE)} />
          <StatRow label="Forward P/E" value={formatNum(quote.forwardPE)} />
          <StatRow label="EPS (TTM)" value={quote.eps != null ? `$${quote.eps.toFixed(2)}` : "—"} />
          <StatRow label="Beta" value={formatNum(quote.beta)} />
          <StatRow label="Dividend yield" value={quote.dividendYield != null ? `${(quote.dividendYield * 100).toFixed(2)}%` : "—"} />
        </div>
      </div>

      {/* Price alert — Pro only */}
      {isPro ? (
        <PriceAlertForm symbol={symbol} currentPrice={quote.price} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Price alert</h2>
            <span className="rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-semibold text-[#6C5CE7]">Pro</span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Get emailed in your digest when {symbol} hits a target price.{" "}
            <Link href="/dashboard/upgrade" className="text-[var(--accent)] hover:underline">
              Upgrade to Pro →
            </Link>
          </p>
        </div>
      )}

      {/* News */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent news — {symbol}</h2>
          {!isPro && news.length > 0 && (
            <span className="text-[10px] text-[var(--faint)]">{FREE_NEWS_LIMIT} of {news.length}</span>
          )}
        </div>

        {news.length === 0 ? (
          <p className="text-sm text-[var(--faint)]">No recent news found.</p>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {visibleNews.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="group block py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">{item.description}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--faint)]">{item.source} · {timeAgo(item.pubDate)}</p>
                </a>
              ))}
            </div>

            {/* Pro gate for remaining news */}
            {!isPro && hiddenCount > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--surface-highlight)] px-5 py-4 text-center">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  +{hiddenCount} more article{hiddenCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Pro members get the full news feed for every ticker.</p>
                <Link
                  href="/dashboard/upgrade"
                  className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-muted)]"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center">
        <Link href="/dashboard/research" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
          ← Search another ticker
        </Link>
      </div>
    </div>
  );
}
