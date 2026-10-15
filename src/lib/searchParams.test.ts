import { describe, expect, it } from "vitest";
import { pageSearchParams, parseSearchParams, searchPageSeo, searchQueryKey, validPage } from "./searchParams";

describe("search indexing", () => {
  it("lets unfiltered pagination be indexed with its own canonical", () => {
    expect(searchPageSeo("/jobs", new URLSearchParams("page=2"))).toEqual({ page: 2, noIndex: false, canonical: "/jobs?page=2" });
    expect(searchPageSeo("/sponsors", new URLSearchParams("page=1"))).toEqual({ page: 1, noIndex: false, canonical: "/sponsors" });
  });

  it.each(["q=engineer", "location=London", "city=London", "rating=A", "sort=salary", "sort=match", "view=map", "sponsored=likely"])("does not index filtered search: %s", (params) => {
    expect(searchPageSeo("/jobs", new URLSearchParams(params)).noIndex).toBe(true);
  });

  it("ignores campaign parameters in the canonical", () => {
    expect(searchPageSeo("/jobs", new URLSearchParams("utm_source=google&gclid=abc"))).toEqual({ page: 1, noIndex: false, canonical: "/jobs" });
  });

  it.each(["0", "-2", "1.5", "Infinity", "NaN", "abc", "9007199254740992", ""])("rejects invalid page numbers: %s", (page) => {
    const params = new URLSearchParams({ page });
    expect(validPage(params)).toBe(false);
    expect(parseSearchParams(params).page).toBeUndefined();
    expect(searchPageSeo("/jobs", params).noIndex).toBe(true);
  });

  it("reads repeated parameters the same way on server and client", () => {
    const params = pageSearchParams({ q: ["engineer", "nurse"], page: "2", missing: undefined });
    expect(params.getAll("q")).toEqual(["engineer", "nurse"]);
    expect(parseSearchParams(params)).toMatchObject({ q: "engineer", page: 2 });
    expect(params.has("missing")).toBe(false);
  });

  it("keeps the data identity stable for view switches and the first page", () => {
    expect(searchQueryKey({ q: "engineer", view: "map", page: 1 })).toBe(searchQueryKey({ q: "engineer" }));
    expect(searchQueryKey({ q: "engineer", page: 2 })).not.toBe(searchQueryKey({ q: "engineer" }));
  });
});
