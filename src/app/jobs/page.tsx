import type { Metadata } from "next";
import { Suspense } from "react";
import { JobSearch } from "./JobSearch";

export const metadata: Metadata = {
  title: "UK visa sponsorship jobs",
  description:
    "Latest UK jobs from employers licensed to sponsor work visas. Filter by location, role, sector and visa route, with a sponsorship check on every role.",
};

export default function JobsPage() {
  return (
    <Suspense>
      <JobSearch />
    </Suspense>
  );
}
