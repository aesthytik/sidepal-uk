import type { MetadataRoute } from "next";
import { jobsInfo } from "@/lib/jobs";

const BASE = "https://horus.to";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { generatedAt } = await jobsInfo().catch(() => ({ generatedAt: null }));
  const jobsUpdated = generatedAt ? new Date(generatedAt) : undefined;
  return [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1, lastModified: jobsUpdated },
    { url: `${BASE}/jobs`, changeFrequency: "daily", priority: 0.9, lastModified: jobsUpdated },
    { url: `${BASE}/sponsors`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/guide/visa-basics`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
