import type { Metadata } from "next";
import { Suspense } from "react";
import { searchJobs } from "@/lib/jobs";
import { JobSearch } from "./JobSearch";

export const metadata: Metadata = {
  alternates: { canonical: "/jobs" },
  title: "UK visa sponsorship jobs",
  description:
    "Latest UK jobs from employers licensed to sponsor work visas. Filter by location, role, sector and visa route, with a sponsorship check on every role.",
};

// Re-render hourly so the structured data tracks the index
export const revalidate = 3600;

/**
 * The newest roles as a plain ItemList. Google's job-posting rules forbid JobPosting markup on
 * list pages (it belongs on a single job's own page, which here is the employer's), so this
 * only describes the list.
 */
async function jobsJsonLd() {
  const { items } = await searchJobs({ limit: 25 }).catch(() => ({ items: [] }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest UK jobs from licensed visa sponsors",
    itemListElement: items.map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${j.title} at ${j.sponsor}`,
      url: j.url,
    })),
  };
}

export default async function JobsPage() {
  const jsonLd = await jobsJsonLd();
  return (
    <>
      {jsonLd.itemListElement.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <Suspense>
        <JobSearch />
      </Suspense>
    </>
  );
}
