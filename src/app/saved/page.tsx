"use client";

import { useEffect, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { SearchBar } from "@/components/SearchBar";
import { ResultsList } from "@/components/ResultsList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SavedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { filters, savedSponsors } = useSponsorStore();
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);

  // Load saved sponsors data
  useEffect(() => {
    async function loadSavedSponsors() {
      try {
        setIsLoading(true);

        if (savedSponsors.size === 0) {
          setFilteredSponsors([]);
          setIsLoading(false);
          return;
        }

        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.sector) params.append("sector", filters.sector);
        if (filters.region) params.append("region", filters.region);
        if (filters.visaType) params.append("visa", filters.visaType);
        if (filters.query) params.append("q", filters.query);

        // Fetch all sponsors
        const response = await fetch(`/api/companies?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          // Filter to only saved sponsors
          const savedSponsorsList = data.sponsors.filter((sponsor: Sponsor) =>
            savedSponsors.has(sponsor.id)
          );
          setFilteredSponsors(savedSponsorsList);
        } else {
          console.error("Error loading sponsors:", data.error);
          setFilteredSponsors([]);
        }
      } catch (error) {
        console.error("Error loading sponsors:", error);
        setFilteredSponsors([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedSponsors();
  }, [filters, savedSponsors]);

  // No saved sponsors state
  if (!isLoading && savedSponsors.size === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
          <h1 className="text-4xl font-display mb-4">Saved Sponsors</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl">
            You haven&apos;t saved any sponsors yet. Browse our directory to
            find and save companies you&apos;re interested in.
          </p>
          <Button asChild size="lg">
            <Link href="/sponsors">Browse Sponsors</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-display">Saved Sponsors</h1>
        <SearchBar />
        <div className="card p-4 bg-white dark:bg-gray-900">
          <ResultsList sponsors={filteredSponsors} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
