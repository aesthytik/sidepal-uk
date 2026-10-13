import { describe, expect, it } from "vitest";
import { annualGbp, assess } from "./assess";
import { occupationByCode } from "../soc";
import { LAST_VERIFIED } from "./thresholds";

const base = { title: "Software Engineer", uk: true };

describe("assess", () => {
  it("is unknown without salary or wording", () => {
    expect(assess(base).verdict).toBe("unknown");
  });
  it("is likely at or above the general threshold", () => {
    const r = assess({ ...base, salary: { min: 50000, max: 60000, currency: "GBP", period: "year" } });
    expect(r.verdict).toBe("likely");
  });
  it("is unlikely below the threshold", () => {
    const r = assess({ ...base, salary: { min: 25000, max: 30000, currency: "GBP", period: "year" } });
    expect(r.verdict).toBe("unlikely");
  });
  it("uses the new-entrant rate for graduate roles", () => {
    const r = assess({ title: "Graduate Engineer", uk: true, salary: { max: 35000, currency: "GBP", period: "year" } });
    expect(r.verdict).toBe("check");
  });
  it("uses the new-entrant rate for any title when the user is a new entrant", () => {
    const job = { ...base, salary: { max: 40000, currency: "GBP", period: "year" as const } };
    expect(assess(job).verdict).toBe("unlikely");
    const r = assess(job, undefined, { newEntrant: true });
    expect(r.verdict).toBe("likely");
    expect(r.required).toBe(occupationByCode("2134")!.newEntrantRate);
  });
  it("uses the occupation's going rate when it's above the general minimum", () => {
    const goingRate = occupationByCode("2134")!.goingRate!;
    const r = assess({ ...base, salary: { max: goingRate - 1000, currency: "GBP", period: "year" } });
    expect(r).toMatchObject({ verdict: "unlikely", required: goingRate, occupation: { code: "2134", status: "eligible" } });
    expect(r.reasons[0]).toMatch(/Programmers and software development professionals \(SOC 2134\)/);
  });
  it("rules out occupations that can't be sponsored", () => {
    const r = assess({ title: "HGV Class 1 Driver", uk: true, salary: { max: 50000, currency: "GBP", period: "year" } });
    expect(r.verdict).toBe("unlikely");
    expect(r.reasons[0]).toMatch(/can't be sponsored/);
  });
  it("only allows pre-July-2025 occupations for existing Skilled Workers", () => {
    const chef = { title: "Head Chef", uk: true, salary: { max: 45000, currency: "GBP", period: "year" as const } };
    expect(assess(chef).verdict).toBe("unlikely");
    expect(assess(chef, undefined, { existingWorker: true }).verdict).toBe("likely");
  });
  it("uses the £25,000 floor and pay scale for nurses", () => {
    const r = assess({ title: "Staff Nurse", uk: true, salary: { max: 31000, currency: "GBP", period: "year" } });
    expect(r).toMatchObject({ verdict: "likely", required: 25_000 });
    expect(r.reasons.join(" ")).toMatch(/national pay scale/);
  });
  it("reads sponsorship wording", () => {
    expect(assess({ ...base, snippet: "Visa sponsorship is available for this role." }).verdict).toBe("likely");
    expect(assess({ ...base, snippet: "Candidates must have the right to work in the UK." }).verdict).toBe("unlikely");
    expect(assess({ ...base, snippet: "We do not offer sponsorship." }).verdict).toBe("unlikely");
  });
  it("marks down B-rated sponsors", () => {
    const r = assess({ ...base, snippet: "We sponsor skilled workers." }, "B");
    expect(r.verdict).toBe("check");
  });
  it("annualises other periods and ignores other currencies", () => {
    expect(annualGbp({ max: 25, currency: "GBP", period: "hour" })).toBe(52000);
    expect(annualGbp({ max: 100000, currency: "USD", period: "year" })).toBeNull();
  });
  it("flags stale thresholds after a year", () => {
    const ageDays = (Date.now() - new Date(LAST_VERIFIED).getTime()) / 864e5;
    expect(ageDays).toBeLessThan(400);
  });
});
