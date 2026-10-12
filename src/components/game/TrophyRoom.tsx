"use client";

import { levelFor, LEVELS } from "@/lib/game/levels";
import { ACHIEVEMENTS, streak } from "@/lib/game/rules";
import { cn } from "@/lib/utils";
import { useGame, useGameHydrated } from "@/store/useGame";
import { Horus } from "./Horus";

/** Your level, stats and every achievement, locked ones as mysteries. */
export function TrophyRoom() {
  const hydrated = useGameHydrated();
  const xp = useGame((s) => s.xp);
  const unlocked = useGame((s) => s.unlocked);
  const stats = useGame((s) => s.stats);
  if (!hydrated) return null;

  const level = levelFor(xp);
  const got = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <section id="trophies" aria-labelledby="trophies-title" className="mt-14 scroll-mt-24">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-gradient-to-r from-primary to-[#7c3aed] p-6 text-white">
          <Horus size={64} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
              Level {level.index + 1} of {LEVELS.length}
            </p>
            <p className="font-display text-3xl font-bold">{level.title}</p>
            <p className="text-sm text-white/80">{level.blurb}</p>
            <div className="mt-3 h-3 max-w-md overflow-hidden rounded-full bg-white/20">
              <div className="xp-bar h-full rounded-full" style={{ width: `${Math.max(3, level.progress * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-white/70">
              {xp.toLocaleString("en-GB")} XP
              {level.next !== null ? ` · ${(level.next - xp).toLocaleString("en-GB")} XP to ${LEVELS[level.index + 1].title}` : " · max level, you absolute legend"}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            {[
              ["🔥", streak(stats.days), "day streak"],
              ["📨", stats.applied, "applied"],
              ["🕹️", stats.bestScore.toLocaleString("en-GB"), "best score"],
            ].map(([emoji, value, label]) => (
              <div key={label as string}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold">
                  <span aria-hidden="true">{emoji}</span> {value}
                </dd>
                <dd className="text-[11px] uppercase tracking-wider text-white/70">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-6">
          <h2 id="trophies-title" className="font-display text-2xl font-bold">
            🏆 Trophy room <span className="text-muted-foreground">{got}/{ACHIEVEMENTS.length}</span>
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ACHIEVEMENTS.map((a) => {
              const has = Boolean(unlocked[a.id]);
              return (
                <li
                  key={a.id}
                  className={cn(
                    "rounded-2xl border p-3 transition-transform",
                    has ? "border-lemon/70 bg-lemon/10 hover:-rotate-2 hover:scale-105" : "border-dashed border-border opacity-60"
                  )}
                >
                  <p className={cn("text-3xl", !has && "grayscale")} aria-hidden="true">
                    {has ? a.emoji : "🔒"}
                  </p>
                  <p className="mt-1 text-sm font-bold">{has ? a.title : "???"}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <p className="mt-1 text-[11px] font-semibold text-mint">
                    {has ? `Unlocked ${new Date(unlocked[a.id]).toLocaleDateString("en-GB")}` : `+${a.xp} XP`}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
