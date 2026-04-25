import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SplashEditionTagline } from "@/components/splash-edition-tagline";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AlphaBrief — AI Market Summaries, Watchlist & Catalyst Calendar",
  description:
    "AlphaBrief is the AI market briefing tool built for investors. Get daily AI-written market summaries, track your watchlist, follow upcoming earnings catalysts, explore the sector map, and read AI-tagged financial news — all in one place.",
  alternates: {
    canonical: "https://alphabrief.net",
  },
};

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

const features = [
  { num: "I.",    title: "Home market view",  body: "ETFs, indices, top movers and screeners. Save a watchlist of the companies you track." },
  { num: "II.",   title: "AI market summary", body: "Structured sections covering market direction, key drivers, top movers, what to watch. Refreshes every 6 hours." },
  { num: "III.",  title: "Dashboard",         body: "Watchlist, upcoming catalysts, and a curated news briefing. Your main workspace after login." },
  { num: "IV.",   title: "Market map",        body: "Clickable sector heat map. Click any company for headlines and a 'why it's moving' brief." },
  { num: "V.",    title: "News briefing",     body: "Headlines with AI summaries and bullish / bearish / neutral tags for faster context." },
  { num: "VI.",   title: "Weekly recap",      body: "AI-written weekly market recap covering the week's arc, themes, a standout signal, and catalysts ahead." },
  { num: "VII.",  title: "Archive",           body: "Past timeline and headlines older than three days — never lose track of what moved the market." },
  { num: "VIII.", title: "More coming soon",  body: "Earnings models, price alerts, and deeper AI analysis are on the roadmap." },
] as const;

const planRows: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: "Home market view",          free: true,         pro: true },
  { label: "Dashboard & news briefing", free: true,         pro: true },
  { label: "Market map lookups",        free: "3 / day",    pro: "Unlimited" },
  { label: "Research news per ticker",  free: "3 articles", pro: "Full feed" },
  { label: "Price alerts via email",    free: false,        pro: true },
  { label: "Email digest",              free: false,        pro: true },
  { label: "Archive (past timeline)",   free: false,        pro: true },
  { label: "Community chat",            free: true,         pro: true },
];

export const dynamic = "force-dynamic";

function ABLogo({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size + 2, height: size + 2, borderRadius: 6,
      background: ACCENT,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
      </svg>
    </div>
  );
}

function SplashRuleLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontFamily: SANS_L, fontSize: 10, letterSpacing: ".22em",
      textTransform: "uppercase" as const, color: "var(--ab-faint)", fontWeight: 700,
      margin: "24px 0 12px",
    }}>
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--ab-border)" }} />
    </div>
  );
}

export default async function SplashPage() {
  const configured = isSupabaseConfigured();
  let signedIn = false;
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <div style={{ background: "var(--ab-bg)", color: "var(--ab-fg)", fontFamily: SANS_L, minHeight: "100vh" }}>

      {/* ── Marketing nav ── */}
      <div className="ab-splash-nav-pad" style={{
        padding: "18px 48px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid var(--ab-border)",
        background: "var(--ab-bg)", position: "sticky", top: 0, zIndex: 20,
      }}>
        <div className="flex items-center gap-4">
          <Link href={signedIn ? "/home" : "/"} className="flex items-center gap-2">
            <ABLogo size={22} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ab-fg)" }}>AlphaBrief</span>
          </Link>
          <span className="ab-nav-tagline" style={{ color: "var(--ab-faint)" }}>·</span>
          <span className="ab-nav-tagline"><SplashEditionTagline /></span>
        </div>
        <div className="flex items-center gap-4" style={{ fontSize: 13, color: "var(--ab-muted)" }}>
          {/* Text links — hidden on mobile */}
          {configured && !signedIn && (
            <nav className="ab-splash-links flex items-center gap-5">
              <Link href="#pricing" style={{ color: "var(--ab-muted)", fontWeight: 500 }}>Pricing</Link>
              <Link href="/login" style={{ color: "var(--ab-muted)", fontWeight: 500 }}>Log in</Link>
            </nav>
          )}
          {/* Always-visible controls */}
          <ThemeToggle />
          {configured && signedIn && (
            <Link href="/home" style={{
              padding: "7px 14px", background: "var(--ab-fg)", color: "var(--ab-bg)",
              fontFamily: SANS_L, fontSize: 12, fontWeight: 600,
              letterSpacing: ".08em", textTransform: "uppercase",
            }}>Open app</Link>
          )}
          {configured && !signedIn && (
            <>
              {/* Log in — mobile only (desktop has it in ab-splash-links) */}
              <Link href="/login" className="sm:hidden" style={{
                fontFamily: SANS_L, fontSize: 12, fontWeight: 500,
                color: "var(--ab-muted)", textDecoration: "none",
              }}>Log in</Link>
              <Link href="/signup" style={{
                padding: "6px 10px", background: "var(--ab-fg)", color: "var(--ab-bg)",
                fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
                letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}>Sign up</Link>
            </>
          )}
        </div>
      </div>

      {/* ── Hero — editorial ── */}
      <div className="ab-hero-pad" style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 40px 40px" }}>
        <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 28, marginBottom: 28 }}>
          <div style={{
            fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase",
            color: ACCENT, fontWeight: 700, marginBottom: 14,
          }}>Beta · Actively building</div>
          <h1 className="ab-hero-h1" style={{
            fontFamily: SERIF_L, fontSize: 104, lineHeight: 0.95,
            letterSpacing: "-.04em", fontWeight: 600, margin: 0,
          }}>
            Signal first,<br />
            <span style={{ color: "var(--ab-muted)", fontStyle: "italic" }}>noise last.</span>
          </h1>
          <p style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 22,
            color: "var(--ab-muted)", marginTop: 18, maxWidth: 680, marginBottom: 0,
          }}>
            An AI-written daily briefing, a clickable market map, and a feed that flags bullish or bearish in one glance. Your alpha, briefly.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ marginTop: 26 }}>
            {configured ? (
              signedIn ? (
                <Link href="/home" style={{
                  padding: "12px 22px", background: "var(--ab-fg)", color: "var(--ab-bg)",
                  fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                }}>Open dashboard →</Link>
              ) : (
                <>
                  <Link href="/signup" style={{
                    padding: "12px 22px", background: "var(--ab-fg)", color: "var(--ab-bg)",
                    fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>Start for free →</Link>
                  <Link href="#pricing" style={{
                    padding: "12px 22px", border: "1px solid var(--ab-fg)", color: "var(--ab-fg)",
                    fontSize: 13, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                    background: "transparent", whiteSpace: "nowrap",
                  }}>Compare plans</Link>
                </>
              )
            ) : null}
          </div>
          <div style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13,
            color: "var(--ab-faint)", marginTop: 14,
          }}>
            No credit card · 1-minute setup · cancel anytime
          </div>
        </div>

        {/* Live tape */}
        <div className="flex items-center gap-5" style={{
          fontFamily: SANS_L, fontSize: 12, color: "var(--ab-muted)",
          padding: "12px 0", borderBottom: "1px solid var(--ab-border)",
          overflow: "hidden",
        }}>
          {/* Mobile: 3 tickers only, no cutoff */}
          {[["S&P 500","+0.09%",true],["QQQ","+0.07%",true],["NVDA","−0.06%",false]].map(([s,p,up], i) => (
            <span key={i} className="sm:hidden" style={{ whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              <span>{s as string}</span>{" "}
              <span style={{ color: (up as boolean) ? "var(--ab-up)" : "var(--ab-down)", fontWeight: 600 }}>{p as string}</span>
            </span>
          ))}
          {/* Desktop: all tickers */}
          {[["S&P 500","+0.09%",true],["QQQ","+0.07%",true],["NVDA","−0.06%",false],["AAPL","+0.18%",true],["TSLA","−2.59%",false],["MSFT","−2.44%",false],["META","−0.87%",false],["URI","+20.82%",true]].map(([s,p,up], i) => (
            <span key={i} className="hidden sm:inline" style={{ whiteSpace: "nowrap" as const }}>
              <span>{s as string}</span>{" "}
              <span style={{ color: (up as boolean) ? "var(--ab-up)" : "var(--ab-down)", fontWeight: 600 }}>{p as string}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Product preview ── */}
      <div className="ab-preview-pad" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 40px 80px" }}>
        <SplashRuleLabel>Product preview</SplashRuleLabel>
        <h2 style={{
          fontFamily: SERIF_L, fontSize: 44, fontWeight: 600,
          letterSpacing: "-.02em", marginBottom: 10, marginTop: 0,
        }}>See it in action</h2>
        <p style={{
          fontFamily: SERIF_L, fontStyle: "italic", color: "var(--ab-muted)",
          fontSize: 17, marginTop: 0, marginBottom: 24,
        }}>
          Your briefing — AI-written market summary, upcoming catalyst calendar, and a tagged news feed.
        </p>

        {/* Browser-chrome preview card */}
        <div style={{ border: "1px solid var(--ab-border)", padding: "10px 10px 24px", background: "var(--ab-card)" }}>
          {/* Browser chrome bar */}
          <div style={{
            padding: "6px 10px", borderBottom: "1px solid var(--ab-border)",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: "var(--ab-muted)",
          }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#FF5F57", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#FEBC2E", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#28C840", display: "inline-block" }} />
            <span style={{ marginLeft: "auto", fontFamily: "ui-monospace, Menlo, monospace" }}>alphabrief.ai/dashboard</span>
          </div>
          {/* Dashboard content */}
          <div className="ab-preview-card" style={{ padding: 24 }}>

            {/* ① + ② side by side */}
            <div className="grid grid-cols-2" style={{ gap: 16, marginBottom: 20 }}>

              {/* ① AI market summary — drop-cap lede */}
              <div>
                <div style={{
                  fontSize: 10, letterSpacing: ".22em", color: ACCENT,
                  fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 12,
                  fontFamily: SANS_L,
                }}>AI summary</div>
                <div className="ab-preview-body" style={{ fontFamily: SERIF_L, fontSize: 15, lineHeight: 1.6, color: "var(--ab-fg)" }}>
                  <p style={{ marginBottom: 10, overflow: "hidden" }}>
                    <span className="ab-preview-drop" style={{
                      float: "left", fontFamily: SERIF_L,
                      fontSize: 46, lineHeight: 0.9, paddingTop: 4, paddingRight: 8,
                      color: ACCENT, fontWeight: 700,
                    }}>E</span>
                    quities closed mixed as tech pulled back, with the Nasdaq shedding 0.4% while energy led the advance.
                  </p>
                  <p className="hidden sm:block" style={{ color: "var(--ab-muted)", margin: 0, fontSize: 14 }}>
                    Options flow suggests institutional accumulation. The Fed&apos;s next meeting looms as the primary catalyst.
                  </p>
                </div>
              </div>

              {/* ② Upcoming catalysts */}
              <div>
                <div style={{
                  fontSize: 10, letterSpacing: ".22em", color: ACCENT,
                  fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 10,
                  fontFamily: SANS_L,
                }}>Catalysts</div>
                <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid var(--ab-border)" }}>
                  {/* Date column */}
                  <div className="ab-preview-cal-col" style={{ width: 80, flexShrink: 0, borderRight: "1px solid var(--ab-border)", paddingRight: 12 }}>
                    <div className="ab-preview-cal-num" style={{ fontFamily: SERIF_L, fontSize: 22, fontWeight: 600, lineHeight: 1, color: "var(--ab-fg)" }}>28</div>
                    <div style={{ fontFamily: SANS_L, fontSize: 9, color: "var(--ab-faint)", marginTop: 2 }}>Apr · 8:30 AM</div>
                  </div>
                  {/* Event body */}
                  <div style={{ flex: 1, paddingLeft: 10 }}>
                    <div className="ab-preview-title" style={{ fontFamily: SERIF_L, fontSize: 14, fontWeight: 600, color: "var(--ab-fg)", marginBottom: 3 }}>
                      Q1 GDP Estimate
                    </div>
                    <div className="ab-preview-body hidden sm:block" style={{ fontFamily: SERIF_L, fontSize: 13, color: "var(--ab-muted)", lineHeight: 1.4 }}>
                      Street consensus 1.8% growth.
                    </div>
                    <span style={{
                      fontSize: 9, letterSpacing: ".12em", fontWeight: 700,
                      textTransform: "uppercase" as const,
                      color: ACCENT, border: `1px solid ${ACCENT}`, padding: "2px 5px",
                      fontFamily: SANS_L, marginTop: 4, display: "inline-block",
                    }}>ECON</span>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ borderTop: "1px solid var(--ab-border)", margin: "0 0 20px" }} />

            {/* ③ From the wire — 2-col news grid */}
            <div>
              <div style={{
                fontSize: 10, letterSpacing: ".22em", color: ACCENT,
                fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 10,
                fontFamily: SANS_L,
              }}>From the wire</div>
              <div className="grid ab-grid-preview-news" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { tag: "BULLISH", src: "WSJ",  title: "URI surges 20.8% after raising full-year guidance above consensus" },
                  { tag: "BEARISH", src: "CNBC", title: "NOW −16.9% as cloud growth misses estimates by widest margin since 2022" },
                ].map((n, i) => (
                  <div key={i} style={{ paddingBottom: 12, borderBottom: "1px solid var(--ab-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 9, letterSpacing: ".12em", fontWeight: 700,
                        textTransform: "uppercase" as const,
                        color: n.tag === "BULLISH" ? "var(--ab-up)" : "var(--ab-down)",
                        fontFamily: SANS_L,
                      }}>{n.tag}</span>
                      <span style={{ fontSize: 10, color: "var(--ab-faint)", fontFamily: SANS_L }}>{n.src}</span>
                    </div>
                    <div style={{ fontFamily: SERIF_L, fontSize: 14, fontWeight: 600, color: "var(--ab-fg)", lineHeight: 1.3 }}>
                      {n.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        <p style={{
          marginTop: 14, textAlign: "center" as const,
          fontFamily: SERIF_L, fontStyle: "italic",
          color: "var(--ab-faint)", fontSize: 12,
        }}>
          Sample data for illustration.{" "}
          <Link href="/signup" style={{ color: ACCENT }}>Sign up free</Link>
          {" "}to see live markets.
        </p>
      </div>

      {/* ── Features ── */}
      <div className="ab-section-pad" style={{
        background: "var(--ab-surface)",
        borderTop: "1px solid var(--ab-border)",
        borderBottom: "1px solid var(--ab-border)",
        padding: "60px 40px",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{
            fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase",
            color: ACCENT, fontWeight: 700, marginBottom: 10,
          }}>Inside the paper</div>
          <h2 style={{
            fontFamily: SERIF_L, fontSize: 42, fontWeight: 600,
            letterSpacing: "-.02em", margin: 0,
          }}>What&apos;s inside AlphaBrief</h2>
          <p style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 17,
            color: "var(--ab-muted)", marginTop: 8, maxWidth: 640, marginBottom: 0,
          }}>
            AI market summaries, earnings catalyst tracking, sector maps, and AI-tagged financial news — everything you need to stay ahead of the market.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: "24px 20px", marginTop: 32 }}>
            {features.map(({ num, title, body }) => (
              <div key={title} style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 14 }}>
                <div style={{
                  fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13,
                  color: ACCENT, fontWeight: 600, marginBottom: 4,
                }}>{num}</div>
                <div className="text-sm sm:text-xl" style={{
                  fontFamily: SERIF_L, fontWeight: 600,
                  marginBottom: 4, color: "var(--ab-fg)",
                }}>{title}</div>
                <p className="hidden sm:block" style={{
                  fontFamily: SERIF_L, fontSize: 14,
                  color: "var(--ab-muted)", lineHeight: 1.55, margin: 0,
                }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      {configured && !signedIn && (
        <div id="pricing" className="ab-section-pad" style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 40px" }}>
          <div style={{
            fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase",
            color: ACCENT, fontWeight: 700, marginBottom: 10, textAlign: "center",
          }}>Beta pricing</div>
          <h2 className="text-2xl sm:text-5xl" style={{
            fontFamily: SERIF_L, fontWeight: 600,
            letterSpacing: "-.02em", textAlign: "center", margin: 0,
          }}>Compare our plans</h2>
          <p className="hidden sm:block" style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 17,
            color: "var(--ab-muted)", marginTop: 8, textAlign: "center",
          }}>
            Start free. Upgrade when you want more. Beta prices are locked in for early supporters.
          </p>
          {/* ── Mobile: comparison table ── */}
          <div className="sm:hidden" style={{ marginTop: 20 }}>
            {/* Plan headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `2px solid var(--ab-fg)` }}>
              <div />
              <div style={{ textAlign: "center", padding: "10px 4px", borderRight: "1px solid var(--ab-border)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--ab-faint)", letterSpacing: ".16em", textTransform: "uppercase" }}>FREE</div>
                <div style={{ fontFamily: SERIF_L, fontSize: 34, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>$0</div>
                <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 11, color: "var(--ab-muted)" }}>/mo</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 4px", background: "var(--ab-surface-hi)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: ".16em", textTransform: "uppercase" }}>PRO</div>
                <div style={{ fontFamily: SERIF_L, fontSize: 34, fontWeight: 600, lineHeight: 1, marginTop: 4, color: "var(--ab-fg)" }}>$9</div>
                <div style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 11, color: "var(--ab-muted)" }}>/mo</div>
              </div>
            </div>
            {/* Feature rows */}
            {planRows.map((row, i) => (
              <div key={row.label} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom: "1px solid var(--ab-border)",
              }}>
                <div style={{ fontFamily: SERIF_L, fontSize: 11, padding: "7px 6px 7px 0", color: "var(--ab-muted)", lineHeight: 1.3 }}>{row.label}</div>
                <div style={{ textAlign: "center", padding: "7px 4px", borderRight: "1px solid var(--ab-border)", fontSize: 12, fontWeight: 700,
                  color: row.free === false ? "var(--ab-faint)" : ACCENT }}>
                  {row.free === false ? "—" : typeof row.free === "string" ? <span style={{ fontSize: 10 }}>{row.free}</span> : "✓"}
                </div>
                <div style={{ textAlign: "center", padding: "7px 4px", fontSize: 12, fontWeight: 700,
                  color: ACCENT, background: "rgba(108,92,231,.04)" }}>
                  {typeof row.pro === "string" ? <span style={{ fontSize: 10 }}>{row.pro}</span> : "✓"}
                </div>
              </div>
            ))}
            {/* CTAs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
              <Link href="/signup" style={{
                display: "block", padding: "11px 6px", textAlign: "center",
                border: "1px solid var(--ab-fg)", color: "var(--ab-fg)",
                background: "transparent", fontSize: 11, fontWeight: 600,
                letterSpacing: ".06em", textTransform: "uppercase",
              }}>Get started</Link>
              <Link href="/signup?next=/dashboard/upgrade" style={{
                display: "block", padding: "11px 6px", textAlign: "center",
                background: ACCENT, color: "#fff",
                fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
              }}>Start with Pro</Link>
            </div>
          </div>

          {/* ── Desktop: side-by-side cards ── */}
          <div className="hidden sm:grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
            {/* Free */}
            <div style={{ border: "1px solid var(--ab-border)", padding: "28px 30px", background: "var(--ab-card)", position: "relative" }}>
              <div style={{ fontSize: 11, letterSpacing: ".22em", fontWeight: 700, color: "var(--ab-faint)", textTransform: "uppercase" }}>FREE</div>
              <div className="flex items-baseline gap-2" style={{ marginTop: 10 }}>
                <span style={{ fontFamily: SERIF_L, fontSize: 64, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1, color: "var(--ab-fg)" }}>$0</span>
                <span style={{ fontFamily: SERIF_L, fontStyle: "italic", color: "var(--ab-muted)", fontSize: 15 }}>/ month</span>
              </div>
              <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)", marginTop: 4 }}>No credit card. No expiry.</p>
              <ul style={{ marginTop: 18, listStyle: "none", padding: 0 }}>
                {planRows.map((row, i) => (
                  <li key={row.label} className="flex items-center gap-2" style={{
                    padding: "6px 0", fontFamily: SERIF_L, fontSize: 14,
                    color: row.free === false ? "var(--ab-faint)" : "var(--ab-fg)",
                    borderBottom: i < planRows.length - 1 ? "1px solid var(--ab-border)" : "none",
                  }}>
                    <span style={{ color: row.free === false ? "var(--ab-faint)" : ACCENT, fontWeight: 700, width: 14, flexShrink: 0 }}>
                      {row.free === false ? "—" : "✓"}
                    </span>
                    <span>{row.label}{typeof row.free === "string" && <span style={{ color: "var(--ab-muted)", marginLeft: 4 }}>({row.free})</span>}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: "block", marginTop: 22, padding: "12px", textAlign: "center",
                border: "1px solid var(--ab-fg)", color: "var(--ab-fg)",
                background: "transparent", fontSize: 12, fontWeight: 600,
                letterSpacing: ".1em", textTransform: "uppercase",
              }}>Get started free</Link>
            </div>
            {/* Pro */}
            <div style={{ border: `2px solid ${ACCENT}`, padding: "28px 30px", background: "var(--ab-surface-hi)", position: "relative" }}>
              <span style={{
                position: "absolute", top: 18, right: 18,
                fontSize: 10, background: ACCENT, color: "#fff",
                padding: "2px 8px", letterSpacing: ".12em", fontWeight: 700,
              }}>Beta price</span>
              <div style={{ fontSize: 11, letterSpacing: ".22em", fontWeight: 700, color: ACCENT, textTransform: "uppercase" }}>PRO</div>
              <div className="flex items-baseline gap-2" style={{ marginTop: 10 }}>
                <span style={{ fontFamily: SERIF_L, fontSize: 64, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1, color: "var(--ab-fg)" }}>$9</span>
                <span style={{ fontFamily: SERIF_L, fontStyle: "italic", color: "var(--ab-muted)", fontSize: 15 }}>/ month</span>
              </div>
              <p style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)", marginTop: 4 }}>Locked in for early supporters.</p>
              <ul style={{ marginTop: 18, listStyle: "none", padding: 0 }}>
                {planRows.map((row, i) => (
                  <li key={row.label} className="flex items-center gap-2" style={{
                    padding: "6px 0", fontFamily: SERIF_L, fontSize: 14,
                    color: "var(--ab-fg)",
                    borderBottom: i < planRows.length - 1 ? "1px solid var(--ab-border)" : "none",
                  }}>
                    <span style={{ color: ACCENT, fontWeight: 700, width: 14, flexShrink: 0 }}>✓</span>
                    <span>{row.label}{typeof row.pro === "string" && <span style={{ color: "var(--ab-muted)", marginLeft: 4 }}>({row.pro})</span>}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup?next=/dashboard/upgrade" style={{
                display: "block", marginTop: 22, padding: "12px", textAlign: "center",
                background: ACCENT, color: "#fff",
                fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
              }}>Start with Pro</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom CTA ── */}
      {configured && !signedIn && (
        <div style={{
          background: "var(--ab-surface)",
          borderTop: "1px solid var(--ab-border)",
          padding: "72px 40px", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: SERIF_L, fontSize: 46, fontWeight: 600,
            letterSpacing: "-.02em", color: "var(--ab-fg)", margin: 0,
          }}>Ready to cut through the noise?</h2>
          <p style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 17,
            color: "var(--ab-muted)", marginTop: 10,
          }}>
            Join AlphaBrief — free to start, no credit card required.
          </p>
          <Link href="/signup" style={{
            display: "inline-block", marginTop: 22, padding: "14px 26px",
            background: "var(--ab-fg)", color: "var(--ab-bg)",
            fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
          }}>Create free account</Link>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: "22px 48px", background: "var(--ab-bg)",
        borderTop: "1px solid var(--ab-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div className="flex items-center gap-3">
          <ABLogo size={18} />
          <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-muted)" }}>
            AlphaBrief · est. 2026
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ab-muted)", display: "flex", gap: 16 }}>
          <Link href="#pricing" style={{ color: "var(--ab-muted)" }}>Pricing</Link>
          <Link href="/privacy" style={{ color: "var(--ab-muted)" }}>Privacy &amp; terms</Link>
        </div>
      </div>
    </div>
  );
}
