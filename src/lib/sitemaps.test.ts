import { describe, expect, it } from "vitest";
import { JOBS_PER_SITEMAP, SPONSORS_PER_SITEMAP, sitemapIds } from "./sitemaps";

describe("sitemap partitioning", () => {
  it("preserves existing sponsor slices and separates jobs from curated pages", () => {
    expect(sitemapIds(127_000, 500)).toEqual([{ id: "0" }, { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "jobs-0" }]);
  });

  it("splits job collections before they exceed Google's sitemap limit", () => {
    expect(sitemapIds(SPONSORS_PER_SITEMAP, JOBS_PER_SITEMAP + 1)).toEqual([{ id: "0" }, { id: "1" }, { id: "jobs-0" }, { id: "jobs-1" }]);
    expect(JOBS_PER_SITEMAP).toBeLessThanOrEqual(50_000);
    expect(SPONSORS_PER_SITEMAP).toBeLessThanOrEqual(50_000);
  });

  it("does not advertise empty database slices", () => {
    expect(sitemapIds(0, 0)).toEqual([{ id: "0" }]);
  });
});
