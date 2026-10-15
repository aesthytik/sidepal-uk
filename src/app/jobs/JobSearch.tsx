"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { SearchBar } from "@/components/SearchBar";
import { ActiveFilters, SearchFilters } from "@/components/SearchFilters";
import { Button } from "@/components/ui/button";
import { Horus } from "@/components/game/Horus";
import { DailyQuest } from "@/components/DailyQuest";
import { ListIcon, MapIcon, SlidersIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { hasMatchable } from "@/lib/profile/types";
import { type InitialSearch, useJobSearch } from "@/lib/useSponsorSearch";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { SearchPagination } from "@/components/SearchPagination";
import { useProfile, useProfileHydrated } from "@/store/useProfile";
import { cn } from "@/lib/utils";
import { SortSelect } from "./SortSelect";

// MapLibre is heavy, so it only loads when someone opens the map
const JobMap = dynamic(() => import("./JobMap"), {
  ssr: false,
  loading: () => <div className="card h-[55vh] min-h-[22rem] animate-pulse lg:h-[72vh]" aria-hidden="true" />,
});

export function JobSearch({ initial }: { initial?: InitialSearch<IndexedJob> }) {
  const search = useJobSearch(initial);
  const { filters, setFilters, items, total, status, info } = search;
  const [sheetOpen, setSheetOpen] = useState(false);
  const canMatch = useProfile((s) => hasMatchable(s.profile));
  const profileLoaded = useProfileHydrated();

  const filterCount = [filters.location, filters.visa, filters.rating, filters.role, filters.sector, filters.sponsored, filters.place].filter(
    Boolean
  ).length;
  const loading = status === "loading";
  const mapView = filters.view === "map";
  const updated = info?.generatedAt
    ? new Date(info.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : null;

  const results =
    status === "error" ? (
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
        <Horus size={72} mood="shocked" say="Nothing?!" className="mb-4" />
        <h2 className="font-display text-xl font-semibold">No jobs found</h2>
        <p className="mt-2 text-muted-foreground">
          We only list roles from sponsors whose job boards we can read, so try fewer filters or browse all sponsors.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {filterCount > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ location: undefined, visa: undefined, rating: undefined, role: undefined, sector: undefined, sponsored: undefined, place: undefined })
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
        <div className="drop-in space-y-4">
          {items.map((job) => (
            <JobCard key={job.url} job={job} />
          ))}
        </div>
        <SearchPagination search={search} shown={items.length} label="jobs" />
      </>
    );

  return (
    <main className="container px-4 py-6 sm:py-10">
      <header className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">UK jobs from visa sponsors</h1>
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
              <span className="rounded bg-foreground px-1.5 text-xs leading-5 text-background tabular-nums">{filterCount}</span>
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
          {!mapView && <DailyQuest />}
          <ActiveFilters filters={filters} onChange={setFilters} />
          {profileLoaded && !canMatch && (
            <Link
              href="/profile"
              className="card flex items-center gap-3 p-3 text-sm transition-colors hover:border-foreground/30"
            >
              <Horus size={36} mood="curious" interactive={false} />
              <span className="min-w-0 flex-1">
                <span className="font-medium">Tell Horus about you and it&apos;ll rank these for you.</span>{" "}
                <span className="text-muted-foreground">Upload your CV or pick your skills. It stays in your browser.</span>
              </span>
              <span className="shrink-0 font-medium text-primary">Set up →</span>
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {mapView
                ? "Tap a bubble or a place to see its jobs"
                : loading
                  ? "Searching…"
                  : status !== "error" &&
                    `${total.toLocaleString()} job${total === 1 ? "" : "s"}, ${filters.sort === "salary" ? "highest salary" : filters.sort === "match" && canMatch ? "best match" : "newest"} first`}
            </p>
            <div className="flex items-center gap-2">
              {!mapView && (
                <SortSelect value={filters.sort} onChange={(sort) => setFilters({ sort }, { replace: true })} />
              )}
              <div role="group" aria-label="View" className="inline-flex rounded-md border bg-card p-0.5">
                {(
                  [
                    [false, "List", ListIcon],
                    [true, "Map", MapIcon],
                  ] as const
                ).map(([map, label, Icon]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={mapView === map}
                    onClick={() => setFilters({ view: map ? "map" : undefined }, { replace: true })}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors",
                      mapView === map ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon width={14} height={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {mapView ? (
            <JobMap filters={filters} onChange={setFilters}>
              {results}
            </JobMap>
          ) : (
            results
          )}
        </section>
      </div>
    </main>
  );
}
