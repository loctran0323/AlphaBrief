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
import { LedgerMasthead, LedgerRuleLabel } from "@/components/ledger-ui";
import { StockChart } from "./stock-chart";
import { TickerSearch } from "../ticker-search";
import { PriceAlertForm } from "./price-alert-form";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} · AlphaBrief Research` };
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--ab-border)" }}>
      <span style={{ fontSize: 13, color: "var(--ab-muted)" }}>{label}</span>
      <span style={{ fontFamily: SERIF_L, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
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

export default async function ResearchSymbolPage({ params }: Props) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [quote, chartData, news] = await Promise.all([
    fetchStockDetail(symbol),
    fetchStockChart(symbol, "3mo"),
    fetchTickerNews(symbol),
  ]);

  if (!quote) notFound();

  const isPositive = quote.changePct >= 0;
  const changeColor = isPositive ? "var(--ab-up)" : "var(--ab-down)";
  const changeSign = isPositive ? "+" : "";
  const price = quote.price != null
    ? `$${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

  return (
    <div style={{ paddingBottom: 64, fontFamily: SANS_L }}>

      {/* ── Persistent search strip ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--ab-border)", paddingBottom: 10, marginBottom: 28,
        fontSize: 13, color: "var(--ab-muted)",
      }}>
        <span style={{ color: "var(--ab-faint)" }}>⌕</span>
        <span style={{ fontFamily: SERIF_L, fontStyle: "italic" }}>Currently reading:</span>
        <span style={{ fontFamily: SERIF_L, fontWeight: 600, color: "var(--ab-fg)" }}>
          {symbol}{quote.shortName && ` · ${quote.shortName}`}
        </span>
        <Link href="/dashboard/research" style={{
          marginLeft: "auto", fontSize: 11, color: "var(--ab-faint)",
          letterSpacing: ".12em", textDecoration: "none",
        }}>
          ← Search another
        </Link>
      </div>

      {/* ── Masthead ── */}
      <LedgerMasthead
        eyebrow={`Ticker profile · ${quote.exchange ?? "Market"}`}
        title={quote.shortName || symbol}
        dek={`${symbol}: live price, valuation stats, catalysts, and recent news from the wire.`}
      />

      {/* ── Price line ── */}
      <div className="flex items-baseline justify-between" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: SERIF_L, fontSize: 48, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {price}
          </div>
          <div style={{ fontSize: 14, color: changeColor, fontVariantNumeric: "tabular-nums", fontWeight: 600, marginTop: 2 }}>
            {changeSign}{quote.change.toFixed(2)} ({changeSign}{quote.changePct.toFixed(2)}%) today
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ border: "1px solid var(--ab-border)", background: "var(--ab-card)", padding: "18px 10px 6px", marginBottom: 0 }}>
        <StockChart symbol={symbol} initialData={chartData} initialRange="3mo" isPositive={isPositive} />
      </div>

      {/* ── Stats two columns ── */}
      <LedgerRuleLabel>Price statistics &amp; valuation</LedgerRuleLabel>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700, marginBottom: 10 }}>Price statistics</div>
          <StatRow label="Previous close" value={quote.previousClose != null ? `$${quote.previousClose.toFixed(2)}` : "—"} />
          <StatRow label="Open"           value={quote.open != null ? `$${quote.open.toFixed(2)}` : "—"} />
          <StatRow label="Day range"      value={quote.dayLow != null && quote.dayHigh != null ? `$${quote.dayLow.toFixed(2)} – $${quote.dayHigh.toFixed(2)}` : "—"} />
          <StatRow label="52-week range"  value={quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null ? `$${quote.fiftyTwoWeekLow.toFixed(2)} – $${quote.fiftyTwoWeekHigh.toFixed(2)}` : "—"} />
          <StatRow label="Volume"         value={formatVolume(quote.volume)} />
          <StatRow label="Avg volume"     value={formatVolume(quote.avgVolume)} />
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700, marginBottom: 10 }}>Valuation</div>
          <StatRow label="Market cap"    value={formatLargeNumber(quote.marketCap)} />
          <StatRow label="P/E (TTM)"     value={formatNum(quote.trailingPE)} />
          <StatRow label="Forward P/E"   value={formatNum(quote.forwardPE)} />
          <StatRow label="EPS (TTM)"     value={quote.eps != null ? `$${quote.eps.toFixed(2)}` : "—"} />
          <StatRow label="Beta"          value={formatNum(quote.beta)} />
          <StatRow label="Dividend yield" value={quote.dividendYield != null ? `${(quote.dividendYield * 100).toFixed(2)}%` : "—"} />
        </div>
      </div>

      {/* ── Price alert ── */}
      <LedgerRuleLabel>Notify me</LedgerRuleLabel>
      {user ? (
        <PriceAlertForm symbol={symbol} currentPrice={quote.price} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)" }}>
            <Link href={`/login?next=/dashboard/research/${symbol}`} style={{ color: ACCENT }}>Log in</Link>{" "}
            to get emailed when {symbol} hits your target price.
          </div>
        </div>
      )}

      {/* ── News ── */}
      <LedgerRuleLabel>From the wire · {symbol}</LedgerRuleLabel>

      {news.length === 0 ? (
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 14, color: "var(--ab-muted)" }}>No recent news found.</p>
      ) : (
        <>
          {news.map((item, i) => (
            <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid var(--ab-border)" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                fontFamily: SANS_L, fontSize: 10, letterSpacing: ".12em",
                textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700, marginBottom: 6,
              }}>
                <span>{item.source}</span>
                <span>·</span>
                <span>{timeAgo(item.pubDate)}</span>
              </div>
              <h3 style={{ fontFamily: SERIF_L, fontSize: 20, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-.01em", color: "var(--ab-fg)", margin: 0 }}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {item.title}
                </a>
              </h3>
              {item.description && (
                <p style={{ fontFamily: SERIF_L, fontSize: 14, color: "var(--ab-muted)", marginTop: 6, lineHeight: 1.55 }}>
                  {item.description}
                </p>
              )}
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: ACCENT, letterSpacing: ".04em", fontFamily: SANS_L, textDecoration: "none" }}>
                Read full story →
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
