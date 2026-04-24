"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "@/types/news";
import { formatEtTimeShort } from "@/lib/date-utils";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const CATEGORIES = ["economics", "markets", "consumers", "companies", "policy"] as const;
type Category = (typeof CATEGORIES)[number];
type Tab = "all" | "tickers" | Category;

const categoryLabel: Record<Category, string> = {
  economics: "Economics",
  markets: "Markets",
  consumers: "Consumers",
  companies: "Companies",
  policy: "Policy",
};

function tagStyle(impact: NewsArticle["marketImpact"]): React.CSSProperties {
  if (impact === "bullish") return { background: "rgba(16,185,129,.12)", color: "var(--ab-up)" };
  if (impact === "bearish") return { background: "rgba(244,63,94,.12)", color: "var(--ab-down)" };
  return { background: "var(--ab-surface)", color: "var(--ab-muted)" };
}

/** Normalise text for comparison. */
function normText(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/** Pick the best one-line description to show under the headline. */
function pickDescription(article: NewsArticle): string | null {
  const nt = normText(article.title);

  // Use summary if it has meaningful content beyond the title
  if (article.summary) {
    const ns = normText(article.summary);
    // Show if meaningfully different: not an exact match AND either longer or clearly different start
    const sameStart = ns.startsWith(nt.slice(0, Math.min(nt.length, 80)));
    if (!(sameStart && ns.length <= nt.length + 30)) {
      return article.summary;
    }
  }

  // Fall back to rationale if it's informative (not the generic placeholder)
  if (
    article.marketImpactRationale &&
    !article.marketImpactRationale.startsWith("Mixed or company-specific") &&
    !article.marketImpactRationale.startsWith("Alpha Vantage rates")
  ) {
    return article.marketImpactRationale;
  }

  return null;
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);
  const hasKeyPoints = Array.isArray(article.keyPoints) && article.keyPoints.length > 0;
  const description = pickDescription(article);
  const timeStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <article style={{ padding: "16px 0", borderBottom: "1px solid var(--ab-border)" }}>
      {/* Metadata row: source · time · tag(s) */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
        fontFamily: SANS_L, fontSize: 10, letterSpacing: ".12em",
        textTransform: "uppercase", color: "var(--ab-faint)", fontWeight: 700,
        marginBottom: 6,
      }}>
        <span>{article.source}</span>
        {timeStr && <><span>·</span><span>{timeStr}</span></>}
        {article.matchedTicker && (
          <span style={{ padding: "1px 6px", background: "var(--ab-surface-hi)", color: ACCENT }}>
            {article.matchedTicker}
          </span>
        )}
        <span style={{ padding: "1px 6px", ...tagStyle(article.marketImpact) }}>
          {article.marketImpact?.toUpperCase()}
        </span>
      </div>

      {/* Headline */}
      <h3 style={{
        fontFamily: SERIF_L, fontSize: 19, fontWeight: 600,
        lineHeight: 1.2, letterSpacing: "-.01em", color: "var(--ab-fg)",
        margin: 0,
      }}>
        <a href={article.url} target="_blank" rel="noreferrer"
          style={{ color: "inherit", textDecoration: "none" }}>
          {article.title}
        </a>
      </h3>

      {/* Body / description */}
      {description && (
        <p style={{
          fontFamily: SERIF_L, fontSize: 14, color: "var(--ab-muted)",
          marginTop: 6, lineHeight: 1.55,
        }}>{description}</p>
      )}

      {/* Key points (expandable) */}
      {hasKeyPoints && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontFamily: SANS_L, fontSize: 11, color: ACCENT,
              background: "none", border: "none", cursor: "pointer",
              padding: 0, letterSpacing: ".04em",
            }}
          >
            {expanded ? "Hide key points ▴" : "Key points ▾"}
          </button>
          {expanded && (
            <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
              {article.keyPoints!.map((point, i) => (
                <li key={i} style={{
                  display: "flex", gap: 8, fontSize: 13,
                  fontFamily: SERIF_L, color: "var(--ab-fg)",
                  lineHeight: 1.55, padding: "3px 0",
                }}>
                  <span style={{ color: ACCENT, flexShrink: 0 }}>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Read link */}
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block", marginTop: 8,
          fontFamily: SANS_L, fontSize: 11, color: ACCENT,
          letterSpacing: ".04em", textDecoration: "none",
        }}
      >
        Read full story →
      </a>
    </article>
  );
}

export function NewsBriefing({
  articles,
  watchlistTickers = [],
  itemsPerPage = 4,
  title = "News briefing",
  emptyHintTickers,
  dataFetchedAt,
}: {
  articles: NewsArticle[];
  watchlistTickers?: string[];
  itemsPerPage?: number;
  title?: string;
  emptyHintTickers?: string;
  dataFetchedAt?: string;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);

  const watchlistSet = useMemo(
    () => new Set(watchlistTickers.map((t) => t.toUpperCase())),
    [watchlistTickers],
  );

  const filtered = useMemo(() => {
    if (tab === "all") return articles;
    if (tab === "tickers")
      // Only articles whose matched ticker is in the user's actual watchlist
      return articles.filter(
        (a) => a.matchedTicker && watchlistSet.has(a.matchedTicker.toUpperCase()),
      );
    return articles.filter((a) => a.category === tab);
  }, [articles, tab, watchlistSet]);

  useEffect(() => {
    setPage(0);
  }, [tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);

  const tabIds: Tab[] = ["all", "tickers", ...CATEGORIES];

  return (
    <div>
      {/* Category tabs — serif text with accent underline on active */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0 24px", marginBottom: 16,
        fontFamily: SERIF_L, fontSize: 14,
      }}>
        {tabIds.map((id) => {
          const label =
            id === "all" ? "All"
            : id === "tickers" ? "Tickers"
            : categoryLabel[id as Category];
          const count =
            id === "all" ? articles.length
            : id === "tickers"
              ? articles.filter((a) => a.matchedTicker && watchlistSet.has(a.matchedTicker.toUpperCase())).length
            : articles.filter((a) => a.category === id).length;
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "0 0 2px",
                fontFamily: SERIF_L, fontSize: 14,
                color: active ? "var(--ab-fg)" : "var(--ab-muted)",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent",
              }}
            >
              {label} <span style={{ color: "var(--ab-faint)" }}>({count})</span>
            </button>
          );
        })}
      </div>

      {dataFetchedAt && (
        <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)", marginBottom: 8 }}>
          Updated {formatEtTimeShort(new Date(dataFetchedAt))}
        </p>
      )}

      {slice.length === 0 ? (
        <p style={{ fontFamily: SERIF_L, fontSize: 14, color: "var(--ab-muted)", lineHeight: 1.55 }}>
          {tab === "tickers" && emptyHintTickers
            ? emptyHintTickers
            : "Nothing here yet — try another tab or check back after the next refresh."}
        </p>
      ) : (
        <>
          {/* 2-column grid matching the reference */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 32px" }}>
            {slice.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {pageCount > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
              marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--ab-border)",
            }}>
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  padding: "5px 14px", border: "1px solid var(--ab-border)",
                  background: "transparent", color: "var(--ab-muted)",
                  cursor: safePage <= 0 ? "not-allowed" : "pointer", opacity: safePage <= 0 ? 0.4 : 1,
                }}
              >← Prev</button>
              <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-faint)" }}>
                {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                style={{
                  fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  padding: "5px 14px", border: "1px solid var(--ab-border)",
                  background: "transparent", color: "var(--ab-muted)",
                  cursor: safePage >= pageCount - 1 ? "not-allowed" : "pointer",
                  opacity: safePage >= pageCount - 1 ? 0.4 : 1,
                }}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
