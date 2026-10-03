"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Sponsor } from "@/lib/sponsorTypes";
import { useEnrichment } from "@/lib/useEnrichment";
import { SearchBar } from "@/components/SearchBar";
import { ResultsList } from "@/components/ResultsList";
import { Button } from "@/components/ui/button";

export default function SavedPage() {
  const savedSponsors = useSponsorStore((s) => s.savedSponsors);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Key on the ids so un-saving a card doesn't trigger a reload
  const savedKey = useMemo(
    () => Array.from(savedSponsors).sort().join(","),
    [savedSponsors]
  );

  useEffect(() => {
    if (!savedKey) {
      setSponsors([]);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: savedKey.split(",") }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setSponsors(data.success ? data.sponsors : []))
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Error loading saved:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [savedKey]);

  const { sponsors: enriched } = useEnrichment(sponsors);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter((s) => savedSponsors.has(s.id))
      .filter(
        (s) => !q || `${s.name} ${s.city} ${s.county}`.toLowerCase().includes(q)
      );
  }, [enriched, savedSponsors, query]);

  if (!isLoading && savedSponsors.size === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
          <h1 className="text-4xl font-display mb-4">Saved Sponsors</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl">
            You haven&apos;t saved any sponsors yet. Browse our directory to
            find and save companies you&apos;re interested in.
          </p>
          <Button asChild size="lg">
            <Link href="/sponsors">Browse Sponsors</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-display">Saved Sponsors</h1>
        <SearchBar
          value={query}
          onSearch={setQuery}
          placeholder="Search your saved sponsors..."
        />
        <ResultsList sponsors={visible} isLoading={isLoading} />
      </div>
    </main>
  );
}
