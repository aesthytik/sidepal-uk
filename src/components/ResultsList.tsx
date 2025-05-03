"use client";

import { useRef, useEffect } from "react";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { CompanyCard } from "./CompanyCard";
import { Sponsor } from "@/lib/sponsorTypes";

interface ResultsListProps {
  sponsors: Sponsor[];
  isLoading?: boolean;
}

// Card heights based on content
const CARD_BASE_HEIGHT = 170; // Base height
const CARD_PADDING = 16; // Vertical padding
const HEIGHT_PER_TAG = 28; // Height per tag row

// Calculate card height based on content
const getCardHeight = (sponsor: Sponsor): number => {
  // Count total tags (sector + visa types)
  const tagCount = 1 + sponsor.visaTypes.length + (sponsor.rating ? 1 : 0);
  // Calculate rows needed for tags (3 tags per row)
  const tagRows = Math.ceil(tagCount / 3);
  // Return total height
  return CARD_BASE_HEIGHT + tagRows * HEIGHT_PER_TAG;
};

export function ResultsList({ sponsors, isLoading = false }: ResultsListProps) {
  const listRef = useRef<VariableSizeList>(null);

  // Reset list measurements when sponsors change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [sponsors]);

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
    <div className="h-[calc(100vh-200px)]">
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <VariableSizeList
            ref={listRef}
            height={height}
            width={width}
            itemCount={sponsors.length}
            itemSize={(index: number) =>
              getCardHeight(sponsors[index]) + CARD_PADDING
            }
            overscanCount={3}
          >
            {({
              index,
              style,
            }: {
              index: number;
              style: React.CSSProperties;
            }) => (
              <div style={{ ...style, paddingBottom: CARD_PADDING }}>
                <CompanyCard sponsor={sponsors[index]} />
              </div>
            )}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
