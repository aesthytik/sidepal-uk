"use client";

import { useEffect } from "react";
import { useProfile } from "@/store/useProfile";
import { migrateLegacySaved, useShortlist } from "@/store/useShortlist";

/** Loads the saved shortlist and profile from localStorage once the page has hydrated. */
export function ShortlistHydrator() {
  useEffect(() => {
    Promise.resolve(useShortlist.persist.rehydrate()).then(migrateLegacySaved);
    useProfile.persist.rehydrate();
  }, []);
  return null;
}
