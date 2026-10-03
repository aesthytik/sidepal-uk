import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const STATUSES = ["interested", "applied", "interviewing", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export interface ShortlistItem {
  status: Status;
  savedAt: string;
  note?: string;
}

interface Shortlist {
  items: Record<string, ShortlistItem>;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  update: (id: string, changes: Partial<Pick<ShortlistItem, "status" | "note">>) => void;
}

/**
 * Sponsors the user has saved and how far they've got with each. Stored in
 * localStorage; hydrated after mount (see ShortlistHydrator) so server and
 * client renders match.
 */
export const useShortlist = create<Shortlist>()(
  persist(
    (set) => ({
      items: {},
      toggle: (id) =>
        set(({ items }) => {
          const next = { ...items };
          if (next[id]) delete next[id];
          else next[id] = { status: "interested", savedAt: new Date().toISOString() };
          return { items: next };
        }),
      remove: (id) =>
        set(({ items }) => {
          const next = { ...items };
          delete next[id];
          return { items: next };
        }),
      update: (id, changes) =>
        set(({ items }) => (items[id] ? { items: { ...items, [id]: { ...items[id], ...changes } } } : { items })),
    }),
    {
      name: "sidepal-shortlist",
      version: 1,
      skipHydration: true,
      partialize: ({ items }) => ({ items }),
    }
  )
);

const LEGACY_KEY = "sponsor-storage";

/** Moves bookmarks saved by the previous version of the app into the shortlist. */
export function migrateLegacySaved() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const ids: unknown = JSON.parse(raw)?.state?.savedSponsors;
    if (Array.isArray(ids)) {
      const savedAt = new Date().toISOString();
      useShortlist.setState(({ items }) => {
        const next = { ...items };
        for (const id of ids) {
          if (typeof id === "string" && !next[id]) next[id] = { status: "interested", savedAt };
        }
        return { items: next };
      });
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Unreadable legacy data isn't worth failing over
  }
}

/** False until the shortlist has been read from localStorage. */
export function useShortlistHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useShortlist.persist.onFinishHydration(onChange),
    () => useShortlist.persist.hasHydrated(),
    () => false
  );
}
