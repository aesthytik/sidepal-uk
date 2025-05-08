"use client";

import { useEffect, useState, useCallback } from "react";
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
  // Separate function to handle background enrichment
  const enrichSponsors = useCallback(
    async (currentSponsors: Sponsor[]) => {
      // Check store for existing data
      // allSponsors from the hook's closure is used here.
      const storeSponsors = allSponsors;

      // Enrich domains only for sponsors without valid websites in both current and store data
      const sponsorsToEnrich = currentSponsors.filter((sponsor) => {
        const storeVersion = storeSponsors.find((s) => s.id === sponsor.id);
        return (
          (!sponsor.website || sponsor.website === "unknown") &&
          (!storeVersion ||
            !storeVersion.website ||
            storeVersion.website === "unknown")
        );
      });

      if (sponsorsToEnrich.length > 0) {
        try {
          const enrichResponse = await fetch("/api/enrich-domains", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsToEnrich.map((sponsor) => ({
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
        } catch (error) {
          console.error("Error enriching domains:", error);
        }
      }

      // Classify sectors
      const sponsorsToClassify = currentSponsors.filter((sponsor) => {
        const storeVersion = storeSponsors.find((s) => s.id === sponsor.id);
        return !sponsor.sector && (!storeVersion || !storeVersion.sector);
      });

      if (sponsorsToClassify.length > 0) {
        try {
          const classifyResponse = await fetch("/api/classify-sectors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsToClassify.map((sponsor) => ({
                name: sponsor.name,
                website: sponsor.website || "unknown",
              })),
            }),
          });

          if (classifyResponse.ok) {
            const classifyData = await classifyResponse.json();
            if (
              classifyData.success &&
              Object.keys(classifyData.sectors).length > 0
            ) {
              updateSectors(classifyData.sectors);
            }
          }
        } catch (error) {
          console.error("Error classifying sectors:", error);
        }
      }

      // Find career URLs
      const sponsorsNeedingCareerUrls = currentSponsors.filter((sponsor) => {
        const storeVersion = storeSponsors.find((s) => s.id === sponsor.id);
        return (
          !sponsor.careerUrl &&
          sponsor.website &&
          (!storeVersion || !storeVersion.careerUrl) &&
          sponsor.website !== "unknown"
        );
      });

      if (sponsorsNeedingCareerUrls.length > 0) {
        try {
          const careerUrlResponse = await fetch("/api/find-career-urls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sponsors: sponsorsNeedingCareerUrls.map((sponsor) => ({
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
        } catch (error) {
          console.error("Error finding career URLs:", error);
        }
      }
    },
    [updateDomains, updateSectors, updateCareerUrls] // Removed allSponsors
  );

  const loadSponsors = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query string from filters
      const params = new URLSearchParams();
      // if (filters.sector) params.append("sector", filters.sector); // Removed sector
      if (filters.city) params.append("city", filters.city); // Added city
      if (filters.county) params.append("county", filters.county); // Added county
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

        // Merge current sponsors with store data
        const sponsorMap = new Map(allSponsors.map((s) => [s.id, s]));

        // Update or add new sponsors
        currentSponsors.forEach((sponsor: Sponsor) => {
          const existing = sponsorMap.get(sponsor.id);
          sponsorMap.set(sponsor.id, {
            ...(existing || {}),
            ...sponsor,
          } as Sponsor);
        });

        // Update store with merged sponsors
        setSponsors(Array.from(sponsorMap.values()));

        // Start background enrichment process
        enrichSponsors(currentSponsors);
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
  }, [filters, currentPage, setSponsors, enrichSponsors]); // Removed allSponsors

  // Update filtered sponsors when the global allSponsors store updates (e.g., due to enrichment)
  useEffect(() => {
    setFilteredSponsors((prevFilteredSponsors) => {
      if (prevFilteredSponsors.length === 0 || allSponsors.length === 0) {
        return prevFilteredSponsors;
      }

      const sponsorMap = new Map(allSponsors.map((s) => [s.id, s]));
      let changed = false;
      const newFilteredSponsors = prevFilteredSponsors.map((sponsor) => {
        const storeVersion = sponsorMap.get(sponsor.id);
        if (!storeVersion) return sponsor;

        const updatedSector = storeVersion.sector || sponsor.sector;
        const updatedWebsite = storeVersion.website || sponsor.website;
        const updatedCareerUrl = storeVersion.careerUrl || sponsor.careerUrl;

        if (
          updatedSector !== sponsor.sector ||
          updatedWebsite !== sponsor.website ||
          updatedCareerUrl !== sponsor.careerUrl
        ) {
          changed = true;
          return {
            ...sponsor,
            sector: updatedSector,
            website: updatedWebsite,
            careerUrl: updatedCareerUrl,
          };
        }
        return sponsor;
      });

      return changed ? newFilteredSponsors : prevFilteredSponsors;
    });
  }, [allSponsors]); // Only depends on allSponsors

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]); // Only reset page when filters change

  // Load sponsors when filters or page changes
  useEffect(() => {
    loadSponsors();
  }, [filters, currentPage, loadSponsors]); // loadSponsors is stable now w.r.t its own side effects

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
