import { describe, expect, it } from "vitest";
import { postedAgo } from "../postedAgo";
import type { IndexedJob } from "./indexer";
import { filterJobs, groupByPlace, paginate, sortJobs } from "./index";

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
    // Chefs can only be sponsored for people already on a Skilled Worker visa, whatever the ad says
    expect(filterJobs(jobs, { sponsored: "likely" }).map((j) => j.title)).toEqual(["Software Engineer"]);
  });
});

describe("map places and sorting", () => {
  const spread = [
    ...jobs,
    job({ title: "Analyst", location: "London / New York", salary: { min: 400, currency: "GBP", period: "day" } }),
    job({ title: "Support", location: "Remote - UK" }),
    job({ title: "Sales", location: "Sydney, Australia" }),
  ];
  it("filters by map place, including remote", () => {
    expect(filterJobs(spread, { place: "london" }).map((j) => j.title)).toEqual(["Software Engineer", "Analyst"]);
    expect(filterJobs(spread, { place: "remote" }).map((j) => j.title)).toEqual(["Support"]);
  });
  it("counts jobs per place, busiest first", () => {
    const map = groupByPlace(spread);
    expect(map.places.map((p) => [p.id, p.count])).toEqual([["london", 2], ["leeds", 1], ["manchester", 1]]);
    expect(map).toMatchObject({ remote: 1, unplaced: 1, total: 6 });
  });
  it("sorts by yearly pay with unpaid roles last", () => {
    expect(sortJobs(spread, { sort: "salary" }).slice(0, 2).map((j) => j.title)).toEqual(["Analyst", "Software Engineer"]);
    const dollars = job({ title: "US role", salary: { max: 120000, currency: "USD", period: "year" } });
    expect(sortJobs([dollars, ...spread], { sort: "salary" }).map((j) => j.title).indexOf("US role")).toBe(1);
    expect(sortJobs(spread, {})).toBe(spread);
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
