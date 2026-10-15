import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { SITE, breadcrumbs, jobPath, pageMetadata } from "@/lib/seo";
import { type PageSearchParams, pageSearchParams, parseSearchParams, searchPageSeo, searchQueryKey, validPage } from "@/lib/searchParams";
import { JobSearch } from "./JobSearch";

type Props = { searchParams: Promise<PageSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, canonical, noIndex } = searchPageSeo("/jobs", pageSearchParams(await searchParams));
  return pageMetadata({
    title: `UK Visa Sponsorship Jobs${page > 1 ? ` – Page ${page}` : ""}`,
    description: "Browse UK jobs from licensed visa sponsors. Filter by role, location, salary and visa route, and check sponsorship requirements before applying.",
    path: canonical,
    noIndex,
  });
}

// Re-render hourly so the structured data tracks the index
export const revalidate = 3600;

/**
 * The newest roles as a plain ItemList. Google's job-posting rules forbid JobPosting markup on
 * list pages (it belongs on each job's own page under /jobs/<slug>), so this only describes the list.
 */
export default async function JobsPage({ searchParams }: Props) {
  const params = pageSearchParams(await searchParams);
  if (!validPage(params)) notFound();
  const query = parseSearchParams(params);
  const [result, info] = await Promise.all([
    searchJobs({ ...query, limit: 20 }).catch(() => undefined),
    jobsInfo().catch(() => undefined),
  ]);
  if (result && (query.page ?? 1) > result.pageCount) notFound();
  const initial = result ? { ...result, info, queryKey: searchQueryKey(query) } : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest UK jobs from licensed visa sponsors",
    itemListElement: (result?.items ?? []).map((j, i) => ({
      "@type": "ListItem",
      position: ((result?.page ?? 1) - 1) * 20 + i + 1,
      name: `${j.title} at ${j.sponsor}`,
      url: `${SITE}${jobPath(j)}`,
    })),
  };
  return (
    <>
      <JsonLd
        data={[
          ...(jsonLd.itemListElement.length > 0 ? [jsonLd] : []),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
          ]),
        ]}
      />
      <Suspense>
        <JobSearch initial={initial} />
      </Suspense>
    </>
  );
}
