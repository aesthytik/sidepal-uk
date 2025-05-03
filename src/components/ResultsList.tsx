"use client";

import { CompanyCard } from "./CompanyCard";
import { Sponsor } from "@/lib/sponsorTypes";

interface ResultsListProps {
  sponsors: Sponsor[];
  isLoading?: boolean;
}

export function ResultsList({ sponsors, isLoading = false }: ResultsListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="card animate-pulse bg-gray-100 dark:bg-gray-800 h-[170px]"
          />
        ))}
      </div>
    );
  }

  // No results message
  if (sponsors.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No sponsors found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sponsors.map((sponsor) => (
        <CompanyCard key={sponsor.id} sponsor={sponsor} />
      ))}
    </div>
  );
}
