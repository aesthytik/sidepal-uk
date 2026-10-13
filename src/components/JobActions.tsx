"use client";

import { useState } from "react";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { scoreJob } from "@/lib/match/score";
import { emit } from "@/store/useGame";
import { useProfile } from "@/store/useProfile";
import { useShortlist } from "@/store/useShortlist";
import { Button } from "./ui/button";
import { BookmarkIcon, ExternalLinkIcon } from "./ui/icons";

const shortDate = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Save and Apply for one job. After Apply, offers to track it as applied with a follow-up reminder. */
export function JobActions({ job }: { job: IndexedJob }) {
  const saved = useShortlist((s) => s.jobs[job.url]);
  const toggleJob = useShortlist((s) => s.toggleJob);
  const trackJob = useShortlist((s) => s.trackJob);
  const [askApplied, setAskApplied] = useState(false);

  function onApply() {
    emit({ type: "apply-click", url: job.url });
    const match = scoreJob(job, useProfile.getState().profile);
    if (match) emit({ type: "match-open", score: match.score });
    if (!saved || saved.status === "interested") setAskApplied(true);
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant={saved ? "subtle" : "outline"}
          size="sm"
          onClick={() => toggleJob(job)}
          aria-pressed={Boolean(saved)}
          aria-label={saved ? "Remove job from tracker" : "Save job to tracker"}
        >
          <BookmarkIcon filled={Boolean(saved)} />
          <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </Button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onApply}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Apply <ExternalLinkIcon />
        </a>
      </div>
      {askApplied && saved?.status !== "applied" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          Did you apply?
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              trackJob(job, { status: "applied" });
              setAskApplied(false);
            }}
          >
            Yes, track it
          </button>
          <button type="button" className="hover:underline" onClick={() => setAskApplied(false)}>
            Not yet
          </button>
        </p>
      )}
      {saved?.status && saved.status !== "interested" && (
        <p className="text-xs text-muted-foreground">
          {saved.status === "applied" ? "Applied" : saved.status === "interviewing" ? "Interviewing" : saved.status === "offer" ? "Offer 🎉" : "Closed"}
          {saved.followUp && ` · follow up ${shortDate(saved.followUp)}`}
        </p>
      )}
    </div>
  );
}
