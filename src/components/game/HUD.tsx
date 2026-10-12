"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { levelFor } from "@/lib/game/levels";
import { ACHIEVEMENTS } from "@/lib/game/rules";
import { playSound } from "@/lib/game/fx";
import { useGame, useGameHydrated } from "@/store/useGame";
import { Horus } from "./Horus";

function Floater({ id, amount }: { id: number; amount: number }) {
  const dismiss = useGame((s) => s.dismissFloater);
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 1300);
    return () => clearTimeout(t);
  }, [id, dismiss]);
  return (
    <span className="xp-float pointer-events-none absolute -top-1 right-0 whitespace-nowrap text-xs font-semibold text-sage" aria-hidden="true">
      +{amount} XP
    </span>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-input"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

/** Level, XP bar and game settings, shown in the navigation bar. */
export function HUD() {
  const hydrated = useGameHydrated();
  const xp = useGame((s) => s.xp);
  const floaters = useGame((s) => s.floaters);
  const unlocked = useGame((s) => Object.keys(s.unlocked).length);
  const calm = useGame((s) => s.calm);
  const sound = useGame((s) => s.sound);
  const set = useGame((s) => s.set);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const level = levelFor(xp);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!hydrated) return <div className="h-8 w-[8.5rem]" aria-hidden="true" />;

  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Level ${level.index + 1}, ${level.title}, ${xp} XP. Game settings`}
        className="group relative flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2 hover:border-foreground/30"
      >
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">Lv {level.index + 1}</span>
        <span className="flex w-20 flex-col gap-1 text-left">
          <span className="truncate text-[11px] font-medium leading-none">{level.title}</span>
          <span className="h-1 overflow-hidden rounded-sm bg-muted">
            <span className="xp-bar block h-full" style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
          </span>
        </span>
        {floaters.map((f) => (
          <Floater key={f.id} {...f} />
        ))}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-72 rounded-lg border border-border bg-card p-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 px-2 pb-3">
            <Horus size={44} />
            <div className="min-w-0">
              <p className="font-display font-semibold">
                Lv {level.index + 1} · {level.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {xp.toLocaleString("en-GB")} XP{level.next !== null && ` · ${(level.next - xp).toLocaleString("en-GB")} to next level`}
              </p>
            </div>
          </div>
          <Link
            href="/saved#trophies"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            🏆 Trophy room
            <span className="text-muted-foreground">
              {unlocked}/{ACHIEVEMENTS.length}
            </span>
          </Link>
          <Toggle
            label="Sound effects"
            hint="Bleeps and bloops"
            on={sound}
            onChange={(on) => {
              set({ sound: on });
              playSound("coin", on);
            }}
          />
          <Toggle label="Calm mode" hint="No animations, confetti or sound" on={calm} onChange={(on) => set({ calm: on })} />
          <p className="px-3 pt-2 text-[11px] text-muted-foreground">Psst… the eye knows a secret code. ↑↑…</p>
        </div>
      )}
    </div>
  );
}
