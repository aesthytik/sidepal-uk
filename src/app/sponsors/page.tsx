"use client";

import { useEffect, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsList } from "@/components/ResultsList";
import { Pagination } from "@/components/Pagination";

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SponsorsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { filters, setSponsors } = useSponsorStore();
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

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
        params.append("page", currentPage.toString());
        params.append("limit", "10");

        // Fetch filtered sponsors
        const response = await fetch(`/api/companies?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setFilteredSponsors(data.sponsors);
          setPaginationInfo(data.pagination);
          setTotalCount(data.count);
          // Update total data in store while preserving pagination
          if (currentPage === 1) {
            setSponsors(data.sponsors);
          }
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
  }, [filters, setSponsors, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * 10 + 1} -{" "}
                {Math.min(currentPage * 10, totalCount)} of {totalCount}{" "}
                sponsors
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Page {currentPage} of {paginationInfo.totalPages}
              </p>
            </div>
            <ResultsList sponsors={filteredSponsors} isLoading={isLoading} />
            {paginationInfo.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginationInfo.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
