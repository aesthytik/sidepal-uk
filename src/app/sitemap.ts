import type { MetadataRoute } from "next";
import { directoryInfo, listPlaces, sponsorIdsInRange } from "@/lib/directory";
import { jobsInfo } from "@/lib/jobs";
import { MIN_PLACE_SPONSORS, ROLE_IDS, SITE, occupationPath, placePath, rolePath, routePath, sponsorPath } from "@/lib/seo";
import { OCCUPATIONS, SNAPSHOT_DATE } from "@/lib/soc";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";

// Sitemaps may hold 50,000 URLs each; sponsors are split into slices of the register
const SPONSORS_PER_SITEMAP = 40_000;
export const revalidate = 86400;

/** Sitemap 0 holds the site's own pages; 1..n hold sponsor pages. */
export async function generateSitemaps() {
  const count = (await directoryInfo().catch(() => null))?.count ?? 130_000;
  const slices = Math.max(1, Math.ceil(count / SPONSORS_PER_SITEMAP));
  return [{ id: 0 }, ...Array.from({ length: slices }, (_, i) => ({ id: i + 1 }))];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (Number(id) > 0) {
    const from = (Number(id) - 1) * SPONSORS_PER_SITEMAP;
    const ids = await sponsorIdsInRange(from, from + SPONSORS_PER_SITEMAP).catch(() => []);
    return ids.map((sid) => ({ url: `${SITE}${sponsorPath(sid)}`, changeFrequency: "weekly", priority: 0.5 }));
  }

  const [jobs, places] = await Promise.all([
    jobsInfo().catch(() => ({ generatedAt: null })),
    listPlaces(MIN_PLACE_SPONSORS).catch(() => []),
  ]);
  const jobsUpdated = jobs.generatedAt ? new Date(jobs.generatedAt) : undefined;
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1, lastModified: jobsUpdated },
    { url: `${SITE}/jobs`, changeFrequency: "daily", priority: 0.9, lastModified: jobsUpdated },
    { url: `${SITE}/sponsors`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/visa-sponsorship-jobs`, changeFrequency: "daily", priority: 0.9, lastModified: jobsUpdated },
    ...ROLE_IDS.map((r) => ({ url: `${SITE}${rolePath(r)}`, changeFrequency: "daily" as const, priority: 0.9, lastModified: jobsUpdated })),
    { url: `${SITE}/visa-sponsors`, changeFrequency: "weekly", priority: 0.8 },
    ...places.map((p) => ({ url: `${SITE}${placePath(p.place)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE}/visa-routes`, changeFrequency: "monthly", priority: 0.7 },
    ...VISA_CATEGORIES.map((v) => ({ url: `${SITE}${routePath(v)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE}/guide/visa-basics`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/visa-salary-checker`, changeFrequency: "monthly", priority: 0.8, lastModified: new Date(SNAPSHOT_DATE) },
    ...OCCUPATIONS.map((o) => ({
      url: `${SITE}${occupationPath(o)}`,
      changeFrequency: "monthly" as const,
      priority: o.status === "ineligible" ? 0.4 : 0.6,
      lastModified: new Date(SNAPSHOT_DATE),
    })),
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
