import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sector } from "@/lib/classifySector";

interface Sponsor {
  id: string;
  name: string;
  city: string;
  region: string;
  visaTypes: string[];
  sector?: Sector;
  website?: string;
  careerUrl?: string;
}

interface SponsorFilters {
  sector?: string;
  region?: string;
  visaType?: string;
  query?: string;
}

interface SponsorStore {
  // Data
  sponsors: Sponsor[];
  savedSponsors: Set<string>;
  enrichmentInProgress: boolean;

  // Filters
  filters: SponsorFilters;

  // Actions
  setSponsors: (sponsors: Sponsor[]) => void;
  setFilters: (filters: Partial<SponsorFilters>) => void;
  toggleSaved: (sponsorId: string) => void;
  updateDomains: (domains: Record<string, string>) => void;
  updateSectors: (sectors: Record<string, Sector>) => void;
  updateCareerUrls: (careerUrls: Record<string, string>) => void;
  setEnrichmentStatus: (status: boolean) => void;

  // Computed
  filteredSponsors: () => Sponsor[];
}

export const useSponsorStore = create<SponsorStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sponsors: [],
      savedSponsors: new Set(),
      enrichmentInProgress: false,
      filters: {
        sector: "IT",
      },

      // Actions
      setSponsors: (sponsors) => set({ sponsors }),
      setFilters: (filters) =>
        set({ filters: { ...get().filters, ...filters } }),
      toggleSaved: (sponsorId) =>
        set((state) => {
          const newSaved = new Set(state.savedSponsors);
          if (newSaved.has(sponsorId)) {
            newSaved.delete(sponsorId);
          } else {
            newSaved.add(sponsorId);
          }
          return { savedSponsors: newSaved };
        }),

      updateDomains: (domains) =>
        set((state) => {
          const needsUpdate = state.sponsors.some(
            (sponsor) =>
              domains[sponsor.name] && domains[sponsor.name] !== sponsor.website
          );

          if (!needsUpdate) return state;

          return {
            sponsors: state.sponsors.map((sponsor) => {
              const newDomain = domains[sponsor.name];
              if (!newDomain || newDomain === sponsor.website) return sponsor;

              return {
                ...sponsor,
                website: newDomain,
              };
            }),
          };
        }),

      updateSectors: (sectors) =>
        set((state) => {
          // Update both sponsors and filteredSponsors arrays
          const updatedSponsors = state.sponsors.map((sponsor) => {
            const newSector = sectors[sponsor.name];
            if (!newSector) return sponsor;

            return {
              ...sponsor,
              sector: newSector,
            };
          });

          return { sponsors: updatedSponsors };
        }),

      updateCareerUrls: (careerUrls) =>
        set((state) => {
          const needsUpdate = state.sponsors.some(
            (sponsor) =>
              careerUrls[sponsor.name] &&
              careerUrls[sponsor.name] !== sponsor.careerUrl
          );

          if (!needsUpdate) return state;

          return {
            sponsors: state.sponsors.map((sponsor) => {
              const newCareerUrl = careerUrls[sponsor.name];
              if (!newCareerUrl || newCareerUrl === sponsor.careerUrl)
                return sponsor;

              return {
                ...sponsor,
                careerUrl: newCareerUrl,
              };
            }),
          };
        }),

      setEnrichmentStatus: (status) => set({ enrichmentInProgress: status }),

      // Computed values
      filteredSponsors: () => {
        const { sponsors, filters } = get();
        return sponsors.filter((sponsor) => {
          if (filters.sector && sponsor.sector !== filters.sector) return false;
          if (filters.region && sponsor.region !== filters.region) return false;
          if (filters.visaType && !sponsor.visaTypes.includes(filters.visaType))
            return false;
          if (filters.query) {
            const query = filters.query.toLowerCase();
            return (
              sponsor.name.toLowerCase().includes(query) ||
              sponsor.city.toLowerCase().includes(query)
            );
          }
          return true;
        });
      },
    }),
    {
      name: "sponsor-storage",
      partialize: (state) => ({
        savedSponsors: Array.from(state.savedSponsors),
      }),
      onRehydrateStorage: () => (state) => {
        // Convert savedSponsors back to a Set
        if (state && Array.isArray(state.savedSponsors)) {
          state.savedSponsors = new Set(state.savedSponsors);
        }
      },
    }
  )
);
