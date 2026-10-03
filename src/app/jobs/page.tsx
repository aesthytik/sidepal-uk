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

/** schema.org JobPosting entries for the newest roles, so crawlers and AI tools can read them without running the page's scripts. */
async function jobsJsonLd() {
  const { items } = await searchJobs({ limit: 25 }).catch(() => ({ items: [] }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "JobPosting",
        title: j.title,
        description: j.snippet ?? `${j.title} at ${j.sponsor}, ${j.location}.`,
        datePosted: j.postedAt?.slice(0, 10),
        url: j.url,
        directApply: false,
        hiringOrganization: { "@type": "Organization", name: j.sponsor },
        jobLocation: {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: j.location, addressCountry: "GB" },
        },
        ...(j.department && { industry: j.department }),
      },
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
