"use client";

import { useState } from "react";
import { CompanyCard, CompanyCardSkeleton } from "@/components/CompanyCard";
import { SearchBar } from "@/components/SearchBar";
import { ActiveFilters, SearchFilters } from "@/components/SearchFilters";
import { Button } from "@/components/ui/button";
import { SlidersIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { useEnrichment } from "@/lib/useEnrichment";
import { useSponsorSearch } from "@/lib/useSponsorSearch";

export function SponsorSearch() {
  const search = useSponsorSearch();
  const { filters, setFilters, items, total, status } = search;
  const enrichment = useEnrichment(
    items.map((s) => s.id),
    filters.role
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const filterCount = [filters.location, filters.visa, filters.rating, filters.role, filters.sector].filter(Boolean).length;
  const loading = status === "loading";

  return (
    <main className="container px-4 py-6 sm:py-10">
      <header className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Find a visa sponsor</h1>
          <p className="mt-1 text-muted-foreground">
            Every employer on the Home Office register, with their careers page and open roles where we can find them.
          </p>
        </div>
        <div className="flex gap-2">
          <SearchBar
            className="flex-1"
            value={filters.q ?? ""}
            onSearch={(q) => setFilters({ q }, { replace: true })}
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
            <SearchFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filters"
          footer={
            <Button className="w-full" size="lg" onClick={() => setSheetOpen(false)}>
              {loading ? "Searching…" : `Show ${total.toLocaleString()} sponsors`}
            </Button>
          }
        >
          <SearchFilters filters={filters} onChange={setFilters} />
        </Sheet>

        <section aria-label="Results" className="min-w-0 space-y-4">
          <ActiveFilters filters={filters} onChange={setFilters} />

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading
              ? "Searching…"
              : status !== "error" &&
                (search.fuzzy
                  ? `No exact matches. Showing ${total.toLocaleString()} similar names.`
                  : `${total.toLocaleString()} sponsor${total === 1 ? "" : "s"}`)}
          </p>

          {status === "error" ? (
            <div className="card p-8 text-center">
              <p className="font-medium">Couldn&apos;t load sponsors.</p>
              <Button className="mt-4" variant="outline" onClick={search.retry}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            Array.from({ length: 4 }, (_, i) => <CompanyCardSkeleton key={i} />)
          ) : items.length === 0 ? (
            <div className="card p-8 text-center">
              <h2 className="font-display text-xl font-semibold">No sponsors found</h2>
              <p className="mt-2 text-muted-foreground">
                The register uses each company&apos;s legal name, which may differ from its brand.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ location: undefined, visa: undefined, rating: undefined })}
                  >
                    Remove filters
                  </Button>
                )}
                {filters.q && (
                  <Button asChild variant="ghost">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${filters.q} UK limited company`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Look up the legal name
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {items.map((s) => (
                <CompanyCard key={s.id} sponsor={s} enrichment={enrichment.get(s.id)} pending={enrichment.isPending(s.id)} />
              ))}
              {search.hasMore && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button variant="outline" size="lg" onClick={search.loadMore} disabled={status === "loading-more"}>
                    {status === "loading-more" ? "Loading…" : "Load more"}
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
