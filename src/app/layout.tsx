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

const siteDescription = "Signal first, noise last.";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
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
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaBrief — watchlist, timeline & market news",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
