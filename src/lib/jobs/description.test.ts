import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJobDescription } from "../enrichment/ats";
import type { IndexedJob } from "./indexer";
import { jobDescription } from "./description";

vi.mock("../enrichment/ats", () => ({
  detectAts: () => ({ provider: "greenhouse", slug: "acme" }),
  fetchJobDescription: vi.fn(),
}));

const job = (id: string): IndexedJob => ({
  title: "Engineer",
  url: `https://boards.greenhouse.io/acme/jobs/${id}`,
  sponsor: "Acme",
  sponsorId: "acme",
  location: "London",
  uk: true,
  rating: "A",
  visaTypes: ["Skilled Worker"],
  provider: "greenhouse",
  snippet: "A short preview",
});

beforeEach(() => vi.clearAllMocks());

describe("full job descriptions", () => {
  it("preserves long ads so structured data and visible content are complete", async () => {
    const text = "Responsibilities and qualifications. ".repeat(500);
    vi.mocked(fetchJobDescription).mockResolvedValueOnce(text);
    expect(await jobDescription(job("long"))).toEqual({ text: text.trim(), full: true });
  });

  it("identifies a fetched ad as complete even when it is shorter than the stored preview", async () => {
    vi.mocked(fetchJobDescription).mockResolvedValueOnce("Short ad");
    expect(await jobDescription(job("short"))).toEqual({ text: "Short ad", full: true });
  });

  it("marks unavailable ads as previews and retries instead of caching the failure", async () => {
    vi.mocked(fetchJobDescription).mockResolvedValueOnce(null).mockResolvedValueOnce("The complete description");
    expect(await jobDescription(job("retry"))).toEqual({ text: "A short preview", full: false });
    expect(await jobDescription(job("retry"))).toEqual({ text: "The complete description", full: true });
  });

  it("refreshes descriptions after an hour", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(0);
    try {
      vi.mocked(fetchJobDescription).mockResolvedValueOnce("Original ad").mockResolvedValueOnce("Updated ad");
      expect(await jobDescription(job("ttl"))).toEqual({ text: "Original ad", full: true });
      expect(await jobDescription(job("ttl"))).toEqual({ text: "Original ad", full: true });
      expect(fetchJobDescription).toHaveBeenCalledTimes(1);
      clock.mockReturnValue(60 * 60_000 + 1);
      expect(await jobDescription(job("ttl"))).toEqual({ text: "Updated ad", full: true });
    } finally {
      clock.mockRestore();
    }
  });
});
