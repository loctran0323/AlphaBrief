import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Home market view",
    body: "ETFs, indices, top movers and screeners. Sign in to save a watchlist and tickers of companies.",
  },
  {
    title: "Explore (no login needed)",
    body: "Macro timeline and news briefing without an account. Sign in for full access.",
  },
  {
    title: "Dashboard",
    body: "Watchlist, upcoming catalysts and news tabs. Your main workspace after login.",
  },
  {
    title: "Market map",
    body: 'Heat map that allows you to click a name for headlines and a short "why it\'s moving" brief.',
  },
  {
    title: "News briefing",
    body: "Headlines with summaries and bullish / bearish / neutral tags plus rationale for faster context.",
  },
  {
    title: "Archive & settings",
    body: "Past timeline and headlines older than three days. Settings for digest email.",
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

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2L22 12L12 22L2 12L12 2z" />
      <path d="M12 2L12 22M2 12L22 12" />
    </svg>
  );
}

function PixelDecoration() {
  // Mosaic of purple squares — top-right hero decoration inspired by Lightdash
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
          style={{
            top: c.top,
            right: c.right,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            opacity: c.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let signedIn = false;
  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={signedIn ? "/home" : "/"} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">Alpha Brief</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            {configured ? (
              signedIn ? (
                <Link
                  href="/home"
                  className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/explore"
                    className="px-3 py-2 text-gray-600 transition hover:text-gray-900"
                  >
                    Explore
                  </Link>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-gray-600 transition hover:text-gray-900"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6C5CE7]">
                Markets · Timeline · News
              </p>
              <h1 className="mt-5 text-6xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
                Your alpha,{" "}
                <span className="inline-flex items-center gap-1 text-[#6C5CE7]">
                  <Sparkle className="h-10 w-10" />
                </span>{" "}
                briefly.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500">
                Signal first, noise last.
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
                      href="/explore"
                      className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:border-gray-400"
                    >
                      Explore without signing in
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
                Recently rebranded from Catalyst to Alpha Brief — same app, new name.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="text-4xl font-bold text-gray-900">
                What&apos;s inside Alpha Brief
              </h2>
              <p className="mt-3 text-lg text-gray-500">
                Everything you need to stay ahead of the market.
              </p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-left"
                >
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        {configured && !signedIn && (
          <section className="px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <DiamondIcon className="mx-auto h-10 w-10 text-[#6C5CE7]" />
              <h2 className="mt-5 text-4xl font-bold text-gray-900">
                Ready to cut through the noise?
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Join Alpha Brief — free to start, no credit card required.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-gray-900 px-7 py-3 font-semibold text-white transition hover:bg-gray-700"
                >
                  Create free account
                </Link>
                <Link
                  href="/explore"
                  className="rounded-lg border border-gray-300 bg-white px-7 py-3 font-semibold text-gray-900 transition hover:border-gray-400"
                >
                  Try without signing in
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-900 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2Z" />
              </svg>
            </div>
            <span className="font-bold text-white">Alpha Brief</span>
          </div>
          <Link
            href="/legal"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            Privacy and terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
