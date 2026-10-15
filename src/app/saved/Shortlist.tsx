"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompanyCard, CompanyCardSkeleton } from "@/components/CompanyCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icons";
import { JobTailorButton } from "@/components/JobTailor";
import { JobInterviewPrepButton } from "@/components/JobInterviewPrep";
import { DailyQuest } from "@/components/DailyQuest";
import { Horus } from "@/components/game/Horus";
import { type BoardCard, QuestBoard } from "@/components/game/QuestBoard";
import { TrophyRoom } from "@/components/game/TrophyRoom";
import { emit } from "@/store/useGame";
import { sponsorPath } from "@/lib/seo";
import type { Sponsor } from "@/lib/sponsorTypes";
import { FOLLOW_UP_HINT, addDays, dueState, localDay, toIcs } from "@/lib/tracker/reminders";
import { useEnrichment } from "@/lib/useEnrichment";
import { cn } from "@/lib/utils";
import {
  STATUSES,
  STATUS_LABELS,
  type SavedJob,
  type ShortlistItem,
  type Status,
  useShortlist,
  useShortlistHydrated,
} from "@/store/useShortlist";

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(header: string[], rows: string[][]) {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

const today = () => new Date().toISOString().slice(0, 10);

function exportSponsors(rows: { sponsor: Sponsor; item: ShortlistItem }[], websites: (id: string) => string) {
  const csv = toCsv(
    ["Company", "Location", "Rating", "Visa routes", "Status", "Saved", "Note", "Website"],
    rows.map(({ sponsor, item }) => [
      sponsor.name,
      sponsor.location,
      sponsor.rating,
      sponsor.visaTypes.join("; "),
      STATUS_LABELS[item.status],
      item.savedAt.slice(0, 10),
      item.note ?? "",
      websites(sponsor.id),
    ])
  );
  downloadFile(`horus-shortlist-${today()}.csv`, "text/csv", csv);
}

function exportJobs(rows: SavedJob[]) {
  const csv = toCsv(
    ["Job", "Company", "Location", "Status", "Saved", "Follow up", "Note", "Link"],
    rows.map(({ job, ...item }) => [
      job.title,
      job.sponsor,
      job.location,
      STATUS_LABELS[item.status],
      item.savedAt.slice(0, 10),
      item.followUp ?? "",
      item.note ?? "",
      job.url,
    ])
  );
  downloadFile(`horus-jobs-${today()}.csv`, "text/csv", csv);
}

function Note({ note, onSave }: { note?: string; onSave: (note: string | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note ?? "");

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 block w-full rounded-lg px-1 text-left text-sm text-muted-foreground hover:text-foreground"
      >
        {note ? <span className="whitespace-pre-wrap">📝 {note}</span> : "+ Add a note"}
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <textarea
        autoFocus
        aria-label="Note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Contact, role applied for, next steps…"
        className="w-full rounded-lg border border-input bg-card p-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            onSave(text.trim() || undefined);
            setEditing(false);
          }}
        >
          Save note
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** Reminders that are due, with quick actions. Finishing one earns XP. */
function DueReminders({ jobs }: { jobs: SavedJob[] }) {
  const complete = useShortlist((s) => s.completeFollowUp);
  const updateJob = useShortlist((s) => s.updateJob);
  const due = jobs
    .filter((j) => {
      const d = dueState(j.followUp);
      return d === "overdue" || d === "today";
    })
    .sort((a, b) => (a.followUp ?? "").localeCompare(b.followUp ?? ""));
  if (due.length === 0) return null;

  return (
    <section aria-labelledby="due-heading" className="card mb-6 border-clay/40 p-4">
      <h2 id="due-heading" className="flex items-center gap-2 font-semibold">
        ⏰ {due.length} follow-up{due.length === 1 ? "" : "s"} due
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {due.map(({ job, status, followUp }) => (
          <li key={job.url} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
            <span className="min-w-0">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                {job.title}
              </a>{" "}
              <span className="text-muted-foreground">at {job.sponsor}</span>
              <span className="block text-xs text-muted-foreground">
                {FOLLOW_UP_HINT[status] ?? "Check in"}
                {followUp && followUp < localDay() && ` · due ${followUp}`}
              </span>
            </span>
            <span className="flex shrink-0 gap-1.5">
              <Button size="sm" onClick={() => complete(job.url)}>
                Done ✓
              </Button>
              <Button size="sm" variant="ghost" onClick={() => updateJob(job.url, { followUp: addDays(localDay(), 2) })}>
                Snooze 2 days
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function downloadReminder({ job, status, followUp }: SavedJob) {
  if (!followUp) return;
  const ics = toIcs({
    uid: `${followUp}-${job.url}`,
    day: followUp,
    title: `Follow up: ${job.title} at ${job.sponsor}`,
    description: `${FOLLOW_UP_HINT[status] ?? "Check in on this role"}.\n${job.url}`,
    url: job.url,
  });
  downloadFile(`horus-reminder-${followUp}.ics`, "text/calendar", ics);
}

/** A saved job in the list view: status, reminder and note. */
function JobRow({ saved }: { saved: SavedJob }) {
  const updateJob = useShortlist((s) => s.updateJob);
  const removeJob = useShortlist((s) => s.removeJob);
  const { job, status, followUp, note } = saved;
  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-snug">
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {job.title}
            </a>
          </h2>
          <p className="mt-1 text-sm">
            <Link href={sponsorPath(job.sponsorId)} className="font-medium hover:underline">
              {job.sponsor}
            </Link>
            <span className="text-muted-foreground"> · {job.location || "UK"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label={`Status for ${job.title}`}
            value={status}
            onChange={(e) => updateJob(job.url, { status: e.target.value as Status })}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => removeJob(job.url)} aria-label={`Remove ${job.title}`}>
            Remove
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Follow up on
          <input
            type="date"
            value={followUp ?? ""}
            onChange={(e) => updateJob(job.url, { followUp: e.target.value || undefined })}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground"
          />
        </label>
        {followUp && (
          <Button size="sm" variant="outline" onClick={() => downloadReminder(saved)}>
            <DownloadIcon /> Add to calendar
          </Button>
        )}
        <JobTailorButton job={job} className="text-sm font-medium text-primary hover:underline" />
        <JobInterviewPrepButton job={job} className="text-sm font-medium text-primary hover:underline" />
      </div>
      <Note note={note} onSave={(n) => updateJob(job.url, { note: n })} />
    </article>
  );
}

type Kind = "jobs" | "sponsors";

export function Shortlist() {
  const hydrated = useShortlistHydrated();
  const items = useShortlist((s) => s.items);
  const jobs = useShortlist((s) => s.jobs);
  const update = useShortlist((s) => s.update);
  const updateJob = useShortlist((s) => s.updateJob);
  const [sponsors, setSponsors] = useState<Record<string, Sponsor>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status | "all">("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [kindChoice, setKind] = useState<Kind | null>(null);
  const [query, setQuery] = useState("");
  const kind: Kind = kindChoice ?? (Object.keys(jobs).length > 0 ? "jobs" : "sponsors");

  // Only refetch when an id we don't have yet appears, not on status changes
  const missingKey = Object.keys(items)
    .filter((id) => !sponsors[id])
    .sort()
    .join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (!missingKey) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: missingKey.split(",") }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { items?: Sponsor[] }) =>
        setSponsors((prev) => ({ ...prev, ...Object.fromEntries((data.items ?? []).map((s) => [s.id, s])) }))
      )
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [hydrated, missingKey]);

  const rows = useMemo(
    () =>
      Object.entries(items)
        .filter(([id]) => sponsors[id])
        .map(([id, item]) => ({ sponsor: sponsors[id], item }))
        .sort((a, b) => b.item.savedAt.localeCompare(a.item.savedAt)),
    [items, sponsors]
  );
  const jobRows = useMemo(() => Object.values(jobs).sort((a, b) => b.savedAt.localeCompare(a.savedAt)), [jobs]);

  const q = query.trim().toLowerCase();
  const matching = rows.filter(({ sponsor }) => !q || `${sponsor.name} ${sponsor.location}`.toLowerCase().includes(q));
  const matchingJobs = jobRows.filter(({ job }) => !q || `${job.title} ${job.sponsor} ${job.location}`.toLowerCase().includes(q));

  const statuses = kind === "jobs" ? jobRows.map((j) => j.status) : rows.map((r) => r.item.status);
  const counts: Record<string, number> = { all: statuses.length };
  for (const s of statuses) counts[s] = (counts[s] ?? 0) + 1;

  const visible = matching.filter(({ item }) => tab === "all" || item.status === tab);
  const visibleJobs = matchingJobs.filter((j) => tab === "all" || j.status === tab);

  // Export uses the websites found by enrichment, so the board view enriches too
  const enrichment = useEnrichment(kind === "jobs" ? [] : (view === "list" ? visible : matching).map((r) => r.sponsor.id));

  const cards: BoardCard[] =
    kind === "jobs"
      ? matchingJobs.map((saved) => ({
          id: saved.job.url,
          title: saved.job.title,
          href: saved.job.url,
          external: true,
          subtitle: `${saved.job.sponsor} · ${saved.job.location || "UK"}`,
          item: saved,
        }))
      : matching.map(({ sponsor, item }) => ({
          id: sponsor.id,
          title: sponsor.name,
          href: `/sponsors?q=${encodeURIComponent(sponsor.name)}`,
          subtitle: `${sponsor.location}${sponsor.rating ? ` · ${sponsor.rating}-rated` : ""}`,
          item,
        }));
  const move = (id: string, status: Status) => (kind === "jobs" ? updateJob(id, { status }) : update(id, { status }));
  const total = kind === "jobs" ? jobRows.length : rows.length;

  if (hydrated && Object.keys(items).length === 0 && jobRows.length === 0) {
    return (
      <main className="container max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Horus size={88} mood="sleepy" say="Wake me when you find one" />
          <h1 className="mt-5 font-display text-3xl font-semibold">Your quest log is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Save jobs and sponsors while you search, then drag them from <em>Interested</em> all the way to <em>Offer</em>.
            Every step earns XP, and Horus reminds you when to follow up. It all stays in this browser.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href="/jobs">Find jobs →</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sponsors">Browse sponsors</Link>
            </Button>
          </div>
        </div>
        <TrophyRoom />
      </main>
    );
  }

  const toggle = <T extends string,>(label: string, value: T, current: T, onChange: (v: T) => void, count?: number) => (
    <button
      key={value}
      type="button"
      aria-pressed={current === value}
      onClick={() => onChange(value)}
      className={cn(
        "flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium",
        current === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );

  return (
    <main className={cn("container px-4 py-6 sm:py-10", view === "board" ? "max-w-6xl" : "max-w-4xl")}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">My quest board</h1>
          <p className="mt-1 text-muted-foreground">Drag cards right as you progress. Saved in this browser.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Show" className="flex rounded-md border border-border bg-card p-0.5">
            {toggle("Jobs", "jobs" as Kind, kind, (k) => (setKind(k), setTab("all")), jobRows.length)}
            {toggle("Sponsors", "sponsors" as Kind, kind, (k) => (setKind(k), setTab("all")), Object.keys(items).length)}
          </div>
          <div role="group" aria-label="View" className="flex rounded-md border border-border bg-card p-0.5">
            {toggle("Board", "board" as const, view, setView)}
            {toggle("List", "list" as const, view, setView)}
          </div>
          <Button
            variant="outline"
            disabled={total === 0}
            onClick={() => {
              if (kind === "jobs") exportJobs(jobRows);
              else exportSponsors(rows, (id) => enrichment.get(id)?.website ?? "");
              emit({ type: "export" });
            }}
          >
            <DownloadIcon /> Export CSV
          </Button>
        </div>
      </header>

      <DailyQuest className="mb-6" />
      {hydrated && <DueReminders jobs={jobRows} />}

      {total > 5 && (
        <SearchBar value={query} onSearch={setQuery} placeholder={`Search your saved ${kind}`} className="mb-4" delay={100} />
      )}

      {hydrated && total === 0 ? (
        <div className="card p-8 text-center text-muted-foreground">
          {kind === "jobs" ? (
            <>
              No saved jobs yet. Hit <strong>Save</strong> on any role in{" "}
              <Link href="/jobs" className="font-medium text-primary hover:underline">
                Jobs
              </Link>
              , or tell Horus you applied after clicking Apply.
            </>
          ) : (
            <>
              No saved sponsors yet.{" "}
              <Link href="/sponsors" className="font-medium text-primary hover:underline">
                Browse sponsors
              </Link>
              .
            </>
          )}
        </div>
      ) : view === "board" ? (
        !hydrated || (kind === "sponsors" && loading && rows.length === 0) ? (
          <div className="grid grid-cols-5 gap-3" aria-hidden="true">
            {STATUSES.map((s) => (
              <div key={s} className="h-72 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <QuestBoard cards={cards} onMove={move} />
        )
      ) : (
        <>
          <div className="mb-4 -mx-4 overflow-x-auto px-4">
            <div role="tablist" aria-label="Filter by status" className="flex gap-1 border-b border-border">
              {(["all", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={tab === s}
                  onClick={() => setTab(s)}
                  className={cn(
                    "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    tab === s
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                  <span className="rounded bg-muted px-1.5 text-xs leading-5 text-muted-foreground tabular-nums">
                    {counts[s] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {kind === "jobs" ? (
              visibleJobs.length === 0 ? (
                <p className="card p-8 text-center text-muted-foreground">Nothing here yet.</p>
              ) : (
                visibleJobs.map((saved) => <JobRow key={saved.job.url} saved={saved} />)
              )
            ) : !hydrated || (loading && rows.length === 0) ? (
              Array.from({ length: 3 }, (_, i) => <CompanyCardSkeleton key={i} />)
            ) : visible.length === 0 ? (
              <p className="card p-8 text-center text-muted-foreground">Nothing here yet.</p>
            ) : (
              visible.map(({ sponsor, item }) => (
                <CompanyCard
                  key={sponsor.id}
                  sponsor={sponsor}
                  enrichment={enrichment.get(sponsor.id)}
                  pending={enrichment.isPending(sponsor.id)}
                >
                  <Note note={item.note} onSave={(note) => update(sponsor.id, { note })} />
                </CompanyCard>
              ))
            )}
          </div>
        </>
      )}

      <TrophyRoom />
    </main>
  );
}
