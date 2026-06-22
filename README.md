# AlphaBrief

A Next.js market intelligence dashboard for retail investors. Signal first, noise last.

**Free and open source — every feature, free for everyone.** The market view, research
pages, and map are open to browse with no account. An account is only needed for features
tied to your profile: saved tickers, price alerts, and the email digest.

**Live app:** [alphabrief.net](https://alphabrief.net)

## Features

- **Market view** — Benchmarks, top movers, and your watchlist in one editorial view (public)
- **Research** — Look up any ticker: price, chart, valuation, and the full news feed (public)
- **Market map** — Treemap sector view with Yahoo-backed quotes and AI stock move summaries (public)
- **Watchlist** — Track tickers; drives ticker-tagged headlines and company timeline rows (account)
- **Timeline** — Upcoming macro events, earnings calendar (via Finnhub), and ticker-specific catalysts
- **News briefing** — Multi-source aggregation (Finnhub, Alpha Vantage, RSS); bullish/bearish/neutral sentiment; All / Tickers / category tabs
- **Archive** — Historical timeline events and news briefings
- **Price alerts** — Get emailed when a ticker hits your target (account)
- **Community chat** — Live real-time chat between users via Supabase Realtime
- **Account settings** — Password change, digest preferences
- **Email digests** — Optional daily/weekly digest via Resend (account)
- **Auto-refresh** — Dashboard polls for fresh data while the tab is open

## Tech stack

- [Next.js](https://nextjs.org/) 15 (App Router, Turbopack) · React 19 · TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) — Postgres, Auth, Realtime
- [Resend](https://resend.com/) — Email digests
- [Finnhub](https://finnhub.io/) — Market news, company news, earnings calendar
- [Alpha Vantage](https://www.alphavantage.co/) — News sentiment
- Optional [OpenAI](https://openai.com/) — AI headline summaries and key points

## Local setup

```bash
git clone <your-repo-url>
cd Alpha-Brief
npm install
cp .env.example .env.local
```

Edit **`.env.local`** with your credentials. See `.env.example` for all variables.

### Database

Run SQL migrations in order in your Supabase SQL editor:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_profiles_insert_policy.sql`

Optionally run `supabase/seed.sql` for sample `market_events`.

### Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase operations |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for auth redirects |
| `FINNHUB_API_KEY` | Yes | News, company news, earnings calendar |
| `ALPHA_VANTAGE_API_KEY` | Yes | News sentiment |
| `RESEND_API_KEY` | Optional | Email digests |
| `RESEND_FROM_EMAIL` | Optional | From address |
| `OPENAI_API_KEY` | Optional | AI headline summaries |

Never commit `.env.local` or service role keys.

## Deploying to Vercel

1. Push to GitHub and import in [Vercel](https://vercel.com) as a Next.js project.
2. Add all env vars from `.env.example` in Vercel project settings.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://alphabrief.net`).
4. In Supabase → Authentication → URL configuration, add your domain to Site URL and Redirect URLs.

## Project layout

```
src/app/           # App Router pages (landing, auth, home, dashboard, map, archive, legal)
src/components/    # UI components (news briefing, market map, chat room, timeline, etc.)
src/lib/           # News aggregation, earnings, events, market data, email
supabase/migrations/
```

## Disclaimer

All content is informational only and does not constitute investment advice. See [alphabrief.net/legal](https://alphabrief.net/legal) for full terms.
