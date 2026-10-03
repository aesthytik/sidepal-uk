import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SponsorFilters } from "@/lib/sponsorTypes";

interface SponsorStore {
  savedSponsors: Set<string>;
  filters: SponsorFilters;

  setFilters: (filters: Partial<SponsorFilters>) => void;
  resetFilters: () => void;
  toggleSaved: (sponsorId: string) => void;
}

const EMPTY_FILTERS: SponsorFilters = {
  city: undefined,
  county: undefined,
  region: undefined,
  visaType: undefined,
  query: undefined,
};

export const useSponsorStore = create<SponsorStore>()(
  persist(
    (set, get) => ({
      savedSponsors: new Set(),
      filters: EMPTY_FILTERS,

      setFilters: (partial) => {
        const current = get().filters;
        const next = { ...current };
        let changed = false;
        for (const [key, value] of Object.entries(partial) as [
          keyof SponsorFilters,
          string | undefined
        ][]) {
          const normalised = value?.trim() ? value : undefined;
          if (next[key] !== normalised) {
            next[key] = normalised;
            changed = true;
          }
        }
        // Only replace the object when something changed, so effects
        // depending on `filters` don't refetch needlessly
        if (changed) set({ filters: next });
      },

      resetFilters: () => set({ filters: EMPTY_FILTERS }),

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
    }),
    {
      name: "sponsor-storage",
      // Sets aren't JSON-serialisable, so persist as an array
      partialize: (state) => ({
        savedSponsors: Array.from(state.savedSponsors),
      }),
      merge: (persisted, current) => {
        const saved = (persisted as { savedSponsors?: unknown })?.savedSponsors;
        return {
          ...current,
          savedSponsors: new Set(Array.isArray(saved) ? saved : []),
        };
      },
    }
  )
);
