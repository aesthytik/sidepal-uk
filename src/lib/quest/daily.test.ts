import { describe, expect, it } from "vitest";
import { type Candidate, pickDaily, questStreak } from "./daily";

const c = (n: number, sponsor = `s${n}`, score = 90 - n): Candidate => ({ url: `https://j/${n}`, sponsorId: sponsor, score });
const ranked = Array.from({ length: 20 }, (_, i) => c(i));

describe("pickDaily", () => {
  it("picks three, the same ones all day", () => {
    const a = pickDaily(ranked, "2026-10-13");
    expect(a).toHaveLength(3);
    expect(pickDaily(ranked, "2026-10-13")).toEqual(a);
  });

  it("changes from day to day", () => {
    const days = ["2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"].map((d) => pickDaily(ranked, d).join());
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it("only picks good matches from near the top", () => {
    const picks = pickDaily([...ranked, c(99, "x", 10)], "2026-10-13");
    expect(picks).not.toContain("https://j/99");
    for (const p of picks) expect(Number(p.split("/").pop())).toBeLessThan(15);
  });

  it("leaves out excluded jobs and replaces them", () => {
    const first = pickDaily(ranked, "2026-10-13");
    const next = pickDaily(ranked, "2026-10-13", new Set([first[0]]));
    expect(next).not.toContain(first[0]);
    expect(next).toHaveLength(3);
  });

  it("prefers different employers", () => {
    const sameSponsor = [c(0, "a"), c(1, "a"), c(2, "a"), c(3, "b"), c(4, "c")];
    const picks = pickDaily(sameSponsor, "2026-10-13");
    const sponsors = picks.map((u) => sameSponsor.find((x) => x.url === u)!.sponsorId);
    expect(new Set(sponsors).size).toBe(3);
  });

  it("returns fewer when there aren't enough matches", () => {
    expect(pickDaily([c(0), c(1, "s1", 20)], "2026-10-13")).toEqual(["https://j/0"]);
  });
});

describe("questStreak", () => {
  it("counts consecutive days ending today or yesterday", () => {
    expect(questStreak(["2026-10-11", "2026-10-12", "2026-10-13"], "2026-10-13")).toBe(3);
    expect(questStreak(["2026-10-11", "2026-10-12"], "2026-10-13")).toBe(2);
    expect(questStreak(["2026-10-10", "2026-10-12"], "2026-10-13")).toBe(1);
    expect(questStreak([], "2026-10-13")).toBe(0);
  });
  it("crosses month ends", () => {
    expect(questStreak(["2026-09-30", "2026-10-01"], "2026-10-01")).toBe(2);
  });
});
