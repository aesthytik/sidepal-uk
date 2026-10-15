"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SearchFilters, parseSearchParams, searchQueryKey, toSearchParams } from "./searchParams";
import type { SearchPage, Sponsor } from "./sponsorTypes";
import type { IndexedJob } from "./jobs/indexer";
import type { JobsInfo } from "./jobs";
import { hasMatchable } from "./profile/types";
import { emit } from "@/store/useGame";
import { useProfile, useProfileHydrated } from "@/store/useProfile";

const PAGE_SIZE = 20;

type Status = "loading" | "ready" | "loading-more" | "error";

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
  fuzzy?: boolean;
  info?: JobsInfo;
}

export interface InitialSearch<T> extends SearchResult<T> {
  queryKey: string;
}

/**
 * The sponsor search, with the page URL as the single source of truth so
 * searches are shareable and back/forward work. Results accumulate as the
 * user loads more.
 */
export function useSponsorSearch(initial?: InitialSearch<Sponsor>) {
  return useUrlSearch<Sponsor>("/api/companies", initial);
}

/**
 * The jobs search, newest first. `info` describes the index (size and age).
 * Sorting by match posts the profile, so skills never end up in the URL.
 */
export function useJobSearch(initial?: InitialSearch<IndexedJob>) {
  const profile = useProfile((s) => s.profile);
  const hydrated = useProfileHydrated();
  const matching = useSearchParams().get("sort") === "match";
  const rank = useMemo(() => (matching && hasMatchable(profile) ? { profile } : undefined), [matching, profile]);
  // Wait for the saved profile before the first ranked fetch, rather than fetching twice
  return useUrlSearch<IndexedJob>("/api/jobs", initial, rank, !matching || hydrated);
}

/** `body` turns each fetch into a POST of { params, ...body }; nothing is fetched until `ready`. */
function useUrlSearch<T>(endpoint: string, initial?: InitialSearch<T>, body?: object, ready = true) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const requestedPage = parseSearchParams(new URLSearchParams(paramsKey)).page ?? 1;
  const filters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- paging isn't a filter
    const { page, ...rest } = parseSearchParams(new URLSearchParams(paramsKey));
    return rest;
  }, [paramsKey]);
  // What the results depend on: switching between list and map doesn't refetch
  const queryKey = searchQueryKey({ ...filters, page: requestedPage });
  const query = useMemo(() => parseSearchParams(new URLSearchParams(queryKey)), [queryKey]);

  const [items, setItems] = useState<T[]>(initial?.items ?? []);
  const [meta, setMeta] = useState<Omit<SearchResult<T>, "items">>(initial ?? {
    total: 0,
    page: 1,
    pageCount: 1,
  });
  const [status, setStatus] = useState<Status>(initial ? "ready" : "loading");
  const [retry, setRetry] = useState(0);
  const [seedKey, setSeedKey] = useState(initial?.queryKey);
  const previousBody = useRef(body);
  const activeQuery = useRef(queryKey);
  activeQuery.current = queryKey;

  // Adopt fresh navigation results without remounting the search field and losing focus.
  if (initial && initial.queryKey !== seedKey) {
    setSeedKey(initial.queryKey);
    setItems(initial.items);
    setMeta(initial);
    setStatus("ready");
    setRetry(0);
  }

  const setFilters = useCallback(
    (changes: Partial<SearchFilters>, { replace = false } = {}) => {
      const next = toSearchParams({ ...filters, ...changes }).toString();
      const url = next ? `${pathname}?${next}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [filters, pathname, router]
  );

  const fetchPage = useCallback(
    async (page: number, signal?: AbortSignal): Promise<Omit<SearchPage, "items"> & { items: T[]; info?: JobsInfo }> => {
      const params = toSearchParams({ ...query, page, limit: PAGE_SIZE });
      const res = body
        ? await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ params: params.toString(), ...body }),
            signal,
          })
        : await fetch(`${endpoint}?${params}`, { signal });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json();
    },
    [query, endpoint, body]
  );

  useEffect(() => {
    if (!ready) return;
    const hadBody = previousBody.current;
    previousBody.current = body;
    // Navigation supplies fresh server results; personalised ordering stays in the browser.
    if (initial?.queryKey === queryKey && !body && retry === 0) {
      if (hadBody) {
        setItems(initial.items);
        setMeta(initial);
        setStatus("ready");
      }
      if (queryKey) emit({ type: "search", key: `${endpoint}?${queryKey}`, location: query.location, ratingA: query.rating === "A" });
      if (initial.fuzzy) emit({ type: "fuzzy" });
      if (initial.total === 0) emit({ type: "zero-results" });
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    fetchPage(requestedPage, controller.signal)
      .then(({ items, ...rest }) => {
        setItems(items);
        setMeta(rest);
        setStatus("ready");
        if (queryKey) emit({ type: "search", key: `${endpoint}?${queryKey}`, location: query.location, ratingA: query.rating === "A" });
        if (rest.fuzzy) emit({ type: "fuzzy" });
        if (rest.total === 0) emit({ type: "zero-results" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [fetchPage, retry, endpoint, query, queryKey, ready, initial, body, requestedPage]);

  const loadMore = useCallback(async () => {
    setStatus("loading-more");
    try {
      const { items: more, ...rest } = await fetchPage(meta.page + 1);
      if (activeQuery.current !== queryKey) return;
      setItems((prev) => [...prev, ...more]);
      setMeta(rest);
      setStatus("ready");
      emit({ type: "load-more" });
    } catch {
      if (activeQuery.current === queryKey) setStatus("error");
    }
  }, [fetchPage, meta.page, queryKey]);

  const pageHref = (page: number) => {
    const params = toSearchParams({ ...filters, page: page > 1 ? page : undefined }).toString();
    return params ? `${pathname}?${params}` : pathname;
  };

  return {
    filters,
    setFilters,
    items,
    total: meta.total,
    fuzzy: meta.fuzzy ?? false,
    info: meta.info,
    status,
    hasMore: meta.page < meta.pageCount,
    nextHref: pageHref(meta.page + 1),
    previousHref: requestedPage > 1 ? pageHref(requestedPage - 1) : undefined,
    loadMore,
    retry: () => setRetry((n) => n + 1),
  };
}
