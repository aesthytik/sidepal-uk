import type { MetadataRoute } from "next";
import { directoryInfo, listPlaces, sponsorIdsInRange } from "@/lib/directory";
import { allJobs, jobsInfo } from "@/lib/jobs";
import { MIN_PLACE_SPONSORS, ROLE_IDS, SITE, jobPath, occupationPath, placePath, rolePath, routePath, sponsorPath } from "@/lib/seo";
import { OCCUPATIONS, SNAPSHOT_DATE } from "@/lib/soc";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";
import { JOBS_PER_SITEMAP, SPONSORS_PER_SITEMAP, sitemapIds } from "@/lib/sitemaps";
import { notFound } from "next/navigation";

export const revalidate = 3600;

/** When the register was last loaded, which is when sponsor, place and route pages last changed. */
async function registerLoadedAt(): Promise<Date | undefined> {
  const loadedAt = (await directoryInfo().catch(() => null))?.loadedAt;
  return loadedAt ? new Date(loadedAt) : undefined;
}

/** Sitemap 0 holds curated pages; numeric slices hold sponsors; jobs have their own slices. */
export async function generateSitemaps() {
  const [directory, jobs] = await Promise.all([directoryInfo(), allJobs()]);
  return sitemapIds(directory.count, jobs.filter((job) => job.uk).length);
}

export default async function sitemap({ id }: { id: number | string }): Promise<MetadataRoute.Sitemap> {
  const slice = String(id);
  if (/^jobs-\d+$/.test(slice)) {
    const from = Number(slice.slice(5)) * JOBS_PER_SITEMAP;
    const jobs = (await allJobs()).filter((job) => job.uk).slice(from, from + JOBS_PER_SITEMAP);
    if (!jobs.length) notFound();
    // The original posting date is not a record of later description changes.
    return jobs.map((job) => ({ url: `${SITE}${jobPath(job)}` }));
  }
  if (!/^(0|[1-9]\d*)$/.test(slice)) notFound();
  if (Number(id) > 0) {
    const from = (Number(id) - 1) * SPONSORS_PER_SITEMAP;
    const [ids, lastModified] = await Promise.all([
      sponsorIdsInRange(from, from + SPONSORS_PER_SITEMAP),
      registerLoadedAt(),
    ]);
    if (!ids.length) notFound();
    return ids.map((sid) => ({ url: `${SITE}${sponsorPath(sid)}`, lastModified }));
  }

  const [jobs, places, registerUpdated] = await Promise.all([
    jobsInfo().catch(() => ({ generatedAt: null })),
    listPlaces(MIN_PLACE_SPONSORS),
    registerLoadedAt(),
  ]);
  const jobsUpdated = jobs.generatedAt ? new Date(jobs.generatedAt) : undefined;
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1, lastModified: jobsUpdated },
    { url: `${SITE}/jobs`, changeFrequency: "daily", priority: 0.9, lastModified: jobsUpdated },
    { url: `${SITE}/sponsors`, changeFrequency: "weekly", priority: 0.8, lastModified: registerUpdated },
    { url: `${SITE}/visa-sponsorship-jobs`, changeFrequency: "daily", priority: 0.9, lastModified: jobsUpdated },
    ...ROLE_IDS.map((r) => ({ url: `${SITE}${rolePath(r)}`, changeFrequency: "daily" as const, priority: 0.9, lastModified: jobsUpdated })),
    { url: `${SITE}/visa-sponsors`, changeFrequency: "weekly", priority: 0.8, lastModified: registerUpdated },
    ...places.map((p) => ({ url: `${SITE}${placePath(p.place)}`, changeFrequency: "weekly" as const, priority: 0.7, lastModified: registerUpdated })),
    { url: `${SITE}/visa-routes`, changeFrequency: "monthly", priority: 0.7 },
    ...VISA_CATEGORIES.map((v) => ({ url: `${SITE}${routePath(v)}`, changeFrequency: "weekly" as const, priority: 0.7, lastModified: registerUpdated })),
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
