"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "@/types/news";
import { formatEtTimeShort } from "@/lib/date-utils";

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

function impactBarClass(impact: NewsArticle["marketImpact"]): string {
  if (impact === "bullish") return "bg-emerald-500";
  if (impact === "bearish") return "bg-rose-500";
  return "bg-amber-400";
}

function impactBadgeClass(impact: NewsArticle["marketImpact"]): string {
  if (impact === "bullish") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (impact === "bearish") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
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

  return (
    <article className="flex gap-0 py-5">
      <div
        className={`w-1 shrink-0 rounded-full ${impactBarClass(article.marketImpact)}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pl-4 sm:pl-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--faint)]">
          {article.publishedAt ? (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          ) : null}
          <span className="text-[var(--muted)]">{article.source}</span>
          {article.matchedTicker ? (
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-highlight)] px-2 py-0.5 font-semibold text-[var(--foreground)]">
              {article.matchedTicker}
            </span>
          ) : null}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${impactBadgeClass(article.marketImpact)}`}>
            {article.marketImpact}
          </span>
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-[var(--foreground)]">
          {article.title}
        </h3>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
        )}

        {hasKeyPoints && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]"
            >
              {expanded ? "Hide key points ▴" : "Key points ▾"}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                {article.keyPoints!.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--foreground)]">
                    <span className="mt-0.5 shrink-0 text-[var(--accent)]">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-muted)]"
        >
          Open →
        </a>
      </div>
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
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
        {dataFetchedAt ? (
          <p className="mt-1 text-xs text-[var(--faint)]">
            Updated {formatEtTimeShort(new Date(dataFetchedAt))}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
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
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                tab === id
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {slice.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {tab === "tickers" && emptyHintTickers
            ? emptyHintTickers
            : "Nothing here yet — try another tab or check back after the next refresh."}
        </p>
      ) : (
        <div className="space-y-0">
          <div className="divide-y divide-[var(--border)]">
            {slice.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {pageCount > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs text-[var(--faint)]">
                {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition enabled:hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
