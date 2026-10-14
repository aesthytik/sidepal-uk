import type { MetadataRoute } from "next";

// Search and AI crawlers are welcome on the public pages; the API and per-user pages are not for crawling
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/saved", "/admin"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: "https://horus.to/sitemap.xml", // Index of all sitemap slices
    host: "https://horus.to",
  };
}
