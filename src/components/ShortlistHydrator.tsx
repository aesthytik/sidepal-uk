"use client";

import { useEffect } from "react";
import { useProfile } from "@/store/useProfile";
import { useQuest } from "@/store/useQuest";
import { migrateLegacySaved, useShortlist } from "@/store/useShortlist";

/** Loads the saved shortlist, profile and daily quest from localStorage once the page has hydrated. */
export function ShortlistHydrator() {
  useEffect(() => {
    Promise.resolve(useShortlist.persist.rehydrate()).then(migrateLegacySaved);
    useProfile.persist.rehydrate();
    useQuest.persist.rehydrate();
  }, []);
  return null;
}
