export type MarketMapLeaf = {
  name: string;
  symbol: string;
  shortName: string;
  size: number;
  /** vs. prior trading-day close (live price from Yahoo meta when available). */
  changePct: number;
  price: number | null;
};

export type MarketMapIndustry = {
  name: string;
  children: MarketMapLeaf[];
};

export type MarketMapSector = {
  name: string;
  children: MarketMapIndustry[];
};

export type MarketMapRoot = {
  name: string;
  children: MarketMapSector[];
};

/** Treemap ribbon labels — short enough to avoid mid-word “…” truncation. */
const SECTOR_TREEMAP_LABEL: Record<string, string> = {
  Technology: "Tech",
  Communications: "Comm",
  Consumer: "Cons",
  Staples: "Staples",
  Healthcare: "Health",
  Financials: "Fin",
  Energy: "Energy",
  Industrials: "Indust",
  Materials: "Matls",
  Utilities: "Utils",
};

const INDUSTRY_TREEMAP_LABEL: Record<string, string> = {
  Semiconductors: "Semis",
  Software: "Software",
  "Hardware & IT services": "HW & IT",
  "Internet & media": "Media",
  Telecom: "Telco",
  "E‑commerce & autos": "E-com & EV",
  "Retail & dining": "Retail",
  "Household & food": "Household",
  Tobacco: "Tobacco",
  "Managed care & tools": "Mgd care",
  "Pharma & biotech": "Pharma",
  Banks: "Banks",
  "Capital markets": "Cap mkts",
  "Integrated & E&P": "Oil & E&P",
  "Oilfield & refining": "Oilfield",
  "Machinery & transport": "Machinery",
  "Chemicals & mining": "Chemicals",
  "Regulated utilities": "Utilities",
};

export function treemapSectorLabel(name: string): string {
  return SECTOR_TREEMAP_LABEL[name] ?? name;
}

export function treemapIndustryLabel(name: string): string {
  if (INDUSTRY_TREEMAP_LABEL[name]) return INDUSTRY_TREEMAP_LABEL[name]!;
  const parts = name.split(/[\s&‑-]+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return parts.map((p) => p[0]!.toUpperCase()).join("");
}

export const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Sector → industry → tickers (large-cap style). Quotes and daily % from Yahoo Finance
 * chart API (v8); box size uses dollar volume proxy when volume is available.
 */
const MAP_STRUCTURE: {
  sector: string;
  industries: { name: string; tickers: string[] }[];
}[] = [
  {
    sector: "Technology",
    industries: [
      { name: "Semiconductors", tickers: ["NVDA", "AMD", "AVGO", "QCOM", "TXN", "INTC"] },
      { name: "Software", tickers: ["MSFT", "ORCL", "CRM", "ADBE", "NOW", "PANW", "INTU"] },
      { name: "Hardware & IT services", tickers: ["AAPL", "IBM", "ACN", "CSCO"] },
    ],
  },
  {
    sector: "Communications",
    industries: [
      { name: "Internet & media", tickers: ["GOOGL", "META", "NFLX", "DIS"] },
      { name: "Telecom", tickers: ["CMCSA", "T", "TMUS", "CHTR", "VZ"] },
    ],
  },
  {
    sector: "Consumer",
    industries: [
      { name: "E‑commerce & autos", tickers: ["AMZN", "TSLA", "BKNG"] },
      { name: "Retail & dining", tickers: ["HD", "NKE", "MCD", "SBUX", "LOW", "TJX"] },
    ],
  },
  {
    sector: "Staples",
    industries: [
      { name: "Household & food", tickers: ["WMT", "COST", "PG", "KO", "PEP", "MDLZ", "CL"] },
      { name: "Tobacco", tickers: ["PM", "MO"] },
    ],
  },
  {
    sector: "Healthcare",
    industries: [
      { name: "Managed care & tools", tickers: ["UNH", "TMO", "DHR", "ABT"] },
      { name: "Pharma & biotech", tickers: ["JNJ", "LLY", "MRK", "ABBV", "PFE", "BMY", "AMGN", "GILD"] },
    ],
  },
  {
    sector: "Financials",
    industries: [
      { name: "Banks", tickers: ["JPM", "BAC", "WFC", "C", "USB"] },
      { name: "Capital markets", tickers: ["GS", "MS", "BLK", "SCHW", "AXP"] },
    ],
  },
  {
    sector: "Energy",
    industries: [
      { name: "Integrated & E&P", tickers: ["XOM", "CVX", "COP", "EOG", "OXY"] },
      { name: "Oilfield & refining", tickers: ["SLB", "MPC", "PSX"] },
    ],
  },
  {
    sector: "Industrials",
    industries: [
      {
        name: "Machinery & transport",
        tickers: ["CAT", "DE", "HON", "UPS", "RTX", "LMT", "BA", "GE", "MMM", "UNP"],
      },
    ],
  },
  {
    sector: "Materials",
    industries: [
      { name: "Chemicals & mining", tickers: ["LIN", "APD", "SHW", "ECL", "NEM", "FCX"] },
    ],
  },
  {
    sector: "Utilities",
    industries: [{ name: "Regulated utilities", tickers: ["NEE", "DUK", "SO", "D", "AEP"] }],
  },
];

function uniqSymbols(): string[] {
  const all = MAP_STRUCTURE.flatMap((s) => s.industries.flatMap((i) => i.tickers));
  return [...new Set(all.map((x) => x.trim().toUpperCase()))].filter(Boolean);
}

type ChartApiResult = {
  meta?: {
    symbol?: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice?: number;
    regularMarketVolume?: number;
    chartPreviousClose?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
};

type SymbolSnapshot = {
  shortName: string;
  price: number | null;
  changePct: number;
  size: number;
};

const MIN_BOX = 5e8;
const DEFAULT_FALLBACK = 2e9;

function lastValidCloseIndices(closes: (number | null)[]): [number, number] | null {
  const idx: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i];
    if (c != null && Number.isFinite(c)) idx.push(i);
  }
  if (idx.length < 2) return null;
  return [idx[idx.length - 2]!, idx[idx.length - 1]!];
}

export async function fetchYahooChartSnapshot(symbol: string): Promise<SymbolSnapshot | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { chart?: { result?: ChartApiResult[] } };
  const result = json.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta ?? {};
  const quote = result.indicators?.quote?.[0];
  const closes = quote?.close ?? [];
  const volumes = quote?.volume ?? [];

  const pair = lastValidCloseIndices(closes);
  let changePct = 0;
  let price: number | null = meta.regularMarketPrice ?? null;

  if (pair) {
    const [prevI, lastI] = pair;
    const priorClose = closes[prevI]!;
    const lastBarClose = closes[lastI]!;
    const live = meta.regularMarketPrice ?? lastBarClose;
    price = live;
    if (priorClose !== 0) {
      changePct = ((live - priorClose) / priorClose) * 100;
    }
  } else if (meta.regularMarketPrice != null && meta.chartPreviousClose != null) {
    const prev = meta.chartPreviousClose as number;
    if (prev !== 0) {
      changePct = ((meta.regularMarketPrice - prev) / prev) * 100;
    }
    price = meta.regularMarketPrice;
  }

  const lastIdx = pair ? pair[1] : closes.length - 1;
  const volBar =
    lastIdx >= 0 && lastIdx < volumes.length ? volumes[lastIdx] : null;
  const vol =
    typeof meta.regularMarketVolume === "number" && meta.regularMarketVolume > 0
      ? meta.regularMarketVolume
      : typeof volBar === "number" && volBar > 0
        ? volBar
        : 0;
  const pxForSize = price ?? (pair ? closes[pair[1]]! : null);
  const size =
    pxForSize != null && vol > 0
      ? Math.max(pxForSize * vol, MIN_BOX)
      : DEFAULT_FALLBACK;

  const label =
    (typeof meta.shortName === "string" && meta.shortName.trim()) ||
    (typeof meta.longName === "string" && meta.longName.trim()) ||
    symbol;

  return {
    shortName: label,
    price,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    size,
  };
}

async function fetchAllSnapshots(symbols: string[]): Promise<Map<string, SymbolSnapshot>> {
  const out = new Map<string, SymbolSnapshot>();
  const batch = 14;
  for (let i = 0; i < symbols.length; i += batch) {
    const chunk = symbols.slice(i, i + batch);
    const rows = await Promise.all(
      chunk.map(async (sym) => {
        const snap = await fetchYahooChartSnapshot(sym);
        return [sym, snap] as const;
      }),
    );
    for (const [sym, snap] of rows) {
      if (snap) out.set(sym, snap);
    }
  }
  return out;
}

export async function fetchMarketMapTree(): Promise<MarketMapRoot> {
  const symbols = uniqSymbols();
  const bySymbol = await fetchAllSnapshots(symbols);

  const sectors: MarketMapSector[] = MAP_STRUCTURE.map(({ sector, industries }) => ({
    name: sector,
    children: industries.map((ind) => ({
      name: ind.name,
      children: ind.tickers.map((sym) => {
        const symbol = sym.trim().toUpperCase();
        const snap = bySymbol.get(symbol);
        return {
          name: symbol,
          symbol,
          shortName: snap?.shortName ?? symbol,
          size: snap?.size ?? DEFAULT_FALLBACK,
          changePct: snap?.changePct ?? 0,
          price: snap?.price ?? null,
        };
      }),
    })),
  }));

  return {
    name: "US large caps",
    children: sectors,
  };
}
