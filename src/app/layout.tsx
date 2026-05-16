import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const PRODUCTION_URL = "https://alphabrief.net";

function siteMetadataBase(): URL {
  // NEXT_PUBLIC_SITE_URL is the override (set this in Vercel env vars)
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  // In local dev only
  if (process.env.NODE_ENV === "development") return new URL("http://localhost:3000");
  // Production default — never use VERCEL_URL (it's the deployment URL, not the canonical domain)
  return new URL(PRODUCTION_URL);
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteDescription =
  "AlphaBrief delivers AI-written market summaries, a watchlist, upcoming catalyst calendar, sector map, and AI-tagged financial news. Signal first, noise last.";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  applicationName: "AlphaBrief",
  title: "AlphaBrief · AI Market Summaries & Financial News",
  alternates: {
    canonical: PRODUCTION_URL,
  },
  description: siteDescription,
  keywords: [
    "AlphaBrief",
    "AI market summaries",
    "AI financial news",
    "stock market briefing",
    "market summary AI",
    "stock watchlist",
    "earnings catalyst calendar",
    "AI market analysis",
    "financial news aggregator",
    "market intelligence",
    "daily market briefing",
    "stock market news",
  ],
  icons: {
    icon: "/alpha-brief-icon.svg",
    shortcut: "/alpha-brief-icon.svg",
    apple: "/alpha-brief-icon.svg",
  },
  openGraph: {
    title: "AlphaBrief · AI Market Summaries & Financial News",
    description: siteDescription,
    type: "website",
    siteName: "AlphaBrief",
    url: "/",
    images: [
      {
        url: "/alpha-brief-og.png",
        width: 1200,
        height: 630,
        alt: "AlphaBrief · AI Market Summaries & Financial News",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaBrief · AI Market Summaries & Financial News",
    description: siteDescription,
    images: ["/alpha-brief-og.png"],
  },
};

function structuredDataJsonLd(): string {
  const base = siteMetadataBase().origin;
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "AlphaBrief",
        url: base,
        description:
          "AlphaBrief delivers AI-written market summaries, a watchlist, catalyst calendar, sector map, and AI-tagged financial news.",
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}/explore?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "AlphaBrief",
        url: base,
        logo: {
          "@type": "ImageObject",
          url: `${base}/alpha-brief-icon.svg`,
        },
        sameAs: [],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${base}/#app`,
        name: "AlphaBrief",
        url: base,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description:
          "AI-written daily market summaries, watchlist tracking, upcoming earnings and catalyst calendar, interactive sector map, and AI-tagged financial news briefings.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "Free tier with core market briefing features.",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9",
            priceCurrency: "USD",
            description: "Pro tier with full archive, weekly AI recap, and priority features.",
          },
        ],
      },
    ],
  };
  return JSON.stringify(payload);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        {/* Auto-follow system preference unless the user has explicitly chosen */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&m)){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} min-h-screen antialiased`}
      >
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- JSON-LD for search engines
          dangerouslySetInnerHTML={{ __html: structuredDataJsonLd() }}
        />
        {children}
      </body>
    </html>
  );
}
