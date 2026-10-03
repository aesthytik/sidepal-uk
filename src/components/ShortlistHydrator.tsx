"use client";

import { useEffect } from "react";
import { migrateLegacySaved, useShortlist } from "@/store/useShortlist";

/** Loads the saved shortlist from localStorage once the page has hydrated. */
export function ShortlistHydrator() {
  useEffect(() => {
    Promise.resolve(useShortlist.persist.rehydrate()).then(migrateLegacySaved);
  }, []);
  return null;
}
