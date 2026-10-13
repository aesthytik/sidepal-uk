"use client";

import { hasMatchable } from "@/lib/profile/types";
import { useProfile } from "@/store/useProfile";

type Sort = "salary" | "match";

/** Newest first (the default), highest pay first, or best fit for the user's profile once they have one. */
export function SortSelect({ value, onChange }: { value?: Sort; onChange: (sort: Sort | undefined) => void }) {
  const canMatch = useProfile((s) => hasMatchable(s.profile));
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="sr-only sm:not-sr-only">Sort</span>
      <select
        value={value === "match" && !canMatch ? "newest" : (value ?? "newest")}
        onChange={(e) => onChange(e.target.value === "newest" ? undefined : (e.target.value as Sort))}
        className="h-8 rounded-md border bg-card px-2 text-xs font-medium text-foreground"
      >
        <option value="newest">Newest</option>
        <option value="salary">Highest salary</option>
        {canMatch && <option value="match">Best match for me</option>}
      </select>
    </label>
  );
}
