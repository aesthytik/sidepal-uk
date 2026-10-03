"use client";

import { useEffect, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import type { SponsorFilters } from "./sponsorTypes";

const PARAMS: Record<keyof SponsorFilters, string> = {
  query: "q",
  city: "city",
  county: "county",
  region: "region",
  visaType: "visa",
};

/**
 * Keeps the filters in the store and the page URL in sync, so searches
 * are shareable. Returns true once the URL has been read into the store.
 */
export function useUrlFilters(): boolean {
  const [ready, setReady] = useState(false);
  const filters = useSponsorStore((s) => s.filters);
  const setFilters = useSponsorStore((s) => s.setFilters);

  // URL -> store (once, on mount). Always overrides, so a fresh visit
  // to /sponsors starts clean instead of reusing stale state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial: Partial<SponsorFilters> = {};
    (Object.keys(PARAMS) as (keyof SponsorFilters)[]).forEach((key) => {
      initial[key] = params.get(PARAMS[key]) || undefined;
    });
    setFilters(initial);
    setReady(true);
  }, [setFilters]);

  // store -> URL
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    (Object.keys(PARAMS) as (keyof SponsorFilters)[]).forEach((key) => {
      if (filters[key]) params.set(PARAMS[key], filters[key]!);
    });
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [filters, ready]);

  return ready;
}
