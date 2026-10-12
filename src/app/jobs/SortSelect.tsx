"use client";

/** Newest first (the default) or highest pay first. */
export function SortSelect({ value, onChange }: { value?: "salary"; onChange: (sort: "salary" | undefined) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="sr-only sm:not-sr-only">Sort</span>
      <select
        value={value ?? "newest"}
        onChange={(e) => onChange(e.target.value === "salary" ? "salary" : undefined)}
        className="h-8 rounded-md border bg-card px-2 text-xs font-medium text-foreground"
      >
        <option value="newest">Newest</option>
        <option value="salary">Highest salary</option>
      </select>
    </label>
  );
}
