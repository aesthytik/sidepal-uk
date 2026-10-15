import { describe, expect, it } from "vitest";
import { SITE, itemList, jobId, jobIdFromSlug, jobPath, jobPostingLd, pageMetadata } from "./seo";

const job = {
  title: "Senior Software Engineer (Backend)",
  url: "https://boards.greenhouse.io/acme/jobs/123",
  location: "London, UK",
  uk: true,
  postedAt: "2026-10-01T00:00:00.000Z",
  sponsor: "Acme Ltd",
  sponsorId: "acme-ltd",
};

describe("job ids and paths", () => {
  it("is stable, fixed-length and differs between urls", () => {
    expect(jobId(job.url)).toBe(jobId(job.url));
    expect(jobId(job.url)).toHaveLength(11);
    expect(jobId(job.url)).not.toBe(jobId(`${job.url}4`));
  });

  it("round-trips the id through the path", () => {
    const path = jobPath(job);
    expect(path).toMatch(/^\/jobs\/senior-software-engineer-backend-[0-9a-z]{11}$/);
    expect(jobIdFromSlug(path.replace("/jobs/", ""))).toBe(jobId(job.url));
  });

  it("still has an id when the title has no letters", () => {
    expect(jobIdFromSlug(jobPath({ ...job, title: "££" }).replace("/jobs/", ""))).toBe(jobId(job.url));
  });
});

describe("jobPostingLd", () => {
  it("skips roles outside the UK and empty descriptions", () => {
    expect(jobPostingLd({ ...job, uk: false }, "Build things")).toBeNull();
    expect(jobPostingLd(job, "  ")).toBeNull();
  });

  it("describes an office role with a salary range", () => {
    const ld = jobPostingLd({ ...job, salary: { min: 60000, max: 80000, currency: "GBP", period: "year" } }, "Build things")!;
    expect(ld).toMatchObject({
      jobLocation: { address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" } },
      baseSalary: { currency: "GBP", value: { "@type": "QuantitativeValue", unitText: "YEAR", minValue: 60000, maxValue: 80000 } },
      datePosted: job.postedAt,
      hiringOrganization: { "@id": "https://horus.to/sponsors/acme-ltd#org", name: job.sponsor },
    });
    expect(ld).not.toHaveProperty("validThrough");
    expect(ld.hiringOrganization).not.toHaveProperty("sameAs");
  });

  it("marks remote roles as telecommute with a single pay value", () => {
    const ld = jobPostingLd({ ...job, location: "Remote - UK", salary: { min: 25, currency: "GBP", period: "hour" } }, "x")!;
    expect(ld).toMatchObject({ jobLocationType: "TELECOMMUTE", baseSalary: { value: { unitText: "HOUR", value: 25 } } });
    expect(ld).not.toHaveProperty("jobLocation");
  });

  it("does not publish incomplete or invalid posting dates", () => {
    expect(jobPostingLd({ ...job, postedAt: undefined }, "x")).toBeNull();
    expect(jobPostingLd({ ...job, postedAt: "not-a-date" }, "x")).toBeNull();
  });

  it("uses only real closing dates and omits expired jobs", () => {
    const now = new Date("2026-10-14T00:00:00.000Z");
    expect(jobPostingLd({ ...job, validThrough: "2026-11-01" }, "x", now)?.validThrough).toBe("2026-11-01T00:00:00.000Z");
    expect(jobPostingLd({ ...job, validThrough: "2026-10-01" }, "x", now)).toBeNull();
    expect(jobPostingLd({ ...job, validThrough: "invalid" }, "x", now)).toBeNull();
  });

  it("keeps hybrid roles attached to their office location", () => {
    const ld = jobPostingLd({ ...job, location: "London, UK (Hybrid / Remote)" }, "x")!;
    expect(ld).not.toHaveProperty("jobLocationType");
    expect(ld).toMatchObject({ jobLocation: { address: { addressLocality: "London" } } });
  });

  it("does not invent a city from a country-only location", () => {
    expect(jobPostingLd({ ...job, location: "United Kingdom" }, "x")).toMatchObject({ jobLocation: { address: { "@type": "PostalAddress", addressCountry: "GB" } } });
    expect(jobPostingLd({ ...job, location: "United Kingdom" }, "x")).not.toHaveProperty("jobLocation.address.addressLocality");
    expect(jobPostingLd({ ...job, location: "" }, "x")).toBeNull();
  });
});

describe("page metadata", () => {
  it("uses page-specific search and social metadata with the canonical domain", () => {
    const metadata = pageMetadata({ title: "Jobs", description: "Find a role", path: "/jobs?page=2" });
    expect(metadata).toMatchObject({
      title: { absolute: "Jobs | Horus" },
      description: "Find a role",
      alternates: { canonical: "/jobs?page=2" },
      openGraph: { title: "Jobs | Horus", description: "Find a role", url: "/jobs?page=2", siteName: "Horus", images: [{ url: `${SITE}/opengraph-image` }] },
      twitter: { title: "Jobs | Horus", description: "Find a role", images: [`${SITE}/twitter-image`] },
    });
    expect(metadata).not.toHaveProperty("robots");
  });

  it("excludes filtered searches without blocking their links", () => {
    expect(pageMetadata({ title: "Search", description: "Search", path: "/jobs", noIndex: true }).robots).toEqual({ index: false, follow: true });
  });

  it("continues list positions on later pages", () => {
    expect(itemList([{ name: "Acme", path: "/sponsors/acme" }], 20).itemListElement[0]).toMatchObject({ position: 21, url: `${SITE}/sponsors/acme` });
  });
});
