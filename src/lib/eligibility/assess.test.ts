import { describe, expect, it } from "vitest";
import { annualGbp, assess } from "./assess";
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
