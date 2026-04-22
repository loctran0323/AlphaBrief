import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoSlideshow } from "@/components/demo-slideshow";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Home market view",
    body: "ETFs, indices, top movers and screeners. Save a watchlist of the companies you track.",
  },
  {
    title: "AI market summary",
    body: "Daily briefing powered by Groq — structured sections covering market direction, key drivers, top movers, and what to watch. Refreshes every 6 hours.",
  },
  {
    title: "Dashboard",
    body: "Watchlist, upcoming catalysts, and a curated news briefing. Your main workspace after login.",
  },
  {
    title: "Market map",
    body: 'Clickable sector heat map. Click any company for headlines and a "why it\'s moving" brief.',
  },
  {
    title: "News briefing",
    body: "Headlines with AI summaries and bullish / bearish / neutral tags for faster context.",
  },
  {
    title: "Weekly recap",
    body: "AI-written weekly market recap in the archive — covers the week's arc, key themes, a standout market signal, and catalysts to watch ahead.",
  },
  {
    title: "Archive",
    body: "Past timeline and headlines older than three days — never lose track of what moved the market.",
  },
  {
    title: "More coming soon",
    body: "We ship fast. Earnings models, price alerts, and deeper AI analysis are on the roadmap.",
  },
] as const;

export const dynamic = "force-dynamic";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0 13.854 9.374 24 12 13.854 14.626 12 24 10.146 14.626 0 12 10.146 9.374z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function PixelDecoration() {
  const cells: Array<{ top: number; right: number; size: number; color: string; opacity: number }> = [
    { top: 0,   right: 0,   size: 32, color: "#4C1D95", opacity: 0.9 },
    { top: 0,   right: 36,  size: 24, color: "#7C3AED", opacity: 0.85 },
    { top: 0,   right: 64,  size: 40, color: "#6C5CE7", opacity: 0.8 },
    { top: 0,   right: 108, size: 16, color: "#A78BFA", opacity: 0.7 },
    { top: 36,  right: 0,   size: 16, color: "#8B5CF6", opacity: 0.75 },
    { top: 36,  right: 20,  size: 40, color: "#DDD6FE", opacity: 0.6 },
    { top: 36,  right: 64,  size: 24, color: "#6C5CE7", opacity: 0.5 },
    { top: 36,  right: 92,  size: 32, color: "#4C1D95", opacity: 0.85 },
    { top: 72,  right: 0,   size: 48, color: "#7C3AED", opacity: 0.7 },
    { top: 72,  right: 52,  size: 16, color: "#C4B5FD", opacity: 0.5 },
    { top: 72,  right: 72,  size: 32, color: "#5B21B6", opacity: 0.65 },
    { top: 124, right: 0,   size: 20, color: "#A78BFA", opacity: 0.4 },
    { top: 124, right: 24,  size: 36, color: "#6C5CE7", opacity: 0.55 },
    { top: 124, right: 64,  size: 20, color: "#DDD6FE", opacity: 0.35 },
    { top: 148, right: 44,  size: 28, color: "#8B5CF6", opacity: 0.3 },
    { top: 180, right: 0,   size: 16, color: "#C4B5FD", opacity: 0.2 },
    { top: 180, right: 20,  size: 20, color: "#7C3AED", opacity: 0.25 },
  ];
  return (
    <div className="pointer-events-none absolute right-0 top-0 h-64 w-56 overflow-hidden">
      {cells.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{ top: c.top, right: c.right, width: c.size, height: c.size, backgroundColor: c.color, opacity: c.opacity }}
        />
      ))}
    </div>
  );
}

const planRows: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: "Home market view", free: true, pro: true },
  { label: "Dashboard & news briefing", free: true, pro: true },
  { label: "Market map lookups", free: "3 / day", pro: "Unlimited" },
  { label: "Research news per ticker", free: "3 articles", pro: "Full feed" },
  { label: "Price alerts via email", free: false, pro: true },
  { label: "Email digest", free: false, pro: true },
  { label: "Archive (past timeline)", free: false, pro: true },
  { label: "Community chat", free: true, pro: true },
  { label: "Priority new features", free: false, pro: true },
  { label: "Support the mission", free: false, pro: true },
];

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let signedIn = false;
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--nav-border)", background: "var(--nav-bg)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={signedIn ? "/home" : "/"} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">AlphaBrief</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            {configured ? (
              signedIn ? (
                <>
                  <ThemeToggle />
                  <Link
                    href="/home"
                    className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    Open app
                  </Link>
                </>
              ) : (
                <>
                  <Link href="#pricing" className="px-3 py-2 transition" style={{ color: "var(--nav-text)" }}
                    onMouseEnter={undefined} onMouseLeave={undefined}>
                    Pricing
                  </Link>
                  <Link href="/login" className="px-3 py-2 transition" style={{ color: "var(--nav-text)" }}>
                    Log in
                  </Link>
                  <ThemeToggle />
                  <Link
                    href="/signup"
                    className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    Sign up free
                  </Link>
                </>
              )
            ) : (
              <span className="text-xs text-amber-600">
                Add keys in <code className="rounded bg-amber-50 px-1">.env.local</code>
              </span>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20">
          <PixelDecoration />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              {/* Beta badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C5CE7]/30 bg-[#EDE9FE] px-3 py-1 text-xs font-semibold text-[#6C5CE7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6C5CE7]" />
                Beta — actively building
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#6C5CE7]">
                Markets · Timeline · News
              </p>
              <h1 className="mt-3 inline-flex items-center gap-3 text-6xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
                AlphaBrief
                <Sparkle className="h-10 w-10 shrink-0 text-[#6C5CE7] md:h-12 md:w-12" />
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500">
                Signal first, noise last. Your alpha, briefly.
              </p>

              {configured ? (
                signedIn ? (
                  <div className="mt-8 flex gap-3">
                    <Link
                      href="/home"
                      className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
                    >
                      Open dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/signup"
                      className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
                    >
                      Start for free
                    </Link>
                    <Link
                      href="#pricing"
                      className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:border-gray-400"
                    >
                      Compare plans
                    </Link>
                    <p className="w-full text-xs text-gray-400">
                      Already have an account?{" "}
                      <Link href="/login" className="text-[#6C5CE7] hover:underline">
                        Log in
                      </Link>
                    </p>
                  </div>
                )
              ) : (
                <div className="mt-8 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                  Copy{" "}
                  <code className="rounded bg-amber-100 px-1 text-xs">.env.example</code> to{" "}
                  <code className="rounded bg-amber-100 px-1 text-xs">.env.local</code> with your
                  Supabase URL and anon key, then restart the dev server.
                </div>
              )}

              <p className="mt-5 text-xs text-gray-400">
                We are in beta — new features ship every week. Your feedback shapes the roadmap.
              </p>
            </div>
          </div>
        </section>

        {/* ── Demo ── */}
        <section className="border-t border-gray-100 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C5CE7]/30 bg-[#EDE9FE] px-3 py-1 text-xs font-semibold text-[#6C5CE7]">
                Product preview
              </span>
              <h2 className="mt-4 text-4xl font-bold text-gray-900">See it in action</h2>
              <p className="mt-3 text-lg text-gray-500">
                Your dashboard — AI market summary, watchlist, catalysts, and tagged headlines.
              </p>
            </div>

            <DemoSlideshow />

            <p className="mt-5 text-center text-sm text-gray-400">
              Sample data for illustration.{" "}
              <Link href="/signup" className="text-[#6C5CE7] hover:underline">
                Sign up free
              </Link>{" "}
              to see live markets.
            </p>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="text-4xl font-bold text-gray-900">What&apos;s inside AlphaBrief</h2>
              <p className="mt-3 text-lg text-gray-500">
                Everything you need to stay ahead of the market — with more on the way.
              </p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 text-left">
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Pricing ── */}
        {configured && !signedIn && (
          <section id="pricing" className="border-t border-gray-100 px-6 py-24">
            <div className="mx-auto max-w-5xl">
              <div className="mb-14 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6C5CE7]/30 bg-[#EDE9FE] px-3 py-1 text-xs font-semibold text-[#6C5CE7]">
                  Beta pricing
                </span>
                <h2 className="mt-4 text-4xl font-bold text-gray-900">Compare our plans</h2>
                <p className="mt-3 text-lg text-gray-500">
                  Start free. Upgrade when you want more. Beta prices are locked in for early supporters.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                {/* Free plan */}
                <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Free</p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-5xl font-black text-gray-900">$0</span>
                      <span className="mb-1.5 text-sm text-gray-400">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">No credit card. No expiry.</p>
                  </div>

                  <ul className="mt-8 space-y-3 flex-1">
                    {planRows.map((row) => (
                      <li key={row.label} className="flex items-start gap-3 text-sm">
                        {row.free === false ? (
                          <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                        ) : (
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                        <span className={row.free === false ? "text-gray-400" : "text-gray-700"}>
                          {row.label}
                          {typeof row.free === "string" && (
                            <span className="ml-1 font-medium text-gray-900">({row.free})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className="mt-8 block rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-900 transition hover:border-gray-400"
                  >
                    Get started free
                  </Link>
                </div>

                {/* Pro plan */}
                <div className="flex flex-col rounded-2xl border-2 border-[#6C5CE7] bg-white p-8 shadow-lg shadow-[#6C5CE7]/10">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-widest text-[#6C5CE7]">Pro</p>
                      <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-xs font-semibold text-[#6C5CE7]">
                        Beta price
                      </span>
                    </div>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-5xl font-black text-gray-900">$9</span>
                      <span className="mb-1.5 text-sm text-gray-400">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Locked in for early supporters.</p>
                  </div>

                  <ul className="mt-8 space-y-3 flex-1">
                    {planRows.map((row) => (
                      <li key={row.label} className="flex items-start gap-3 text-sm">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6C5CE7]" />
                        <span className="text-gray-700">
                          {row.label}
                          {typeof row.pro === "string" && (
                            <span className="ml-1 font-medium text-gray-900">({row.pro})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup?next=/dashboard/upgrade"
                    className="mt-8 block rounded-lg bg-[#6C5CE7] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#5B4FD4]"
                  >
                    Start with Pro
                  </Link>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-gray-400">
                We are in early beta — prices and features may change. Early supporters will always
                keep their rate. Questions?{" "}
                <Link href="/signup" className="text-[#6C5CE7] hover:underline">
                  Sign up
                </Link>{" "}
                then reach us from the Contact tab.
              </p>
            </div>
          </section>
        )}

        {/* ── Bottom CTA ── */}
        {configured && !signedIn && (
          <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold text-gray-900">Ready to cut through the noise?</h2>
              <p className="mt-4 text-lg text-gray-500">
                Join AlphaBrief — free to start, no credit card required.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-gray-900 px-7 py-3 font-semibold text-white transition hover:bg-gray-700"
                >
                  Create free account
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}
