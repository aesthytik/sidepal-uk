"use client";

import { useState } from "react";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { SearchBar } from "@/components/SearchBar";
import { ActiveFilters, SearchFilters } from "@/components/SearchFilters";
import { Button } from "@/components/ui/button";
import { SlidersIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { useJobSearch } from "@/lib/useSponsorSearch";

export function JobSearch() {
  const search = useJobSearch();
  const { filters, setFilters, items, total, status, info } = search;
  const [sheetOpen, setSheetOpen] = useState(false);

  const filterCount = [filters.location, filters.visa, filters.rating, filters.role, filters.sector, filters.sponsored].filter(
    Boolean
  ).length;
  const loading = status === "loading";
  const updated = info?.generatedAt
    ? new Date(info.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : null;

  return (
    <main className="container px-4 py-6 sm:py-10">
      <header className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">UK jobs from visa sponsors</h1>
          <p className="mt-1 text-muted-foreground">
            {info && info.count > 0
              ? `${info.count.toLocaleString()} live roles from ${info.sponsors.toLocaleString()} licensed sponsors${updated ? `, updated ${updated}` : ""}. `
              : "Roles from licensed sponsors. "}
            More sponsors are added every day.{" "}
            <Link href="/sponsors" className="font-medium text-primary hover:underline">
              Browse all sponsors →
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <SearchBar
            className="flex-1"
            value={filters.q ?? ""}
            onSearch={(q) => setFilters({ q }, { replace: true })}
            placeholder="Job title or company, e.g. data engineer"
            label="Search jobs"
          />
          <Button variant="outline" className="h-11 lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersIcon />
            Filters
            {filterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground">{filterCount}</span>
            )}
          </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-5">
            <SearchFilters filters={filters} onChange={setFilters} showSponsored />
          </div>
        </aside>

        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filters"
          footer={
            <Button className="w-full" size="lg" onClick={() => setSheetOpen(false)}>
              {loading ? "Searching…" : `Show ${total.toLocaleString()} jobs`}
            </Button>
          }
        >
          <SearchFilters filters={filters} onChange={setFilters} showSponsored />
        </Sheet>

        <section aria-label="Results" className="min-w-0 space-y-4">
          <ActiveFilters filters={filters} onChange={setFilters} />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? "Searching…" : status !== "error" && `${total.toLocaleString()} job${total === 1 ? "" : "s"}, newest first`}
          </p>

          {status === "error" ? (
            <div className="card p-8 text-center">
              <p className="font-medium">Couldn&apos;t load jobs.</p>
              <Button className="mt-4" variant="outline" onClick={search.retry}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            Array.from({ length: 4 }, (_, i) => <div key={i} className="card h-28 animate-pulse" aria-hidden="true" />)
          ) : items.length === 0 ? (
            <div className="card p-8 text-center">
              <h2 className="font-display text-xl font-semibold">No jobs found</h2>
              <p className="mt-2 text-muted-foreground">
                We only list roles from sponsors whose job boards we can read, so try fewer filters or browse all sponsors.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({ location: undefined, visa: undefined, rating: undefined, role: undefined, sector: undefined, sponsored: undefined })
                    }
                  >
                    Remove filters
                  </Button>
                )}
                <Button asChild variant="ghost">
                  <Link href="/sponsors">Browse sponsors</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {items.map((job) => (
                <JobCard key={job.url} job={job} />
              ))}
              {search.hasMore && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button variant="outline" size="lg" onClick={search.loadMore} disabled={status === "loading-more"}>
                    {status === "loading-more" ? "Loading…" : "Show more jobs"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Showing {items.length.toLocaleString()} of {total.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
