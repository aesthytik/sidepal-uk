import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../enrichment";
import type { Http } from "../enrichment/http";
import type { Sponsor } from "../sponsorTypes";
import { buildIndex, namesMatch, slugVariants } from "./indexer";

const sponsor = (name: string, extra: Partial<Sponsor> = {}): Sponsor => ({
  id: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  city: "London",
  county: "",
  location: "London",
  rating: "A",
  routes: ["Skilled Worker"],
  visaTypes: ["Skilled Worker"],
  ...extra,
});

function fakeHttp(routes: Record<string, object>) {
  const http: Http = async (url) => {
    const body = routes[url];
    return body === undefined ? new Response("no", { status: 404 }) : new Response(JSON.stringify(body), { status: 200 });
  };
  return http;
}

describe("slugVariants", () => {
  it("strips legal suffixes and offers joined, hyphenated and first-word slugs", () => {
    expect(slugVariants("Monzo Bank Limited")).toEqual([
      { slug: "monzobank", exact: true },
      { slug: "monzo-bank", exact: true },
      { slug: "monzo", exact: false },
    ]);
  });
  it("tries the trading name too", () => {
    expect(slugVariants("Roofoods Ltd T/A Deliveroo").map((v) => v.slug)).toContain("deliveroo");
  });
});

describe("namesMatch", () => {
  it("accepts the same company and rejects a different one", () => {
    expect(namesMatch("Monzo Bank Limited", "Monzo")).toBe(true);
    expect(namesMatch("Monzo Bank Limited", "Monzo Bank")).toBe(true);
    expect(namesMatch("Acme Widgets Ltd", "Acme Gardening")).toBe(false);
    expect(namesMatch("Ebury Court Residential Home Limited", "Ebury")).toBe(false);
    expect(namesMatch("Asana Healthcare Ltd", "Asana")).toBe(false);
  });
});

describe("buildIndex", () => {
  const gh = (slug: string, name: string, jobs: object[]) => ({
    [`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`]: { jobs },
    [`https://boards-api.greenhouse.io/v1/boards/${slug}`]: { name },
  });

  it("finds a board, keeps UK jobs and sorts newest first", async () => {
    const http = fakeHttp({
      ...gh("monzo", "Monzo", [
        { title: "Old", absolute_url: "https://j/1", location: { name: "London, UK" }, first_published: "2026-01-01T00:00:00Z" },
        { title: "New", absolute_url: "https://j/2", location: { name: "London, UK" }, first_published: "2026-09-01T00:00:00Z" },
        { title: "Abroad", absolute_url: "https://j/3", location: { name: "New York" }, first_published: "2026-10-01T00:00:00Z" },
      ]),
    });
    const store = createMemoryStore();
    const index = await buildIndex({ sponsors: [sponsor("Monzo Bank Limited")], store, http, budgetMs: 10_000 });
    expect(index.jobs.map((j) => j.title)).toEqual(["New", "Old"]);
    expect(index.jobs[0]).toMatchObject({ sponsor: "Monzo Bank Limited", provider: "greenhouse", rating: "A" });
    expect(index.sponsorsIndexed).toBe(1);
    expect((await store.get(["Monzo Bank Limited"]))["Monzo Bank Limited"].ats).toEqual({ provider: "greenhouse", slug: "monzo" });
  });

  it("rejects a board that belongs to a different company", async () => {
    const http = fakeHttp(gh("acme", "Acme Gardening", [{ title: "Gardener", absolute_url: "https://j/9", location: { name: "London, UK" } }]));
    const index = await buildIndex({ sponsors: [sponsor("Acme Widgets Ltd")], store: createMemoryStore(), http, budgetMs: 10_000 });
    expect(index.jobs).toEqual([]);
  });

  it("remembers sponsors with no board and skips them next time", async () => {
    let calls = 0;
    const http: Http = async () => {
      calls++;
      return new Response("no", { status: 404 });
    };
    const store = createMemoryStore();
    const s = [sponsor("Nobody Ltd")];
    await buildIndex({ sponsors: s, store, http, budgetMs: 10_000 });
    const first = calls;
    await buildIndex({ sponsors: s, store, http, budgetMs: 10_000 });
    expect(first).toBeGreaterThan(0);
    expect(calls).toBe(first);
  });
});

describe("shared boards", () => {
  it("gives a board to neither sponsor when two claim it", async () => {
    const http = fakeHttp({
      "https://boards-api.greenhouse.io/v1/boards/alliance/jobs?content=true": {
        jobs: [{ title: "Nurse", absolute_url: "https://j/a", location: { name: "London, UK" } }],
      },
      "https://boards-api.greenhouse.io/v1/boards/alliance": { name: "Alliance" },
    });
    const sponsors = [sponsor("Alliance Software Ltd"), sponsor("Alliance Systems Ltd")];
    const index = await buildIndex({ sponsors, store: createMemoryStore(), http, budgetMs: 10_000, concurrency: 1 });
    expect(index.jobs).toEqual([]);
  });
});
