"use client";

import { useEffect, useState, useCallback } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { Sector } from "@/lib/classifySector";
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
  const {
    filters,
    setSponsors,
    updateDomains,
    updateSectors,
    updateCareerUrls,
    sponsors: allSponsors,
  } = useSponsorStore();
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

  // Load sponsors data and enrich domains in one go
  const loadSponsors = useCallback(async () => {
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
        const currentSponsors = data.sponsors;
        // Reset filtered sponsors with updated data
        const updatedSponsors = currentSponsors.map((sponsor: Sponsor) => ({
          ...sponsor,
          sector: sponsor.sector || undefined,
          careerUrl: sponsor.careerUrl || undefined,
        }));
        setFilteredSponsors(updatedSponsors);
        setPaginationInfo(data.pagination);
        setTotalCount(data.count);

        if (currentPage === 1) {
          setSponsors(currentSponsors);
        }

        // Enrich domains once per page load
        const sponsorsToEnrich = currentSponsors.filter(
          (sponsor: Sponsor) =>
            !sponsor.website || sponsor.website === "unknown"
        );

        if (sponsorsToEnrich.length > 0) {
          const enrichResponse = await fetch("/api/enrich-domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsToEnrich.map((sponsor: Sponsor) => ({
                name: sponsor.name,
                city: sponsor.city,
              })),
            }),
          });

          if (enrichResponse.ok) {
            const enrichData = await enrichResponse.json();
            if (
              enrichData.success &&
              Object.keys(enrichData.domains).length > 0
            ) {
              updateDomains(enrichData.domains);
            }
          }
        }

        // Classify sectors for sponsors without sectors
        const sponsorsToClassify = currentSponsors.filter(
          (sponsor: Sponsor) => !sponsor.sector
        );

        if (sponsorsToClassify.length > 0) {
          const classifyResponse = await fetch("/api/classify-sectors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsToClassify.map((sponsor: Sponsor) => ({
                name: sponsor.name,
                website: sponsor.website || "unknown",
              })),
            }),
          });

          if (classifyResponse.ok) {
            const classifyData = await classifyResponse.json();
            console.log("Received sectors:", classifyData.sectors);
            if (
              classifyData.success &&
              Object.keys(classifyData.sectors).length > 0
            ) {
              updateSectors(classifyData.sectors);
            }
          }
        }

        // Find career URLs for sponsors without them
        const sponsorsNeedingCareerUrls = currentSponsors.filter(
          (sponsor: Sponsor) => !sponsor.careerUrl && sponsor.website
        );

        if (sponsorsNeedingCareerUrls.length > 0) {
          const careerUrlResponse = await fetch("/api/find-career-urls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsNeedingCareerUrls.map((sponsor: Sponsor) => ({
                name: sponsor.name,
                website: sponsor.website || "",
              })),
            }),
          });

          if (careerUrlResponse.ok) {
            const careerUrlData = await careerUrlResponse.json();
            if (
              careerUrlData.success &&
              Object.keys(careerUrlData.careerUrls).length > 0
            ) {
              updateCareerUrls(careerUrlData.careerUrls);
            }
          }
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
  }, [
    filters,
    currentPage,
    setIsLoading,
    setFilteredSponsors,
    setPaginationInfo,
    setTotalCount,
    setSponsors,
    updateDomains,
    updateSectors,
    updateCareerUrls,
  ]);

  // Update filtered sponsors when store updates
  // Update filtered sponsors when store updates
  useEffect(() => {
    const updateFromStore = () => {
      if (filteredSponsors.length === 0 || allSponsors.length === 0) return;

      const updatedSponsors = filteredSponsors.map((sponsor) => {
        const storeVersion = allSponsors.find((s) => s.id === sponsor.id);
        if (!storeVersion) return sponsor;

        return {
          ...sponsor,
          sector: storeVersion.sector,
          website: storeVersion.website,
          careerUrl: storeVersion.careerUrl,
        };
      });

      // Only update if there are actual changes
      const hasChanges = updatedSponsors.some((updated, index) => {
        const current = filteredSponsors[index];
        return (
          updated.sector !== current.sector ||
          updated.website !== current.website ||
          updated.careerUrl !== current.careerUrl
        );
      });

      if (hasChanges) {
        setFilteredSponsors(updatedSponsors);
      }
    };

    updateFromStore();
  }, [allSponsors]); // Only depend on allSponsors changes

  // Load initial data
  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  // Re-fetch sponsors when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadSponsors();
  }, [filters, loadSponsors]);

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
