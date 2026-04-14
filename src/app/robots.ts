import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/dashboard/", "/home/", "/explore/", "/api/"],
      },
    ],
    sitemap: "https://alphabrief.net/sitemap.xml",
  };
}
