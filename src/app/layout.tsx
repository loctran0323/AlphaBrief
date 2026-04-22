import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

function siteMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "AlphaBrief is a markets workspace for your watchlist, catalyst timeline, sector map, and AI-tagged news — signal first, noise last.";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  applicationName: "AlphaBrief",
  title: "AlphaBrief — watchlist, timeline & market news",
  description: siteDescription,
  icons: {
    icon: "/alpha-brief-icon.svg",
    shortcut: "/alpha-brief-icon.svg",
    apple: "/alpha-brief-icon.svg",
  },
  openGraph: {
    title: "AlphaBrief — watchlist, timeline & market news",
    description: siteDescription,
    type: "website",
    siteName: "AlphaBrief",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaBrief — watchlist, timeline & market news",
    description: siteDescription,
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
          "Markets workspace: watchlist, catalyst timeline, sector map, and AI-tagged news.",
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "AlphaBrief",
        url: base,
        logo: `${base}/alpha-brief-icon.svg`,
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
        {/* Default is light mode; only apply dark if the user has explicitly chosen it */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
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
