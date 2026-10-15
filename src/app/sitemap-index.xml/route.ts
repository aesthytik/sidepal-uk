import { SITE } from "@/lib/seo";
import { generateSitemaps } from "../sitemap";

export const revalidate = 3600;

/** Sitemap index, served at /sitemap.xml (see next.config.ts), pointing at each sitemap slice. */
export async function GET() {
  const slices = await generateSitemaps();
  const entries = slices
    .map(({ id }) => `  <sitemap>\n    <loc>${SITE}/sitemap/${id}.xml</loc>\n  </sitemap>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
