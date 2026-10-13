import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { questStreak } from "@/lib/quest/daily";
import { emit } from "./useGame";

const MAX_DAYS = 120;

interface QuestState {
  day: string | null; // Local day the picks are for
  picks: IndexedJob[];
  skipped: string[]; // URLs swapped out today
  completed: string[]; // Local days the quest was completed, oldest first
  setPicks: (day: string, picks: IndexedJob[]) => void;
  skip: (url: string) => void;
  /** Marks a day complete (idempotent) and pays out the game reward. */
  complete: (day: string) => void;
}

/** Today's three matches and the quest streak. Stored in this browser; hydrated by ShortlistHydrator. */
export const useQuest = create<QuestState>()(
  persist(
    (set, get) => ({
      day: null,
      picks: [],
      skipped: [],
      completed: [],
      setPicks: (day, picks) => set((s) => ({ day, picks, skipped: s.day === day ? s.skipped : [] })),
      skip: (url) => set((s) => ({ skipped: [...s.skipped, url], picks: s.picks.filter((p) => p.url !== url) })),
      complete: (day) => {
        if (get().completed.includes(day)) return;
        const completed = [...get().completed, day].slice(-MAX_DAYS);
        set({ completed });
        emit({ type: "quest", day, streak: questStreak(completed, day) });
      },
    }),
    {
      name: "horus-quest",
      version: 1,
      skipHydration: true,
      partialize: ({ day, picks, skipped, completed }) => ({ day, picks, skipped, completed }),
    }
  )
);

export function useQuestHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useQuest.persist.onFinishHydration(onChange),
    () => useQuest.persist.hasHydrated(),
    () => false
  );
}
