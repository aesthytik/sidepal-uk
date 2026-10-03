import { describe, expect, it } from "vitest";
import { postedAgo } from "../postedAgo";
import type { IndexedJob } from "./indexer";
import { filterJobs, paginate } from "./index";

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

const jobs = [
  job({ title: "Software Engineer", sector: "tech", salary: { max: 60000, currency: "GBP", period: "year" } }),
  job({ title: "Registered Nurse", location: "Leeds, UK", sector: "health", sponsor: "Care Co", rating: "B", visaTypes: ["Global Business Mobility"] }),
  job({ title: "Chef", location: "Manchester, UK", snippet: "Visa sponsorship is available." }),
];

describe("filterJobs", () => {
  it("matches text across title and company", () => {
    expect(filterJobs(jobs, { q: "nurse care" })).toHaveLength(1);
  });
  it("filters by location, visa, rating, sector and role", () => {
    expect(filterJobs(jobs, { location: "leeds" })).toHaveLength(1);
    expect(filterJobs(jobs, { visa: "Global Business Mobility" })).toHaveLength(1);
    expect(filterJobs(jobs, { rating: "A" })).toHaveLength(2);
    expect(filterJobs(jobs, { sector: "tech" })).toHaveLength(1);
    expect(filterJobs(jobs, { role: "health" })[0].title).toBe("Registered Nurse");
  });
  it("keeps only likely sponsorable roles", () => {
    expect(filterJobs(jobs, { sponsored: "likely" }).map((j) => j.title)).toEqual(["Software Engineer", "Chef"]);
  });
});

describe("paginate", () => {
  it("returns a page with counts", () => {
    const page = paginate(jobs, { limit: 2, page: 2 });
    expect(page).toMatchObject({ total: 3, page: 2, pageCount: 2 });
    expect(page.items).toHaveLength(1);
  });
});

describe("postedAgo", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");
  it("describes recent dates", () => {
    expect(postedAgo("2026-10-03T01:00:00Z", now)).toBe("today");
    expect(postedAgo("2026-10-02T01:00:00Z", now)).toBe("yesterday");
    expect(postedAgo("2026-09-30T01:00:00Z", now)).toBe("3 days ago");
    expect(postedAgo(undefined, now)).toBeNull();
  });
});
