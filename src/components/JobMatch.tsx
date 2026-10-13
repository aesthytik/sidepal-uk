"use client";

import { useMemo } from "react";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { scoreJob } from "@/lib/match/score";
import { cn } from "@/lib/utils";
import { useProfile } from "@/store/useProfile";

const tone = (score: number) =>
  score >= 75
    ? "border-sage/30 bg-sage/10 text-sage"
    : score >= 50
      ? "border-gold/30 bg-gold/10 text-gold"
      : "border-border bg-muted text-muted-foreground";

/** How well a job fits the user's profile. Renders nothing until there's a profile to match against. */
export function JobMatch({ job }: { job: IndexedJob }) {
  const profile = useProfile((s) => s.profile);
  const match = useMemo(() => scoreJob(job, profile), [job, profile]);
  if (!match) return null;

  return (
    <details className="group text-xs">
      <summary
        className={cn("inline-flex cursor-pointer list-none items-center gap-1 rounded-md border px-2 py-0.5 font-medium tabular-nums", tone(match.score))}
        title="How well this fits your profile"
      >
        {match.score}% match
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="mt-2 space-y-0.5 text-muted-foreground">
        {match.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </details>
  );
}
