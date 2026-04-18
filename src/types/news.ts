export type NewsArticle = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  keyPoints?: string[];
  matchedTicker: string | null;
  category: "economics" | "markets" | "consumers" | "companies" | "policy";
  marketImpact: "bullish" | "bearish" | "neutral";
  marketImpactRationale: string;
};
