"use client";

import { useEffect, useRef } from "react";
import { LEVELS } from "@/lib/game/levels";
import { confetti, playSound } from "@/lib/game/fx";
import { emit, hydrateGame, useCalm, useGame, useGameHydrated } from "@/store/useGame";
import { Horus } from "./Horus";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => dismiss(toasts[0].id), 5000);
    return () => clearTimeout(t);
  }, [toasts, dismiss]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map(({ id, achievement }) => (
        <button
          key={id}
          type="button"
          onClick={() => dismiss(id)}
          className="toast-pop pointer-events-auto flex items-center gap-3 rounded-lg border border-border border-l-4 border-l-primary bg-card p-3 text-left text-card-foreground shadow-lg"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apricot text-xl">{achievement.emoji}</span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Achievement unlocked</span>
            <span className="block font-display text-base font-semibold">{achievement.title}</span>
            <span className="block text-xs text-muted-foreground">
              {achievement.description} <strong className="font-semibold text-sage">+{achievement.xp} XP</strong>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function LevelUp() {
  const level = useGame((s) => s.levelUp);
  const dismiss = useGame((s) => s.dismissLevelUp);
  const calm = useCalm();

  useEffect(() => {
    if (level === null) return;
    const t = setTimeout(dismiss, 4200);
    return () => clearTimeout(t);
  }, [level, dismiss]);

  if (level === null) return null;
  const info = LEVELS[level];
  return (
    <div
      role="status"
      onClick={dismiss}
      className="fixed inset-0 z-[95] flex cursor-pointer items-center justify-center bg-background/80 p-6 animate-in fade-in"
    >
      <div className="levelup-card max-w-sm rounded-lg border border-border border-t-4 border-t-primary bg-card p-8 text-center shadow-lg">
        <Horus size={110} mood="party" interactive={false} />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Level up!</p>
        <p className="mt-1 font-display text-4xl font-semibold">
          <span className="text-muted-foreground">Lv {level + 1}</span> {info.title}
        </p>
        <p className="mt-3 text-muted-foreground">{info.blurb}</p>
        {!calm && <p className="mt-4 text-xs text-muted-foreground">(tap anywhere to continue)</p>}
      </div>
    </div>
  );
}

function ArcadeBanner() {
  const set = useGame((s) => s.set);
  return (
    <div className="arcade-banner fixed inset-x-0 top-0 z-[80] flex h-7 items-center justify-center gap-4 bg-foreground text-[10px] text-background">
      <span>★ A LITTLE BREAK. A FRESH START. ★</span>
      <button type="button" onClick={() => set({ arcade: false })} className="rounded border border-background/60 px-2 py-0.5 hover:bg-background hover:text-foreground">
        EXIT
      </button>
    </div>
  );
}

/** Everything global about the game: progress, toasts, level-ups, the arcade easter egg. */
export function GameLayer() {
  const calm = useCalm();
  const arcade = useGame((s) => s.arcade);
  const sound = useGame((s) => s.sound);
  const toasts = useGame((s) => s.toasts.length);
  const levelUp = useGame((s) => s.levelUp);
  const hydrated = useGameHydrated();
  const offers = useGame((s) => s.stats.offers);
  const seenOffers = useRef<number | null>(null);
  const set = useGame((s) => s.set);
  const keys = useRef<string[]>([]);

  useEffect(() => {
    hydrateGame();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("arcade", arcade && !calm);
    document.documentElement.classList.toggle("calm", calm);
  }, [arcade, calm]);

  useEffect(() => {
    if (toasts) playSound("powerup", sound);
  }, [toasts, sound]);

  // An offer is the best thing that can happen here: make it rain. Gated on the
  // rendered hydration state so the saved count isn't mistaken for a new offer
  useEffect(() => {
    if (!hydrated) return;
    if (seenOffers.current !== null && offers > seenOffers.current) {
      confetti({ calm, count: 260 });
      setTimeout(() => confetti({ calm, x: innerWidth * 0.2, count: 120 }), 250);
      setTimeout(() => confetti({ calm, x: innerWidth * 0.8, count: 120 }), 450);
    }
    seenOffers.current = offers;
  }, [hydrated, offers, calm]);

  useEffect(() => {
    if (levelUp === null) return;
    playSound("levelup", sound);
    confetti({ calm, count: 220 });
  }, [levelUp, sound, calm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current = [...keys.current, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
      if (keys.current.join() === KONAMI.join()) {
        keys.current = [];
        const on = !useGame.getState().arcade;
        set({ arcade: on });
        if (on) {
          emit({ type: "konami" });
          playSound("powerup", true);
          confetti({ calm });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [set, calm]);

  return (
    <>
      <Toasts />
      <LevelUp />
      {arcade && !calm && <ArcadeBanner />}
    </>
  );
}
