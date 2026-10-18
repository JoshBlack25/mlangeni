import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only public, indexable pages: the homepage and the legal documents. Sign-in pages and the dashboards are noindex,
// and every homepage section (#gallery, #contact, ...) is part of "/".
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...["/privacy-policy", "/terms", "/popia", "/paia-manual"].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date("2026-10-06"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
