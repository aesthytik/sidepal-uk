import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// Search and AI crawlers are welcome on the public pages; the API and per-user pages are not for crawling
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  // Personal pages must remain crawlable for Google to see their noindex metadata.
  const disallow = ["/api/", "/ingest/", "/data/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
