import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Sponsor {
  id: string;
  name: string;
  city: string;
  region: string;
  visaTypes: string[];
  sector?: string;
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

  // Filters
  filters: SponsorFilters;

  // Actions
  setSponsors: (sponsors: Sponsor[]) => void;
  setFilters: (filters: Partial<SponsorFilters>) => void;
  toggleSaved: (sponsorId: string) => void;

  // Computed
  filteredSponsors: () => Sponsor[];
}

export const useSponsorStore = create<SponsorStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sponsors: [],
      savedSponsors: new Set(),
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
