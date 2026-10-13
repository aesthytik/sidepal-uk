import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { followUpFor } from "@/lib/tracker/reminders";
import { emit } from "./useGame";

export const STATUSES = ["interested", "applied", "interviewing", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export interface ShortlistItem {
  status: Status;
  savedAt: string;
  note?: string;
}

/** What we keep of a saved job, so it still shows after it drops out of the daily index. */
export type JobSnapshot = Pick<IndexedJob, "title" | "url" | "sponsor" | "sponsorId" | "location" | "rating" | "salary" | "postedAt">;

export interface SavedJob extends ShortlistItem {
  job: JobSnapshot;
  followUp?: string; // YYYY-MM-DD reminder to chase, set automatically when the status changes
}

type JobChanges = Partial<Pick<SavedJob, "status" | "note" | "followUp">>;

interface Shortlist {
  items: Record<string, ShortlistItem>; // Sponsors, by sponsor id
  jobs: Record<string, SavedJob>; // Jobs, by URL
  toggle: (id: string) => void;
  remove: (id: string) => void;
  update: (id: string, changes: Partial<Pick<ShortlistItem, "status" | "note">>) => void;
  toggleJob: (job: JobSnapshot) => void;
  /** Saves the job if needed, then applies the changes (e.g. "I applied" from a job card). */
  trackJob: (job: JobSnapshot, changes: JobChanges) => void;
  updateJob: (url: string, changes: JobChanges) => void;
  removeJob: (url: string) => void;
  /** Marks a due reminder as done. */
  completeFollowUp: (url: string) => void;
}

const snapshot = (j: JobSnapshot): JobSnapshot => ({
  title: j.title,
  url: j.url,
  sponsor: j.sponsor,
  sponsorId: j.sponsorId,
  location: j.location,
  rating: j.rating,
  ...(j.salary && { salary: j.salary }),
  ...(j.postedAt && { postedAt: j.postedAt }),
});

/** Applies changes to a saved job, emitting game events and moving the reminder with the status. */
function changeJob(item: SavedJob, changes: JobChanges): SavedJob {
  const id = `job:${item.job.url}`;
  const next = { ...item, ...changes };
  if (changes.status && changes.status !== item.status) {
    emit({ type: "status", id, status: changes.status, from: item.status });
    if (!("followUp" in changes)) next.followUp = followUpFor(changes.status) ?? undefined;
  }
  if (changes.note && changes.note !== item.note) emit({ type: "note", id });
  return next;
}

/**
 * Sponsors the user has saved and how far they've got with each. Stored in
 * localStorage; hydrated after mount (see ShortlistHydrator) so server and
 * client renders match.
 */
export const useShortlist = create<Shortlist>()(
  persist(
    (set) => ({
      items: {},
      jobs: {},
      toggle: (id) =>
        set(({ items }) => {
          const next = { ...items };
          if (next[id]) delete next[id];
          else next[id] = { status: "interested", savedAt: new Date().toISOString() };
          emit(next[id] ? { type: "save", id } : { type: "unsave", id });
          return { items: next };
        }),
      remove: (id) =>
        set(({ items }) => {
          const next = { ...items };
          delete next[id];
          return { items: next };
        }),
      update: (id, changes) =>
        set(({ items }) => {
          const item = items[id];
          if (!item) return { items };
          if (changes.status && changes.status !== item.status) emit({ type: "status", id, status: changes.status, from: item.status });
          if (changes.note && changes.note !== item.note) emit({ type: "note", id });
          return { items: { ...items, [id]: { ...item, ...changes } } };
        }),
      toggleJob: (job) =>
        set(({ jobs }) => {
          const next = { ...jobs };
          if (next[job.url]) delete next[job.url];
          else next[job.url] = { status: "interested", savedAt: new Date().toISOString(), job: snapshot(job) };
          emit(next[job.url] ? { type: "save", id: `job:${job.url}` } : { type: "unsave", id: `job:${job.url}` });
          return { jobs: next };
        }),
      trackJob: (job, changes) =>
        set(({ jobs }) => {
          let item = jobs[job.url];
          if (!item) {
            item = { status: "interested", savedAt: new Date().toISOString(), job: snapshot(job) };
            emit({ type: "save", id: `job:${job.url}` });
          }
          return { jobs: { ...jobs, [job.url]: changeJob(item, changes) } };
        }),
      updateJob: (url, changes) =>
        set(({ jobs }) => (jobs[url] ? { jobs: { ...jobs, [url]: changeJob(jobs[url], changes) } } : { jobs })),
      removeJob: (url) =>
        set(({ jobs }) => {
          const next = { ...jobs };
          delete next[url];
          return { jobs: next };
        }),
      completeFollowUp: (url) =>
        set(({ jobs }) => {
          const item = jobs[url];
          if (!item?.followUp) return { jobs };
          emit({ type: "follow-up", id: `${url}:${item.followUp}` });
          return { jobs: { ...jobs, [url]: { ...item, followUp: undefined } } };
        }),
    }),
    {
      name: "sidepal-shortlist",
      version: 1,
      skipHydration: true,
      partialize: ({ items, jobs }) => ({ items, jobs }),
    }
  )
);

const LEGACY_KEY = "sponsor-storage";

/** Moves bookmarks saved by the previous version of the app into the shortlist. */
export function migrateLegacySaved() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const ids: unknown = JSON.parse(raw)?.state?.savedSponsors;
    if (Array.isArray(ids)) {
      const savedAt = new Date().toISOString();
      useShortlist.setState(({ items }) => {
        const next = { ...items };
        for (const id of ids) {
          if (typeof id === "string" && !next[id]) next[id] = { status: "interested", savedAt };
        }
        return { items: next };
      });
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Unreadable legacy data isn't worth failing over
  }
}

/** False until the shortlist has been read from localStorage. */
export function useShortlistHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useShortlist.persist.onFinishHydration(onChange),
    () => useShortlist.persist.hasHydrated(),
    () => false
  );
}
