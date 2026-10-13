"use client";

import type { IndexedJob } from "@/lib/jobs/indexer";
import { scoreJob } from "@/lib/match/score";
import { emit } from "@/store/useGame";
import { useProfile } from "@/store/useProfile";

/**
 * An external link that counts toward the game when clicked (used from server components).
 * Pass `job` to also record how well the opened job matched the user's profile.
 */
export function TrackedLink({
  event,
  job,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { event: "apply-click" | "careers-click"; href: string; job?: IndexedJob }) {
  return (
    <a
      {...props}
      onClick={() => {
        emit({ type: event, url: props.href });
        const match = job && scoreJob(job, useProfile.getState().profile);
        if (match) emit({ type: "match-open", score: match.score });
      }}
    />
  );
}
