"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompanyCard, CompanyCardSkeleton } from "@/components/CompanyCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, DownloadIcon } from "@/components/ui/icons";
import type { Sponsor } from "@/lib/sponsorTypes";
import { useEnrichment } from "@/lib/useEnrichment";
import { cn } from "@/lib/utils";
import {
  STATUSES,
  STATUS_LABELS,
  type ShortlistItem,
  type Status,
  useShortlist,
  useShortlistHydrated,
} from "@/store/useShortlist";

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function exportCsv(rows: { sponsor: Sponsor; item: ShortlistItem }[], websites: (id: string) => string) {
  const header = ["Company", "Location", "Rating", "Visa routes", "Status", "Saved", "Note", "Website"];
  const lines = rows.map(({ sponsor, item }) =>
    [
      sponsor.name,
      sponsor.location,
      sponsor.rating,
      sponsor.visaTypes.join("; "),
      STATUS_LABELS[item.status],
      item.savedAt.slice(0, 10),
      item.note ?? "",
      websites(sponsor.id),
    ]
      .map(csvCell)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `horus-shortlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Note({ id, note }: { id: string; note?: string }) {
  const update = useShortlist((s) => s.update);
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
            update(id, { note: text.trim() || undefined });
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

export function Shortlist() {
  const hydrated = useShortlistHydrated();
  const items = useShortlist((s) => s.items);
  const [sponsors, setSponsors] = useState<Record<string, Sponsor>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");

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

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const { item } of rows) c[item.status] = (c[item.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = rows.filter(
    ({ sponsor, item }) =>
      (tab === "all" || item.status === tab) &&
      (!query.trim() || `${sponsor.name} ${sponsor.location}`.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const enrichment = useEnrichment(visible.map((r) => r.sponsor.id));

  if (hydrated && Object.keys(items).length === 0) {
    return (
      <main className="container max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <BookmarkIcon width={24} height={24} />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Your shortlist is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Save sponsors while you search, then track each one from <em>Interested</em> to <em>Offer</em>. Your
          shortlist stays in this browser.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/sponsors">Find sponsors</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My shortlist</h1>
          <p className="mt-1 text-muted-foreground">Track where you are with each sponsor. Saved in this browser.</p>
        </div>
        <Button
          variant="outline"
          disabled={rows.length === 0}
          onClick={() => exportCsv(rows, (id) => enrichment.get(id)?.website ?? "")}
        >
          <DownloadIcon /> Export CSV
        </Button>
      </header>

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
              <span className="rounded-full bg-muted px-1.5 text-xs leading-5 text-muted-foreground">
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {rows.length > 5 && (
        <SearchBar value={query} onSearch={setQuery} placeholder="Search your shortlist" className="mb-4" delay={100} />
      )}

      <div className="space-y-4">
        {!hydrated || (loading && rows.length === 0) ? (
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
              <Note id={sponsor.id} note={item.note} />
            </CompanyCard>
          ))
        )}
      </div>
    </main>
  );
}
