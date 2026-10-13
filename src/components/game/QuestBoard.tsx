"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { confetti } from "@/lib/game/fx";
import { dueState } from "@/lib/tracker/reminders";
import { STATUSES, STATUS_LABELS, type ShortlistItem, type Status } from "@/store/useShortlist";
import { useCalm } from "@/store/useGame";

const COLUMNS: Record<Status, { emoji: string; title: string; empty: string; tone: string }> = {
  interested: { emoji: "🗺️", title: "Quest log", empty: "Drag what you like here", tone: "border-t-sage" },
  applied: { emoji: "📨", title: "Sent into the void", empty: "Applied? Drop it here. +50 XP", tone: "border-t-primary" },
  interviewing: { emoji: "⚔️", title: "Boss fight", empty: "Interviews go here. +150 XP", tone: "border-t-clay" },
  offer: { emoji: "🏆", title: "Victory!", empty: "The dream column. +500 XP", tone: "border-t-gold" },
  rejected: { emoji: "🪦", title: "Graveyard", empty: "No shame. Drag back out to respawn", tone: "border-t-muted-foreground" },
};

/** One sponsor or job on the board. */
export interface BoardCard {
  id: string;
  title: string;
  href: string;
  external?: boolean; // Job ads open in a new tab
  subtitle: string;
  item: ShortlistItem & { followUp?: string };
}

const DUE_LABEL = { overdue: "⏰ Follow-up overdue", today: "⏰ Follow up today", soon: "Follow up soon", later: null };

function QuestCard({ card, onMove }: { card: BoardCard; onMove: (id: string, status: Status) => void }) {
  const [dragging, setDragging] = useState(false);
  const { item } = card;
  const due = dueState(item.followUp);
  const dueLabel = due && DUE_LABEL[due];
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "card cursor-grab p-3 text-sm transition-colors hover:border-foreground/30 active:cursor-grabbing",
        dragging && "opacity-50",
        item.status === "rejected" && "opacity-70 grayscale"
      )}
    >
      {card.external ? (
        <a href={card.href} target="_blank" rel="noopener noreferrer" className="block font-semibold leading-snug hover:underline">
          {card.title}
        </a>
      ) : (
        <Link href={card.href} className="block font-semibold leading-snug hover:underline">
          {card.title}
        </Link>
      )}
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.subtitle}</p>
      {dueLabel && (
        <p className={cn("mt-1.5 text-xs font-medium", due === "soon" ? "text-muted-foreground" : "text-clay")}>{dueLabel}</p>
      )}
      {item.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">📝 {item.note}</p>}
      <select
        aria-label={`Status for ${card.title}`}
        value={item.status}
        onChange={(e) => onMove(card.id, e.target.value as Status)}
        className="mt-2 h-8 w-full rounded-md border border-input bg-card px-2 text-xs"
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

/** Saved sponsors or jobs as a Kanban board: drag them right as your applications progress. */
export function QuestBoard({ cards, onMove }: { cards: BoardCard[]; onMove: (id: string, status: Status) => void }) {
  const calm = useCalm();
  const [over, setOver] = useState<Status | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4">
      <div className="grid min-w-[56rem] grid-cols-5 gap-3">
        {STATUSES.map((status) => {
          const col = COLUMNS[status];
          const column = cards.filter((c) => c.item.status === status);
          return (
            <section
              key={status}
              aria-label={`${STATUS_LABELS[status]} (${column.length})`}
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
                onMove(id, status);
                if (status === "offer") confetti({ x: e.clientX, y: e.clientY, calm, count: 80 });
              }}
              className={cn("flex min-h-[18rem] flex-col rounded-lg border border-t-2 border-border bg-muted/40 p-2 transition-colors", col.tone, over === status && "quest-drop")}
            >
              <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                <h2 className="text-sm font-semibold">
                  <span aria-hidden="true">{col.emoji}</span> {col.title}
                </h2>
                <span className="rounded bg-card px-1.5 text-xs font-medium leading-5 tabular-nums">{column.length}</span>
              </header>
              {column.length === 0 ? (
                <p className="m-1 flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  {col.empty}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {column.map((c) => (
                    <QuestCard key={c.id} card={c} onMove={onMove} />
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
