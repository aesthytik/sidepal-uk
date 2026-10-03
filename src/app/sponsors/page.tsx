"use client";

import { useEffect, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { useEnrichment } from "@/lib/useEnrichment";
import { useUrlFilters } from "@/lib/useUrlFilters";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsList } from "@/components/ResultsList";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 10;

export default function SponsorsPage() {
  const filters = useSponsorStore((s) => s.filters);
  const setFilters = useSponsorStore((s) => s.setFilters);
  const filtersReady = useUrlFilters();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Back to page 1 whenever the filters change
  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    if (!filtersReady) return;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (filters.city) params.set("city", filters.city);
        if (filters.county) params.set("county", filters.county);
        if (filters.region) params.set("region", filters.region);
        if (filters.visaType) params.set("visa", filters.visaType);
        if (filters.query) params.set("q", filters.query);

        const res = await fetch(`/api/companies?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Request failed");

        setSponsors(data.sponsors);
        setTotalCount(data.count);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error loading sponsors:", err);
        setSponsors([]);
        setError("Couldn't load sponsors. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [filters, page, filtersReady]);

  const { sponsors: enrichedSponsors } = useEnrichment(sponsors);

  const handlePageChange = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const first = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-display">UK Tech Visa Sponsors</h1>
        <SearchBar
          value={filters.query ?? ""}
          onSearch={(query) => setFilters({ query })}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="card p-4 lg:sticky lg:top-20">
              <h2 className="text-2xl font-bold mb-4">Filters</h2>
              <FilterPanel />
            </div>
          </aside>
          <section className="lg:col-span-9">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading
                  ? "Searching..."
                  : `Showing ${first} - ${last} of ${totalCount.toLocaleString()} sponsors`}
              </p>
              {!isLoading && totalPages > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Page {page} of {totalPages.toLocaleString()}
                </p>
              )}
            </div>
            {error ? (
              <div className="card p-8 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <ResultsList sponsors={enrichedSponsors} isLoading={isLoading} />
            )}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
