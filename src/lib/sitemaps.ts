// Stay below the sitemap protocol's limit of 50,000 URLs per file.
export const SPONSORS_PER_SITEMAP = 40_000;
export const JOBS_PER_SITEMAP = 40_000;

/** Keep existing numeric sponsor sitemap URLs stable as the job index grows. */
export function sitemapIds(sponsors: number, jobs: number) {
  return [
    { id: "0" },
    ...Array.from({ length: Math.ceil(sponsors / SPONSORS_PER_SITEMAP) }, (_, i) => ({ id: String(i + 1) })),
    ...Array.from({ length: Math.ceil(jobs / JOBS_PER_SITEMAP) }, (_, i) => ({ id: `jobs-${i}` })),
  ];
}
