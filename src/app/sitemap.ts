import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://alphabrief.net";
  // Fixed publish date — evaluating `new Date()` per request told crawlers the
  // pages changed on every fetch, which defeats the purpose of lastModified.
  const lastModified = new Date("2026-04-18");

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
