/** Titles earned on the way to a sponsored job, and the XP each one starts at. */
export const LEVELS = [
  { title: "Tourist", xp: 0, blurb: "Just browsing the realm." },
  { title: "Form Filler", xp: 50, blurb: "You've seen the paperwork. You were not scared." },
  { title: "CV Polisher", xp: 150, blurb: "Bullet points so sharp they could cut red tape." },
  { title: "Sponsor Hunter", xp: 350, blurb: "Licensed employers fear and respect you." },
  { title: "Interview Ninja", xp: 700, blurb: "Tell me about a time you were awesome. Every time." },
  { title: "Offer Magnet", xp: 1200, blurb: "Recruiters slide into your inbox uninvited." },
  { title: "Golden Visa Holder", xp: 2000, blurb: "Legend. The Home Office knows your name (in a good way)." },
] as const;

export interface LevelInfo {
  index: number;
  title: string;
  blurb: string;
  floor: number; // XP the current level started at
  next: number | null; // XP needed for the next level, null at max level
  progress: number; // 0..1 through the current level
}

export function levelFor(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (safe >= LEVELS[i].xp) index = i;
  const level = LEVELS[index];
  const next = LEVELS[index + 1]?.xp ?? null;
  return {
    index,
    title: level.title,
    blurb: level.blurb,
    floor: level.xp,
    next,
    progress: next === null ? 1 : (safe - level.xp) / (next - level.xp),
  };
}
