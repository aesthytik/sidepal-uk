"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SearchFilters, parseSearchParams, toSearchParams } from "./searchParams";
import type { SearchPage, Sponsor } from "./sponsorTypes";

const PAGE_SIZE = 20;

type Status = "loading" | "ready" | "loading-more" | "error";

/**
 * The sponsor search, with the page URL as the single source of truth so
 * searches are shareable and back/forward work. Results accumulate as the
 * user loads more.
 */
export function useSponsorSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const filters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- paging isn't a filter
    const { page, ...rest } = parseSearchParams(new URLSearchParams(paramsKey));
    return rest;
  }, [paramsKey]);

  const [items, setItems] = useState<Sponsor[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageCount: 1, fuzzy: false });
  const [status, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);

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
    async (page: number, signal?: AbortSignal): Promise<SearchPage> => {
      const params = toSearchParams({ ...filters, page, limit: PAGE_SIZE });
      const res = await fetch(`/api/companies?${params}`, { signal });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json();
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetchPage(1, controller.signal)
      .then(({ items, ...rest }) => {
        setItems(items);
        setMeta(rest);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [fetchPage, retry]);

  const loadMore = useCallback(async () => {
    setStatus("loading-more");
    try {
      const { items: more, ...rest } = await fetchPage(meta.page + 1);
      setItems((prev) => [...prev, ...more]);
      setMeta(rest);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [fetchPage, meta.page]);

  return {
    filters,
    setFilters,
    items,
    total: meta.total,
    fuzzy: meta.fuzzy,
    status,
    hasMore: meta.page < meta.pageCount,
    loadMore,
    retry: () => setRetry((n) => n + 1),
  };
}
