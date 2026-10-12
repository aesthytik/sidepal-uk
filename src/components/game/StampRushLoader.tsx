"use client";

import dynamic from "next/dynamic";

// The game is canvas-only and not needed for the page to work, so it loads in the browser after everything else
export const StampRushLoader = dynamic(() => import("./StampRush"), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-lg border border-border bg-card" aria-hidden="true" />,
});
