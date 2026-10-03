import type { Metadata } from "next";
import { Suspense } from "react";
import { SponsorSearch } from "./SponsorSearch";

export const metadata: Metadata = {
  title: "Find a UK visa sponsor",
  description:
    "Search every UK employer licensed to sponsor Skilled Worker and other work visas, filter by location and visa route, and see their open roles.",
};

export default function SponsorsPage() {
  return (
    <Suspense>
      <SponsorSearch />
    </Suspense>
  );
}
