"use client";

import Link from "next/link";
import { Button } from "./ui/button";

interface SearchPaging {
  hasMore: boolean;
  nextHref: string;
  previousHref?: string;
  total: number;
  status: string;
  loadMore: () => Promise<void>;
}

/** Real links let crawlers and browsers without JavaScript reach every results page. */
export function SearchPagination({ search, shown, label }: { search: SearchPaging; shown: number; label: string }) {
  if (!search.hasMore && !search.previousHref) return null;
  const loading = search.status === "loading-more";
  return (
    <nav aria-label={`${label} pagination`} className="flex flex-col items-center gap-2 pt-2">
      <div className="flex items-center gap-3">
        {search.previousHref && <Link href={search.previousHref} prefetch={false} className="text-sm font-medium text-primary hover:underline">Previous page</Link>}
        {search.hasMore && (
          <Button asChild variant="outline" size="lg">
            <a href={search.nextHref} aria-disabled={loading} onClick={(event) => {
              // Keep modified clicks and opening the link in a new tab working normally.
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              if (!loading) void search.loadMore();
            }}>
              {loading ? "Loading…" : `Show more ${label}`}
            </a>
          </Button>
        )}
      </div>
      <span className="text-xs text-muted-foreground">Showing {shown.toLocaleString("en-GB")} of {search.total.toLocaleString("en-GB")}</span>
    </nav>
  );
}
