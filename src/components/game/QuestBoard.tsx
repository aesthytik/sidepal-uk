"use client";

import { useState } from "react";
import Link from "next/link";
import type { Sponsor } from "@/lib/sponsorTypes";
import { cn } from "@/lib/utils";
import { confetti } from "@/lib/game/fx";
import { STATUSES, STATUS_LABELS, type ShortlistItem, type Status, useShortlist } from "@/store/useShortlist";
import { useCalm } from "@/store/useGame";

const COLUMNS: Record<Status, { emoji: string; title: string; empty: string; tone: string }> = {
  interested: { emoji: "🗺️", title: "Quest log", empty: "Drag sponsors you like here", tone: "border-t-aqua" },
  applied: { emoji: "📨", title: "Sent into the void", empty: "Applied? Drop it here. +50 XP", tone: "border-t-primary" },
  interviewing: { emoji: "⚔️", title: "Boss fight", empty: "Interviews go here. +150 XP", tone: "border-t-coral" },
  offer: { emoji: "🏆", title: "Victory!", empty: "The dream column. +500 XP", tone: "border-t-lemon" },
  rejected: { emoji: "🪦", title: "Graveyard", empty: "No shame. Drag back out to respawn", tone: "border-t-muted-foreground" },
};

function QuestCard({ sponsor, item }: { sponsor: Sponsor; item: ShortlistItem }) {
  const update = useShortlist((s) => s.update);
  const [dragging, setDragging] = useState(false);
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", sponsor.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "card cursor-grab p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        dragging && "rotate-3 opacity-50",
        item.status === "rejected" && "opacity-70 grayscale"
      )}
    >
      <Link href={`/sponsors?q=${encodeURIComponent(sponsor.name)}`} className="block font-semibold leading-snug hover:underline">
        {sponsor.name}
      </Link>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {sponsor.location}
        {sponsor.rating && ` · ${sponsor.rating}-rated`}
      </p>
      {item.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">📝 {item.note}</p>}
      <select
        aria-label={`Status for ${sponsor.name}`}
        value={item.status}
        onChange={(e) => update(sponsor.id, { status: e.target.value as Status })}
        className="mt-2 h-8 w-full rounded-lg border border-input bg-card px-2 text-xs"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            Move to: {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </li>
  );
}

/** The shortlist as a Kanban board: drag sponsors right as your applications progress. */
export function QuestBoard({ rows }: { rows: { sponsor: Sponsor; item: ShortlistItem }[] }) {
  const update = useShortlist((s) => s.update);
  const calm = useCalm();
  const [over, setOver] = useState<Status | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4">
      <div className="grid min-w-[56rem] grid-cols-5 gap-3">
        {STATUSES.map((status) => {
          const col = COLUMNS[status];
          const cards = rows.filter((r) => r.item.status === status);
          return (
            <section
              key={status}
              aria-label={`${STATUS_LABELS[status]} (${cards.length})`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (!id) return;
                update(id, { status });
                if (status === "offer") confetti({ x: e.clientX, y: e.clientY, calm, count: 80 });
              }}
              className={cn("flex min-h-[18rem] flex-col rounded-2xl border border-t-4 border-border/70 bg-muted/40 p-2 transition-colors", col.tone, over === status && "quest-drop")}
            >
              <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                <h2 className="text-sm font-bold">
                  <span aria-hidden="true">{col.emoji}</span> {col.title}
                </h2>
                <span className="rounded-full bg-card px-2 text-xs font-semibold leading-5">{cards.length}</span>
              </header>
              {cards.length === 0 ? (
                <p className="m-1 flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  {col.empty}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cards.map((r) => (
                    <QuestCard key={r.sponsor.id} {...r} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
