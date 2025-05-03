"use client";

import { useEffect, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsList } from "@/components/ResultsList";

export default function SponsorsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { filters, setSponsors } = useSponsorStore();
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);

  // Load sponsors data
  useEffect(() => {
    async function loadSponsors() {
      try {
        setIsLoading(true);

        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.sector) params.append("sector", filters.sector);
        if (filters.region) params.append("region", filters.region);
        if (filters.visaType) params.append("visa", filters.visaType);
        if (filters.query) params.append("q", filters.query);

        // Fetch filtered sponsors
        const response = await fetch(`/api/companies?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setSponsors(data.sponsors);
          setFilteredSponsors(data.sponsors);
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

    loadSponsors();
  }, [filters, setSponsors]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-display">UK Tech Visa Sponsors</h1>
        <SearchBar />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="card p-4 sticky top-20">
              <h2 className="font-bold mb-4">Filters</h2>
              <FilterPanel />
            </div>
          </aside>
          <section className="lg:col-span-9">
            <ResultsList sponsors={filteredSponsors} isLoading={isLoading} />
          </section>
        </div>
      </div>
    </main>
  );
}
