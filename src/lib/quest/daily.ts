import { addDays } from "../tracker/reminders";

/**
 * The daily quest: three good matches picked for the user each day. Apply to any one of
 * them to complete the day and keep the streak going. Kept pure so it can be tested.
 */

export const QUEST_SIZE = 3;
export const MIN_SCORE = 50; // Below this a job isn't a "match"
const POOL = 15; // Picks come from the best this-many candidates

export interface Candidate {
  url: string;
  sponsorId: string;
  score: number;
}

/** A small deterministic PRNG, so the same day always gives the same picks. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Today's picks from candidates ranked best first. Same day and candidates give the same
 * picks; `exclude` (saved or skipped jobs) is left out, and each pick is from a different
 * employer where possible.
 */
export function pickDaily(candidates: Candidate[], day: string, exclude: ReadonlySet<string> = new Set(), count = QUEST_SIZE): string[] {
  const pool = candidates.filter((c) => c.score >= MIN_SCORE && !exclude.has(c.url)).slice(0, POOL);
  const random = seeded(day);
  // Weighted towards better matches: sort by score scaled by a random factor
  const order = pool.map((c) => ({ c, key: c.score * (0.75 + random() * 0.5) })).sort((a, b) => b.key - a.key);
  const picks: Candidate[] = [];
  for (const { c } of order) {
    if (picks.length === count) break;
    if (!picks.some((p) => p.sponsorId === c.sponsorId)) picks.push(c);
  }
  // Not enough different employers: fill with the best of the rest
  for (const { c } of order) {
    if (picks.length === count) break;
    if (!picks.includes(c)) picks.push(c);
  }
  return picks.map((p) => p.url);
}

/** Consecutive completed days ending today, or yesterday if today isn't done yet. */
export function questStreak(days: readonly string[], today: string): number {
  const done = new Set(days);
  let day = done.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (done.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
