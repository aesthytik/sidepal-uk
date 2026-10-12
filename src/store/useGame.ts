import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { levelFor } from "@/lib/game/levels";
import { type Achievement, EMPTY_STATS, type GameEvent, type GameStats, applyEvent } from "@/lib/game/rules";

export type Mood = "curious" | "delighted" | "shocked" | "sleepy" | "dizzy" | "party";

export interface Toast {
  id: number;
  achievement: Achievement;
}

interface Floater {
  id: number;
  amount: number;
}

interface GameState {
  // Persisted
  xp: number;
  stats: GameStats;
  claimed: string[];
  unlocked: Record<string, string>; // achievement id -> ISO time
  calm: boolean;
  sound: boolean;
  // Session only
  arcade: boolean;
  mood: Mood;
  moodAt: number;
  toasts: Toast[];
  floaters: Floater[];
  levelUp: number | null; // Level index just reached

  record: (event: GameEvent) => void;
  setMood: (mood: Mood) => void;
  dismissToast: (id: number) => void;
  dismissFloater: (id: number) => void;
  dismissLevelUp: () => void;
  set: (changes: Partial<Pick<GameState, "calm" | "sound" | "arcade">>) => void;
}

const MAX_CLAIMED = 3000;
let nextId = 1;

/** Moods some events put Horus in. */
function moodFor(event: GameEvent): Mood | null {
  switch (event.type) {
    case "zero-results":
      return "shocked";
    case "status":
      return event.status === "offer" ? "party" : event.status === "rejected" ? "shocked" : "delighted";
    case "save":
    case "fuzzy":
    case "apply-click":
      return "delighted";
    case "konami":
      return "party";
    default:
      return null;
  }
}

/**
 * The game layer: XP, achievements and the mascot's mood. Stored in its own
 * localStorage key so the shortlist's data is never touched. Hydrated after
 * mount by GameLayer; events that happen earlier are queued (see `emit`).
 */
export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      stats: EMPTY_STATS,
      claimed: [],
      unlocked: {},
      calm: false,
      sound: false,
      arcade: false,
      mood: "curious",
      moodAt: 0,
      toasts: [],
      floaters: [],
      levelUp: null,

      record(event) {
        const state = get();
        const out = applyEvent(state.stats, event, {
          claimed: new Set(state.claimed),
          unlocked: new Set(Object.keys(state.unlocked)),
        });
        const bonus = out.unlocked.reduce((sum, a) => sum + a.xp, 0);
        const gained = out.xp + bonus;
        const before = levelFor(state.xp).index;
        const after = levelFor(state.xp + gained).index;
        const now = new Date().toISOString();
        const mood = after > before ? "party" : moodFor(event) ?? (gained > 0 ? "delighted" : null);

        set({
          stats: out.stats,
          xp: state.xp + gained,
          claimed: out.claimed.length ? [...state.claimed, ...out.claimed].slice(-MAX_CLAIMED) : state.claimed,
          unlocked: out.unlocked.length
            ? { ...state.unlocked, ...Object.fromEntries(out.unlocked.map((a) => [a.id, now])) }
            : state.unlocked,
          toasts: [...state.toasts, ...out.unlocked.map((achievement) => ({ id: nextId++, achievement }))].slice(-4),
          floaters: gained > 0 ? [...state.floaters, { id: nextId++, amount: gained }].slice(-5) : state.floaters,
          levelUp: after > before ? after : state.levelUp,
          ...(mood && { mood, moodAt: Date.now() }),
        });
      },
      setMood: (mood) => set({ mood, moodAt: Date.now() }),
      dismissToast: (id) => set(({ toasts }) => ({ toasts: toasts.filter((t) => t.id !== id) })),
      dismissFloater: (id) => set(({ floaters }) => ({ floaters: floaters.filter((f) => f.id !== id) })),
      dismissLevelUp: () => set({ levelUp: null }),
      set: (changes) => set(changes),
    }),
    {
      name: "horus-game",
      version: 1,
      skipHydration: true,
      partialize: ({ xp, stats, claimed, unlocked, calm, sound }) => ({ xp, stats, claimed, unlocked, calm, sound }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return { ...current, ...p, stats: { ...EMPTY_STATS, ...p.stats } };
      },
    }
  )
);

const queue: GameEvent[] = [];

/** Records a game event. Safe to call before hydration: events wait in a queue. */
export function emit(event: GameEvent) {
  if (typeof window === "undefined") return;
  if (useGame.persist.hasHydrated()) useGame.getState().record(event);
  else queue.push(event);
}

/** Reads saved progress, then replays anything that happened before it loaded. */
export async function hydrateGame() {
  await useGame.persist.rehydrate();
  for (const event of queue.splice(0)) useGame.getState().record(event);
}

export function useGameHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGame.persist.onFinishHydration(onChange),
    () => useGame.persist.hasHydrated(),
    () => false
  );
}

/** True when animation should be toned down: Calm mode or the OS reduced-motion setting. */
export function useCalm(): boolean {
  const calm = useGame((s) => s.calm);
  const reduced = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
  return calm || reduced;
}
