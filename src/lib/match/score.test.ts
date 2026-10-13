import { describe, expect, it } from "vitest";
import type { IndexedJob } from "../jobs/indexer";
import { EMPTY_PROFILE, type Profile } from "../profile/types";
import { rankJobs, scoreJob } from "./score";

const job = (over: Partial<IndexedJob>): IndexedJob => ({
  title: "Software Engineer",
  url: `https://j/${Math.random()}`,
  location: "London, UK",
  uk: true,
  sponsorId: "acme",
  sponsor: "Acme Ltd",
  rating: "A",
  visaTypes: ["Skilled Worker"],
  provider: "greenhouse",
  ...over,
});

const engineer: Profile = { ...EMPTY_PROFILE, skills: ["TypeScript", "React", "AWS", "Kubernetes"], roles: ["software"], places: ["london"] };

describe("scoreJob", () => {
  it("is null without skills or roles", () => {
    expect(scoreJob(job({}), EMPTY_PROFILE)).toBeNull();
    expect(scoreJob(job({}), null)).toBeNull();
  });

  it("scores a strong fit highly, with reasons", () => {
    const m = scoreJob(
      job({
        title: "Senior Frontend Engineer",
        snippet: "React and TypeScript on AWS with Kubernetes. Visa sponsorship is available.",
        salary: { min: 70000, max: 85000, currency: "GBP", period: "year" },
      }),
      engineer
    )!;
    expect(m.score).toBe(100);
    expect(m.reasons[0]).toMatch(/TypeScript/);
  });

  it("scores a poor fit low and says why", () => {
    const m = scoreJob(
      job({ title: "Head Chef", location: "Leeds, UK", sector: "hospitality", salary: { max: 30000, currency: "GBP", period: "year" } }),
      engineer
    )!;
    expect(m.score).toBeLessThan(15);
    expect(m.reasons).toEqual(expect.arrayContaining(["Outside your target roles", "Not in London"]));
  });

  it("counts remote roles as a place match when the user is open to remote", () => {
    const remote = job({ location: "Remote - UK" });
    expect(scoreJob(remote, engineer)!.reasons).toContain("Remote or anywhere in the UK");
    expect(scoreJob(remote, { ...engineer, remoteOk: false })!.reasons).toContain("Not in London");
  });

  it("uses the role's going rate, and the new-entrant rate for new entrants", () => {
    const pay = job({ salary: { max: 40000, currency: "GBP", period: "year" } }); // Software engineer: going rate £54,700
    const general = scoreJob(pay, engineer)!;
    const newEntrant = scoreJob(pay, { ...engineer, visaStatus: "new-entrant" })!;
    expect(newEntrant.score).toBeGreaterThan(general.score);
    expect(general.reasons.join()).toMatch(/under the £54,700 visa minimum for this role/);
    expect(newEntrant.reasons.join()).toMatch(/Pays up to £40,000/);
  });

  it("respects a personal salary floor above the visa minimum", () => {
    const m = scoreJob(job({ salary: { max: 58000, currency: "GBP", period: "year" } }), { ...engineer, minSalary: 60000 })!;
    expect(m.reasons.join()).toMatch(/under the £60,000 floor you set/);
  });
});

describe("rankJobs", () => {
  it("puts the best fit first and keeps order on ties", () => {
    const chef = job({ title: "Chef", location: "Leeds, UK" });
    const a = job({ title: "Backend Engineer", snippet: "AWS" });
    const b = job({ title: "Frontend Engineer", snippet: "AWS" });
    const best = job({ title: "Software Engineer (React)", snippet: "TypeScript, AWS, Kubernetes" });
    expect(rankJobs([chef, a, b, best], engineer)).toEqual([best, a, b, chef]);
  });
});
