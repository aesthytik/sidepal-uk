import { describe, expect, it } from "vitest";
import { levelFor, LEVELS } from "./levels";
import { rarityOf } from "./rarity";
import { ACHIEVEMENTS, EMPTY_STATS, applyEvent, streak, type GameEvent } from "./rules";

const ctx = (claimed: string[] = [], unlocked: string[] = []) => ({
  claimed: new Set(claimed),
  unlocked: new Set(unlocked),
  now: new Date("2026-10-12T14:00:00Z"),
});

describe("levelFor", () => {
  it("starts as a Tourist", () => {
    expect(levelFor(0)).toMatchObject({ index: 0, title: "Tourist", next: 50, progress: 0 });
  });

  it("tracks progress through a level", () => {
    expect(levelFor(100)).toMatchObject({ title: "Form Filler", floor: 50, next: 150, progress: 0.5 });
  });

  it("caps at the last level", () => {
    const top = levelFor(999_999);
    expect(top.index).toBe(LEVELS.length - 1);
    expect(top).toMatchObject({ next: null, progress: 1 });
  });

  it("treats negative XP as zero", () => {
    expect(levelFor(-5).index).toBe(0);
  });
});

describe("applyEvent", () => {
  it("pays for a search once and unlocks First Steps", () => {
    const event: GameEvent = { type: "search", key: "q=monzo", hour: 12 };
    const first = applyEvent(EMPTY_STATS, event, ctx());
    expect(first.xp).toBe(5);
    expect(first.unlocked.map((a) => a.id)).toContain("first-steps");

    const again = applyEvent(first.stats, event, ctx(first.claimed, ["first-steps"]));
    expect(again.xp).toBe(0);
    expect(again.unlocked).toEqual([]);
  });

  it("can't farm status XP by flipping back and forth", () => {
    const applied = applyEvent(EMPTY_STATS, { type: "status", id: "acme", status: "applied" }, ctx());
    expect(applied.xp).toBe(50);
    const back = applyEvent(applied.stats, { type: "status", id: "acme", status: "applied" }, ctx(applied.claimed));
    expect(back.xp).toBe(0);
  });

  it("celebrates an offer with the Golden Ticket", () => {
    const out = applyEvent(EMPTY_STATS, { type: "status", id: "acme", status: "offer" }, ctx());
    expect(out.xp).toBe(500);
    expect(out.unlocked.map((a) => a.id)).toContain("golden-ticket");
  });

  it("counts a respawn when a sponsor leaves the graveyard", () => {
    const out = applyEvent(EMPTY_STATS, { type: "status", id: "acme", status: "interested", from: "rejected" }, ctx());
    expect(out.stats.respawns).toBe(1);
    expect(out.unlocked.map((a) => a.id)).toContain("phoenix");
  });

  it("collects distinct places for Globetrotter", () => {
    let stats = EMPTY_STATS;
    let unlocked: string[] = [];
    for (const place of ["London", "london", "Leeds", "Bristol", "Glasgow", "Cardiff"]) {
      const out = applyEvent(stats, { type: "search", key: place, location: place, hour: 12 }, ctx([], unlocked));
      stats = out.stats;
      unlocked = [...unlocked, ...out.unlocked.map((a) => a.id)];
    }
    expect(stats.locations).toEqual(["london", "leeds", "bristol", "glasgow", "cardiff"]);
    expect(unlocked).toContain("globetrotter");
  });

  it("spots night owls", () => {
    expect(applyEvent(EMPTY_STATS, { type: "search", key: "x", hour: 2 }, ctx()).stats.nightOwl).toBe(true);
    expect(applyEvent(EMPTY_STATS, { type: "search", key: "x", hour: 9 }, ctx()).stats.nightOwl).toBe(false);
  });

  it("converts game score to capped XP and keeps the best score", () => {
    const out = applyEvent({ ...EMPTY_STATS, bestScore: 1500 }, { type: "game", score: 5000 }, ctx());
    expect(out.xp).toBe(150);
    expect(out.stats.bestScore).toBe(5000);
  });

  it("pays for a complete profile once and unlocks Know Thyself", () => {
    const first = applyEvent(EMPTY_STATS, { type: "profile" }, ctx());
    expect(first.xp).toBe(50);
    expect(first.unlocked.map((a) => a.id)).toContain("know-thyself");
    expect(applyEvent(first.stats, { type: "profile" }, ctx(first.claimed, ["know-thyself"])).xp).toBe(0);
  });

  it("unlocks Perfect Match only for a 90+ match", () => {
    const ok = applyEvent(EMPTY_STATS, { type: "match-open", score: 75 }, ctx());
    expect(ok.unlocked.map((a) => a.id)).not.toContain("perfect-match");
    const perfect = applyEvent(ok.stats, { type: "match-open", score: 93 }, ctx());
    expect(perfect.stats.bestMatch).toBe(93);
    expect(perfect.unlocked.map((a) => a.id)).toContain("perfect-match");
  });

  it("pays once per reminder and unlocks Politely Persistent after 5", () => {
    let stats = EMPTY_STATS;
    let claimed: string[] = [];
    let unlocked: string[] = [];
    for (const id of ["a", "a", "b", "c", "d", "e"]) {
      const out = applyEvent(stats, { type: "follow-up", id }, ctx(claimed, unlocked));
      stats = out.stats;
      claimed = [...claimed, ...out.claimed];
      unlocked = [...unlocked, ...out.unlocked.map((a) => a.id)];
    }
    expect(claimed.filter((k) => k.startsWith("follow-up:"))).toHaveLength(5);
    expect(unlocked).toContain("persistent");
  });

  it("records the active day once", () => {
    const a = applyEvent(EMPTY_STATS, { type: "poke" }, ctx());
    const b = applyEvent(a.stats, { type: "poke" }, ctx());
    expect(b.stats.days).toEqual(["2026-10-12"]);
  });
});

describe("streak", () => {
  const today = new Date("2026-10-12T10:00:00Z");
  it("counts consecutive days ending today", () => {
    expect(streak(["2026-10-10", "2026-10-11", "2026-10-12"], today)).toBe(3);
  });
  it("still counts a streak that ended yesterday", () => {
    expect(streak(["2026-10-10", "2026-10-11"], today)).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(streak(["2026-10-08", "2026-10-12"], today)).toBe(1);
  });
});

describe("achievements", () => {
  it("have unique ids", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("rarityOf", () => {
  const jobs = (total: number, uk: number, matching?: number) => ({ jobs: { provider: "lever" as const, total, uk, matching, top: [] } });
  it("ranks sponsors as loot", () => {
    expect(rarityOf({ rating: "B" }, jobs(10, 10, 5))).toBe("common");
    expect(rarityOf({ rating: "A" })).toBe("rare");
    expect(rarityOf({ rating: "A (SME+)" }, jobs(0, 0))).toBe("rare");
    expect(rarityOf({ rating: "A" }, jobs(4, 0))).toBe("epic");
    expect(rarityOf({ rating: "A" }, jobs(4, 2))).toBe("epic");
    expect(rarityOf({ rating: "A" }, jobs(4, 2, 1))).toBe("legendary");
  });
});
