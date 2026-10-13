/**
 * The rules of the Horus game, kept pure so they can be tested: which events
 * earn XP, and which achievements a set of stats unlocks.
 */

export type GameEvent =
  | { type: "search"; key: string; location?: string; ratingA?: boolean; hour?: number }
  | { type: "fuzzy" }
  | { type: "zero-results" }
  | { type: "load-more" }
  | { type: "save"; id: string }
  | { type: "unsave"; id: string }
  | { type: "status"; id: string; status: string; from?: string }
  | { type: "note"; id: string }
  | { type: "apply-click"; url: string }
  | { type: "careers-click"; url: string }
  | { type: "export" }
  | { type: "game"; score: number }
  | { type: "profile" }
  | { type: "follow-up"; id: string }
  | { type: "tailor"; id: string }
  | { type: "quest"; day: string; streak: number }
  | { type: "match-open"; score: number }
  | { type: "konami" }
  | { type: "poke" };

export interface GameStats {
  searches: number;
  locations: string[]; // Distinct places searched, lower-cased
  ratingA: boolean;
  nightOwl: boolean;
  fuzzy: number;
  loadMore: number;
  saves: number; // Total ever saved
  applied: number;
  interviewing: number;
  offers: number;
  respawns: number; // Moved out of Rejected
  notes: number;
  exports: number;
  applyClicks: number;
  bestScore: number;
  games: number;
  konami: boolean;
  pokes: number;
  profile: boolean; // Filled in a complete profile
  bestMatch: number; // Highest match score of a job opened
  followUps: number; // Reminders marked done
  tailored: number; // Applications tailored with AI
  quests: number; // Daily quests completed
  bestQuestStreak: number; // Longest run of consecutive daily quests
  days: string[]; // Distinct active days (YYYY-MM-DD), newest last, capped
}

export const EMPTY_STATS: GameStats = {
  searches: 0,
  locations: [],
  ratingA: false,
  nightOwl: false,
  fuzzy: 0,
  loadMore: 0,
  saves: 0,
  applied: 0,
  interviewing: 0,
  offers: 0,
  respawns: 0,
  notes: 0,
  exports: 0,
  applyClicks: 0,
  bestScore: 0,
  games: 0,
  konami: false,
  pokes: 0,
  profile: false,
  bestMatch: 0,
  followUps: 0,
  tailored: 0,
  quests: 0,
  bestQuestStreak: 0,
  days: [],
};

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  unlocked: (s: GameStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", emoji: "👣", title: "First Steps", description: "Ran your first search.", xp: 10, unlocked: (s) => s.searches >= 1 },
  { id: "typo-survivor", emoji: "🩹", title: "Typo Survivor", description: "Misspelt a company and Horus found it anyway.", xp: 20, unlocked: (s) => s.fuzzy >= 1 },
  { id: "a-team", emoji: "🅰️", title: "The A-Team", description: "Filtered for A-rated sponsors only.", xp: 15, unlocked: (s) => s.ratingA },
  { id: "globetrotter", emoji: "🌍", title: "Globetrotter", description: "Searched 5 different places.", xp: 30, unlocked: (s) => s.locations.length >= 5 },
  { id: "night-owl", emoji: "🦉", title: "Night Owl", description: "Job hunting between midnight and 5am. Go to bed. (After this one.)", xp: 15, unlocked: (s) => s.nightOwl },
  { id: "deep-diver", emoji: "🤿", title: "Deep Diver", description: "Loaded more results 5 times.", xp: 20, unlocked: (s) => s.loadMore >= 5 },
  { id: "finders-keepers", emoji: "🔖", title: "Finders Keepers", description: "Saved your first sponsor.", xp: 15, unlocked: (s) => s.saves >= 1 },
  { id: "hoarder", emoji: "🐉", title: "Dragon's Hoard", description: "Saved 25 sponsors.", xp: 60, unlocked: (s) => s.saves >= 25 },
  { id: "first-blood", emoji: "📨", title: "First Blood", description: "Marked your first application as sent.", xp: 40, unlocked: (s) => s.applied >= 1 },
  { id: "serial-applier", emoji: "🚀", title: "Serial Applier", description: "Sent 10 applications.", xp: 80, unlocked: (s) => s.applied >= 10 },
  { id: "the-callback", emoji: "📞", title: "The Callback", description: "Landed an interview.", xp: 100, unlocked: (s) => s.interviewing >= 1 },
  { id: "golden-ticket", emoji: "🎫", title: "Golden Ticket", description: "Got an offer. Absolute legend.", xp: 300, unlocked: (s) => s.offers >= 1 },
  { id: "phoenix", emoji: "🐦‍🔥", title: "Phoenix", description: "Brought a rejected sponsor back from the graveyard.", xp: 30, unlocked: (s) => s.respawns >= 1 },
  { id: "scribe", emoji: "📜", title: "Scribe", description: "Wrote 5 notes.", xp: 25, unlocked: (s) => s.notes >= 5 },
  { id: "spreadsheet-wizard", emoji: "🧙", title: "Spreadsheet Wizard", description: "Exported your shortlist.", xp: 20, unlocked: (s) => s.exports >= 1 },
  { id: "know-thyself", emoji: "🪞", title: "Know Thyself", description: "Filled in your profile so Horus can match you.", xp: 40, unlocked: (s) => s.profile },
  { id: "perfect-match", emoji: "💘", title: "Perfect Match", description: "Opened a job that's a 90%+ match for you.", xp: 60, unlocked: (s) => s.bestMatch >= 90 },
  { id: "persistent", emoji: "🔁", title: "Politely Persistent", description: "Followed up on 5 reminders. Recruiters notice.", xp: 50, unlocked: (s) => s.followUps >= 5 },
  { id: "tailor-made", emoji: "🧵", title: "Tailor-Made", description: "Tailored your CV and cover letter to a job.", xp: 40, unlocked: (s) => s.tailored >= 1 },
  { id: "daily-driver", emoji: "🎯", title: "Daily Driver", description: "Completed your first daily quest.", xp: 30, unlocked: (s) => s.quests >= 1 },
  { id: "quest-week", emoji: "📅", title: "Quest Week", description: "Completed the daily quest 7 days in a row.", xp: 150, unlocked: (s) => s.bestQuestStreak >= 7 },
  { id: "streak-3", emoji: "🔥", title: "On Fire", description: "Came back 3 days in a row.", xp: 50, unlocked: (s) => streak(s.days) >= 3 },
  { id: "stamp-champ", emoji: "🏅", title: "Stamp Champ", description: "Scored 1,000+ in Stamp Rush.", xp: 50, unlocked: (s) => s.bestScore >= 1000 },
  { id: "eye-poker", emoji: "👉", title: "Eye Poker", description: "Poked Horus in the eye 10 times. He forgives you.", xp: 10, unlocked: (s) => s.pokes >= 10 },
  { id: "konami", emoji: "🕹️", title: "↑↑↓↓←→←→BA", description: "Found the secret arcade.", xp: 77, unlocked: (s) => s.konami },
];

const STATUS_XP: Record<string, number> = { applied: 50, interviewing: 150, offer: 500, rejected: 10, interested: 0 };

/** How many consecutive days, ending today or yesterday, appear in `days`. */
export function streak(days: string[], today = new Date()): number {
  const set = new Set(days);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const key = () => d.toISOString().slice(0, 10);
  if (!set.has(key())) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(key())) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export interface Outcome {
  stats: GameStats;
  xp: number; // XP for the event itself
  claimed: string[]; // One-off reward keys this event used up
  unlocked: Achievement[]; // Newly unlocked achievements (their XP is extra)
}

/**
 * Applies one event. `claimed` holds one-off reward keys already paid out, so
 * flipping a status back and forth or repeating a search can't farm XP.
 */
export function applyEvent(
  stats: GameStats,
  event: GameEvent,
  ctx: { claimed: ReadonlySet<string>; unlocked: ReadonlySet<string>; now?: Date }
): Outcome {
  const now = ctx.now ?? new Date();
  const s: GameStats = { ...stats, locations: [...stats.locations], days: [...stats.days] };
  const claimed: string[] = [];
  let xp = 0;
  const once = (key: string, amount: number) => {
    if (ctx.claimed.has(key) || claimed.includes(key)) return;
    claimed.push(key);
    xp += amount;
  };

  const today = now.toISOString().slice(0, 10);
  if (s.days[s.days.length - 1] !== today) s.days = [...s.days.filter((d) => d !== today), today].slice(-30);

  switch (event.type) {
    case "search": {
      s.searches++;
      const place = event.location?.trim().toLowerCase();
      if (place && !s.locations.includes(place)) s.locations = [...s.locations, place].slice(-50);
      if (event.ratingA) s.ratingA = true;
      const hour = event.hour ?? now.getHours();
      if (hour >= 0 && hour < 5) s.nightOwl = true;
      once(`search:${event.key}`, 5);
      break;
    }
    case "fuzzy":
      s.fuzzy++;
      break;
    case "load-more":
      s.loadMore++;
      xp += 2;
      break;
    case "save":
      s.saves++;
      once(`save:${event.id}`, 20);
      break;
    case "status": {
      if (event.status === "applied") s.applied++;
      if (event.status === "interviewing") s.interviewing++;
      if (event.status === "offer") s.offers++;
      if (event.from === "rejected" && event.status !== "rejected") s.respawns++;
      once(`status:${event.status}:${event.id}`, STATUS_XP[event.status] ?? 0);
      break;
    }
    case "note":
      s.notes++;
      once(`note:${event.id}`, 10);
      break;
    case "apply-click":
      s.applyClicks++;
      once(`apply:${event.url}`, 15);
      break;
    case "careers-click":
      once(`careers:${event.url}`, 10);
      break;
    case "export":
      s.exports++;
      xp += s.exports === 1 ? 25 : 0;
      break;
    case "game":
      s.games++;
      s.bestScore = Math.max(s.bestScore, event.score);
      xp += Math.min(150, Math.floor(event.score / 10));
      break;
    case "profile":
      s.profile = true;
      once("profile", 50);
      break;
    case "follow-up":
      s.followUps++;
      once(`follow-up:${event.id}`, 15);
      break;
    case "quest":
      if (ctx.claimed.has(`quest:${event.day}`)) break;
      s.quests++;
      s.bestQuestStreak = Math.max(s.bestQuestStreak, event.streak);
      once(`quest:${event.day}`, 50 + 10 * Math.min(event.streak - 1, 5)); // Longer streaks pay a little more
      break;
    case "tailor":
      s.tailored++;
      once(`tailor:${event.id}`, 30);
      break;
    case "match-open":
      s.bestMatch = Math.max(s.bestMatch, event.score);
      break;
    case "konami":
      s.konami = true;
      break;
    case "poke":
      s.pokes++;
      break;
  }

  const unlocked = ACHIEVEMENTS.filter((a) => !ctx.unlocked.has(a.id) && a.unlocked(s));
  return { stats: s, xp, claimed, unlocked };
}
