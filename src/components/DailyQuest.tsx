"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { jobPath } from "@/lib/seo";
import { confetti } from "@/lib/game/fx";
import { scoreJob } from "@/lib/match/score";
import { type Profile, hasMatchable } from "@/lib/profile/types";
import { QUEST_SIZE, pickDaily, questStreak } from "@/lib/quest/daily";
import { localDay } from "@/lib/tracker/reminders";
import { cn } from "@/lib/utils";
import { useCalm } from "@/store/useGame";
import { useProfile, useProfileHydrated } from "@/store/useProfile";
import { useQuest, useQuestHydrated } from "@/store/useQuest";
import { useShortlist, useShortlistHydrated } from "@/store/useShortlist";
import { Horus } from "./game/Horus";
import { JobActions } from "./JobActions";
import { JobMatch } from "./JobMatch";
import { JobTailorButton } from "./JobTailor";
import { JobInterviewPrepButton } from "./JobInterviewPrep";

const APPLIED = new Set(["applied", "interviewing", "offer"]);
const RANKED = 40; // How many top-ranked jobs to choose from

/** The best-ranked jobs for this profile, from the same endpoint as the "Best match" sort. */
async function rankedJobs(profile: Profile): Promise<IndexedJob[]> {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params: `sort=match&limit=${RANKED}`, profile }),
  });
  if (!res.ok) throw new Error(`Ranking failed: ${res.status}`);
  return (await res.json()).items as IndexedJob[];
}

/**
 * Today's three matches. Apply to any one to complete the day's quest and keep the streak.
 * Renders nothing until the user has a profile to match against.
 */
export function DailyQuest({ className }: { className?: string }) {
  const profileReady = useProfileHydrated();
  const questReady = useQuestHydrated();
  const shortlistReady = useShortlistHydrated();
  const ready = profileReady && questReady && shortlistReady;
  const profile = useProfile((s) => s.profile);
  const saved = useShortlist((s) => s.jobs);
  const { day, picks, skipped, completed, setPicks, skip, complete } = useQuest();
  const calm = useCalm();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [exhausted, setExhausted] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const today = localDay();
  const current = useMemo(() => (day === today ? picks : []), [day, today, picks]);
  const doneToday = completed.includes(today);
  const streak = questStreak(completed, today);

  // Pick (or top up after a swap) today's jobs
  useEffect(() => {
    if (!ready || !hasMatchable(profile) || state !== "idle" || exhausted || current.length >= QUEST_SIZE) return;
    let cancelled = false;
    setState("loading");
    rankedJobs(profile)
      .then((jobs) => {
        if (cancelled) return;
        const keep = new Set(current.map((p) => p.url));
        const exclude = new Set([...Object.keys(saved), ...(day === today ? skipped : []), ...keep]);
        const candidates = jobs.map((j) => ({ url: j.url, sponsorId: j.sponsorId, score: scoreJob(j, profile)?.score ?? 0 }));
        const fresh = pickDaily(candidates, today, exclude, QUEST_SIZE - current.length);
        const byUrl = new Map(jobs.map((j) => [j.url, j]));
        setPicks(today, [...current, ...fresh.map((u) => byUrl.get(u)!)]);
        if (current.length + fresh.length < QUEST_SIZE) setExhausted(true);
        setState("idle");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
    // `current` and `saved` change as the user acts; re-picking is driven by the pick count instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile, current.length, today, exhausted]);

  // Applying to any pick completes the quest
  useEffect(() => {
    if (doneToday || !current.some((p) => APPLIED.has(saved[p.url]?.status ?? ""))) return;
    complete(today);
    const box = cardRef.current?.getBoundingClientRect();
    confetti({ calm, count: 90, ...(box && { x: box.left + box.width / 2, y: box.top + 40 }) });
  }, [saved, current, doneToday, complete, today, calm]);

  if (!ready || !hasMatchable(profile)) return null;

  return (
    <section ref={cardRef} aria-labelledby="daily-quest" className={cn("card quest-panel overflow-hidden", doneToday && "border-sage/40", className)}>
      <header className="flex flex-wrap items-center justify-between quest-header gap-3 border-b border-border px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Horus size={40} mood={doneToday ? "party" : "curious"} interactive={false} />
          <div>
            <h2 id="daily-quest" className="font-display text-lg leading-tight">
              {doneToday ? "Quest complete. See you tomorrow!" : "Today's quest: 3 matches for you"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {doneToday
                ? "Nice work. Keep going if you like, or come back tomorrow for three new picks."
                : "Apply to any one of them to complete today's quest (+50 XP)."}
            </p>
          </div>
        </div>
        <p className={cn("rounded-full border border-current/20 px-3 py-2 text-sm font-semibold tabular-nums", streak > 0 ? "bg-apricot text-apricot-foreground" : "bg-muted text-muted-foreground")}>
          <span aria-hidden="true">🔥</span> {streak}-day streak
        </p>
      </header>

      {state === "error" ? (
        <p className="p-5 text-sm text-muted-foreground">
          Couldn&apos;t pick today&apos;s jobs.{" "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => setState("idle")}>
            Try again
          </button>
        </p>
      ) : current.length === 0 && state === "loading" ? (
        <div className="grid gap-3 bg-muted/40 p-3 sm:grid-cols-3" aria-hidden="true">
          {Array.from({ length: QUEST_SIZE }, (_, i) => (
            <div key={i} className="h-40 animate-pulse bg-card" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          No strong matches right now. Try adding more skills or places to{" "}
          <Link href="/profile" className="font-medium text-primary hover:underline">
            your profile
          </Link>
          .
        </p>
      ) : (
        <ol className="grid gap-3 bg-muted/40 p-3 sm:grid-cols-3">
          {current.map((job, i) => {
            const status = saved[job.url]?.status;
            const applied = APPLIED.has(status ?? "");
            return (
              <li key={job.url} className={cn("quest-pick interactive-card flex flex-col gap-3 bg-card p-4 sm:p-5", applied && "bg-sage/5")}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    Pick {i + 1}
                    {applied && <span className="ml-1.5 text-sage">✓ Applied</span>}
                  </p>
                  <h3 className="mt-1 font-semibold leading-snug">
                    <Link href={jobPath(job)} className="hover:underline">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {job.sponsor} · {job.location || "UK"}
                  </p>
                </div>
                <JobMatch job={job} />
                <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
                  <JobActions job={job} />
                  <div className="flex flex-wrap gap-3 text-xs">
                    <JobTailorButton job={job} className="font-medium text-primary hover:underline" />
                    <JobInterviewPrepButton job={job} className="font-medium text-primary hover:underline" />
                    {!status && !doneToday && (
                      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => skip(job.url)}>
                        Swap
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
