"use client";

import { useState } from "react";

// ── Shared helpers ────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-[#6C5CE7]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
    </svg>
  );
}

// ── Slide 1: Home ─────────────────────────────────────────────────────────────

function HomeSlide() {
  const etfs = [
    { label: "S&P 500 ETF", symbol: "SPY",   price: "521.84", pct: "+0.82%", up: true },
    { label: "Nasdaq ETF",   symbol: "QQQ",   price: "441.20", pct: "+1.14%", up: true },
    { label: "Dow Jones ETF",symbol: "DIA",   price: "388.67", pct: "+0.31%", up: true },
    { label: "Russell 2000", symbol: "IWM",   price: "197.45", pct: "−0.24%", up: false },
    { label: "Total Market", symbol: "VTI",   price: "237.18", pct: "+0.69%", up: true },
    { label: "S&P 500",      symbol: "^GSPC", price: "5,218",  pct: "+0.80%", up: true },
    { label: "Nasdaq",       symbol: "^IXIC", price: "16,310", pct: "+1.10%", up: true },
    { label: "Emerging Mkts",symbol: "EEM",   price: "42.31",  pct: "−0.18%", up: false },
  ];

  const watchlist = [
    { ticker: "AAPL",  price: "$273.17", pct: "+0.54%", up: true },
    { ticker: "NVDA",  price: "$875.40", pct: "+2.12%", up: true },
    { ticker: "MSFT",  price: "$418.23", pct: "+0.88%", up: true },
    { ticker: "TSLA",  price: "$172.68", pct: "−1.83%", up: false },
    { ticker: "META",  price: "$512.90", pct: "+1.41%", up: true },
  ];

  const gainers = [
    { symbol: "NVDA", name: "NVIDIA Corp",       pct: "+2.12%" },
    { symbol: "ARM",  name: "Arm Holdings",       pct: "+3.45%" },
    { symbol: "SMCI", name: "Super Micro Computer", pct: "+4.01%" },
  ];

  const losers = [
    { symbol: "TSLA", name: "Tesla Inc",          pct: "−1.83%" },
    { symbol: "INTC", name: "Intel Corp",          pct: "−2.14%" },
    { symbol: "BA",   name: "Boeing Co",           pct: "−1.60%" },
  ];

  return (
    <div className="space-y-5">
      {/* ETF grid */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">ETFs &amp; Indices</p>
        <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-gray-200">
          {etfs.map((b, i) => (
            <div
              key={b.symbol}
              className="bg-white p-3"
              style={{
                borderRight: i % 4 !== 3 ? "1px solid #e5e7eb" : undefined,
                borderBottom: i < 4 ? "1px solid #e5e7eb" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="truncate text-[10px] text-gray-400">{b.label}</p>
                <p className={`shrink-0 text-[10px] font-semibold ${b.up ? "text-emerald-600" : "text-red-500"}`}>{b.pct}</p>
              </div>
              <p className="mt-1.5 text-sm font-bold tabular-nums text-gray-900">${b.price}</p>
              <p className="mt-0.5 font-mono text-[9px] text-gray-400">{b.symbol}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Watchlist row */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Your Watchlist</p>
        <div className="flex overflow-x-auto overflow-hidden rounded-xl border border-gray-200">
          {watchlist.map((w) => (
            <div key={w.ticker} className="flex min-w-[110px] shrink-0 flex-col bg-white px-4 py-3" style={{ borderRight: "1px solid #e5e7eb" }}>
              <p className="font-mono text-xs font-semibold text-gray-900">{w.ticker}</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">{w.price}</p>
              <p className={`mt-0.5 text-xs font-semibold ${w.up ? "text-emerald-600" : "text-red-500"}`}>{w.pct}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Movers */}
      <div className="grid grid-cols-2 gap-4">
        {[{ label: "Gainers", rows: gainers, color: "text-emerald-600" }, { label: "Losers", rows: losers, color: "text-red-500" }].map((col) => (
          <div key={col.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{col.label}</p>
            <div className="space-y-2.5">
              {col.rows.map((r) => (
                <div key={r.symbol} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900">{r.symbol}</p>
                    <p className="truncate text-[10px] text-gray-400">{r.name}</p>
                  </div>
                  <p className={`shrink-0 text-xs font-semibold ${col.color}`}>{r.pct}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slide 2: Dashboard ────────────────────────────────────────────────────────

function DashboardSlide() {
  const summaryLines = [
    { type: "header", text: "MARKET SNAPSHOT" },
    { type: "text",   text: "Markets closed mixed Wednesday — S&P 500 flat at 5,218, Nasdaq up 0.4%, Dow down 0.3% as investors digested mixed signals ahead of bank earnings." },
    { type: "header", text: "WHAT'S DRIVING IT" },
    { type: "bullet", text: "Treasury yields eased after softer retail sales data, giving growth stocks room to breathe" },
    { type: "bullet", text: "NVIDIA rallied on supplier confirmation that Blackwell GPUs are shipping ahead of schedule" },
    { type: "bullet", text: "Financials lagged as JPM and BAC gave back gains ahead of Thursday earnings" },
    { type: "header", text: "KEY MOVERS" },
    { type: "bullet", text: "NVDA +2.1% — Blackwell supply confirmation boosted AI infrastructure sentiment" },
    { type: "bullet", text: "TSLA −1.8% — delivery concerns resurfaced after European March sales disappointed" },
    { type: "header", text: "WATCH FOR" },
    { type: "bullet", text: "JPMorgan and Citigroup earnings Thursday pre-market — sets tone for financials" },
    { type: "bullet", text: "Fed speakers Waller and Bostic scheduled; rate-cut signals could move the tape" },
  ];

  const events = [
    { bar: "bg-violet-500", badge: "border-violet-200 bg-violet-50 text-violet-700", type: "Earnings", ticker: "NVDA", date: "Apr 23", title: "NVIDIA Q1 FY2026 Earnings", watch: "Blackwell GPU demand and data center margin commentary." },
    { bar: "bg-sky-500",    badge: "border-sky-200 bg-sky-50 text-sky-700",           type: "Macro",    ticker: null,   date: "Apr 30", title: "Fed FOMC Rate Decision",   watch: "Powell presser language on inflation and labor." },
    { bar: "bg-amber-500",  badge: "border-amber-200 bg-amber-50 text-amber-700",     type: "Key event",ticker: "AAPL", date: "May 7",  title: "Apple WWDC 2025 Keynote", watch: "On-device LLM depth and App Store policy changes." },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6C5CE7]">Dashboard</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Wednesday, Apr 16</h1>
        <div className="mt-2 flex gap-3">
          {[{ val: "12", label: "events" }, { val: "38", label: "headlines" }, { val: "5", label: "tickers" }].map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
              <p className="text-base font-black tabular-nums text-gray-900">{c.val}</p>
              <p className="text-[10px] text-gray-400">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Watchlist */}
      <div className="border-b border-gray-100 pb-4">
        <p className="mb-2 text-xs font-semibold text-gray-900">Watchlist</p>
        <div className="flex flex-wrap gap-1.5">
          {["AAPL", "MSFT", "NVDA", "TSLA", "META"].map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-gray-800">
              {t}<span className="text-gray-300 text-xs">×</span>
            </span>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <StarIcon />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">AI Market Summary</span>
            <span className="rounded-full bg-[#EDE9FE] px-1.5 py-0.5 text-[9px] font-semibold text-[#6C5CE7]">Groq</span>
          </div>
          <span className="text-[10px] text-gray-400">Updated every 6 hours</span>
        </div>
        <div className="space-y-2 bg-white px-4 py-3">
          {summaryLines.map((item, i) => {
            if (item.type === "header") return <p key={i} className="text-[9px] font-bold uppercase tracking-wider text-[#6C5CE7]">{item.text}</p>;
            if (item.type === "bullet") return (
              <div key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-gray-700">
                <span className="mt-0.5 shrink-0 text-[#6C5CE7]">•</span><span>{item.text}</span>
              </div>
            );
            return <p key={i} className="text-[11px] leading-relaxed text-gray-700">{item.text}</p>;
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-gray-900">Upcoming Timeline</p>
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.title} className="flex gap-3">
              <div className={`mt-1 w-1 shrink-0 rounded-full ${e.bar}`} />
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="font-mono">{e.date}</span>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${e.badge}`}>{e.type}</span>
                  {e.ticker && <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-semibold text-gray-700">{e.ticker}</span>}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-gray-900">{e.title}</p>
                <p className="mt-0.5 text-[10px] text-gray-500"><span className="font-medium">Watch: </span>{e.watch}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide 3: Research ─────────────────────────────────────────────────────────

function ResearchSlide() {
  // Simple SVG line chart
  const points = [820, 835, 828, 851, 843, 862, 858, 875];
  const min = Math.min(...points) - 10;
  const max = Math.max(...points) + 10;
  const range = max - min;
  const w = 400, h = 80;
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * w} ${h - ((p - min) / range) * h}`)
    .join(" ");

  const news = [
    { bar: "bg-emerald-500", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", impact: "bullish", source: "Bloomberg", title: "Blackwell shipments ahead of schedule, suppliers confirm", summary: "GB200 NVL72 racks shipping 3–4 weeks early, boosting near-term revenue confidence." },
    { bar: "bg-emerald-500", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", impact: "bullish", source: "Reuters",   title: "AWS AI services hit $15B annualized revenue run rate", summary: "Andy Jassy confirms accelerating enterprise AI adoption is driving record cloud growth." },
    { bar: "bg-amber-400",   badge: "border-amber-200 bg-amber-50 text-amber-700",       impact: "neutral", source: "WSJ",       title: "NVIDIA faces new export restrictions on H20 chips to China", summary: "Commerce Dept expands controls; analysts estimate limited near-term revenue impact." },
  ];

  return (
    <div className="space-y-5">
      {/* Stock header */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6C5CE7]">Research</p>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">NVIDIA Corp</h1>
          <p className="text-xs text-gray-400">NVDA · NASDAQ</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums text-gray-900">$875.40</p>
          <p className="text-sm font-semibold text-emerald-600">+$18.23 · +2.12% today</p>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-900">Price (7-day)</p>
          <div className="flex gap-1">
            {["1W", "1M", "3M", "1Y"].map((r, i) => (
              <span key={r} className={`rounded px-2 py-0.5 text-[10px] font-semibold ${i === 0 ? "bg-[#6C5CE7] text-white" : "bg-gray-100 text-gray-500"}`}>{r}</span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 72 }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#chartGrad)" />
          <path d={pathD} fill="none" stroke="#6C5CE7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Market Cap", val: "$2.15T" },
          { label: "P/E Ratio",  val: "68.4×" },
          { label: "52W High",   val: "$974.00" },
          { label: "Avg Volume", val: "42.1M" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center">
            <p className="text-xs font-bold text-gray-900">{s.val}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* News */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-gray-900">Latest news for NVDA</p>
        <div className="space-y-3">
          {news.map((a) => (
            <div key={a.title} className="flex gap-3">
              <div className={`mt-1 w-1 shrink-0 rounded-full ${a.bar}`} />
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
                  <span>{a.source}</span>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${a.badge}`}>{a.impact}</span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-gray-900">{a.title}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">{a.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slide 4: Archive ─────────────────────────────────────────────────────────

function ArchiveSlide() {
  const weeklyLines = [
    { type: "header", text: "WEEKLY OVERVIEW" },
    { type: "text",   text: "A volatile but ultimately strong week — S&P 500 gained 3.6%, Nasdaq surged 4.7%, and Dow added 3.0%, marking one of the best weeks since November. Early sessions were cautious on Middle East tensions, but a surprise ceasefire Wednesday triggered a broad relief rally that carried through Friday." },
    { type: "header", text: "KEY THEMES & DRIVERS" },
    { type: "bullet", text: "Geopolitical relief drove the first leg — ceasefire headlines pulled energy lower while equities surged on reduced risk premium" },
    { type: "bullet", text: "Tech led the second leg as AWS AI revenue hit $15B annualized, reinforcing AI infrastructure as the dominant growth theme" },
    { type: "bullet", text: "Friday CPI showed a jump in gas prices, raising inflation concerns and tempering the rally into the close" },
    { type: "header", text: "MARKET SIGNAL" },
    { type: "text",   text: "Despite oil spiking back above $100 over the weekend, stocks opened Monday solidly higher — a clear signal the market is becoming less reactive to geopolitical headlines and is refocusing on earnings and fundamentals." },
    { type: "header", text: "WEEK AHEAD" },
    { type: "bullet", text: "JPMorgan and Citigroup earnings Tuesday — first major read on financials and consumer health" },
    { type: "bullet", text: "TSMC Q1 earnings Thursday alongside initial jobless claims and Philly Fed survey" },
  ];

  const pastEvents = [
    { bar: "bg-violet-500", badge: "border-violet-200 bg-violet-50 text-violet-700", type: "Earnings", ticker: "JPM",  date: "Apr 11", title: "JPMorgan Q1 2025 Earnings", note: "Beat on EPS, NII guidance raised. Stock +2.3%." },
    { bar: "bg-sky-500",    badge: "border-sky-200 bg-sky-50 text-sky-700",           type: "Macro",    ticker: null,   date: "Apr 10", title: "March CPI Release",          note: "Core CPI +3.8% YoY, gas prices surged. Yields jumped 12bps." },
    { bar: "bg-amber-500",  badge: "border-amber-200 bg-amber-50 text-amber-700",     type: "Key event",ticker: "NVDA", date: "Apr 9",  title: "Ceasefire Announced",        note: "Middle East ceasefire triggered broad relief rally, Nasdaq +2.4%." },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6C5CE7]">Archive</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Past data</h1>
        <div className="mt-1 flex gap-2 text-xs text-gray-400">
          <span><span className="font-semibold text-gray-700">24</span> past events</span>
          <span>·</span>
          <span><span className="font-semibold text-gray-700">142</span> archived headlines</span>
        </div>
      </div>

      {/* Weekly recap */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <StarIcon />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Weekly Market Recap</span>
            <span className="rounded-full bg-[#EDE9FE] px-1.5 py-0.5 text-[9px] font-semibold text-[#6C5CE7]">Groq</span>
          </div>
          <span className="text-[10px] text-gray-400">Updated every 24 hours</span>
        </div>
        <div className="space-y-2 bg-white px-4 py-3">
          {weeklyLines.map((item, i) => {
            if (item.type === "header") return <p key={i} className="text-[9px] font-bold uppercase tracking-wider text-[#6C5CE7]">{item.text}</p>;
            if (item.type === "bullet") return (
              <div key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-gray-700">
                <span className="mt-0.5 shrink-0 text-[#6C5CE7]">•</span><span>{item.text}</span>
              </div>
            );
            return <p key={i} className="text-[11px] leading-relaxed text-gray-700">{item.text}</p>;
          })}
        </div>
      </div>

      {/* Past timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-gray-900">Past Timeline</p>
        <div className="space-y-3">
          {pastEvents.map((e) => (
            <div key={e.title} className="flex gap-3">
              <div className={`mt-1 w-1 shrink-0 rounded-full ${e.bar}`} />
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="font-mono">{e.date}</span>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${e.badge}`}>{e.type}</span>
                  {e.ticker && <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-semibold text-gray-700">{e.ticker}</span>}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-gray-900">{e.title}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{e.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Slideshow shell ───────────────────────────────────────────────────────────

const SLIDES = [
  { id: "home",      label: "Home",      component: HomeSlide },
  { id: "dashboard", label: "Dashboard", component: DashboardSlide },
  { id: "research",  label: "Research",  component: ResearchSlide },
  { id: "archive",   label: "Archive",   component: ArchiveSlide },
];

export function DemoSlideshow() {
  const [active, setActive] = useState(0);
  const Slide = SLIDES[active].component;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="mx-3 flex max-w-xs flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          alphabrief.net/{SLIDES[active].id === "home" ? "home" : SLIDES[active].id === "dashboard" ? "dashboard" : "dashboard/research/NVDA"}
        </div>
        {/* Slide tabs */}
        <div className="ml-auto flex gap-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                active === i
                  ? "bg-[#6C5CE7] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div className="max-h-[540px] overflow-y-auto bg-white px-6 py-6 [scrollbar-width:thin]">
        <Slide />
      </div>

      {/* Bottom nav dots */}
      <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 py-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all ${active === i ? "w-6 bg-[#6C5CE7]" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
            aria-label={s.label}
          />
        ))}
      </div>
    </div>
  );
}
