import { describe, expect, it } from "vitest";
import { createEnricher, createMemoryStore } from ".";
import type { Http } from "./http";

/** A fake network serving canned responses, recording every request. */
function fakeHttp(routes: Record<string, string | object>) {
  const calls: string[] = [];
  const http: Http = async (url, init) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    const body = routes[url];
    if (body === undefined) return new Response("not found", { status: 404 });
    if (url === "throw") throw new Error("boom");
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 });
  };
  return { http, calls };
}

const GREENHOUSE_JOBS = {
  jobs: [
    { title: "Engineer", absolute_url: "https://job/1", location: { name: "New York" } },
    { title: "Designer", absolute_url: "https://job/2", location: { name: "London, UK" } },
  ],
};

const acmeSite = {
  "https://acmewidgets.co.uk": `<h1>Acme Widgets</h1><a href="/careers">Careers</a>`,
  "https://acmewidgets.co.uk/careers": `<script src="https://boards.greenhouse.io/embed/job_board/js?for=acme"></script>`,
  "https://boards-api.greenhouse.io/v1/boards/acme/jobs": GREENHOUSE_JOBS,
};

function setup(routes: Record<string, string | object>, resolvable: string[] = ["acmewidgets.co.uk"]) {
  const { http, calls } = fakeHttp(routes);
  const store = createMemoryStore();
  const enrich = createEnricher({ store, http, resolves: async (d) => resolvable.includes(d) });
  return { enrich, store, calls };
}

describe("enrich", () => {
  it("finds website, careers page and open roles with UK roles first", async () => {
    const { enrich } = setup(acmeSite);
    const result = await enrich([{ name: "Acme Widgets Ltd" }]);
    expect(result["Acme Widgets Ltd"]).toEqual({
      website: "https://acmewidgets.co.uk",
      careersUrl: "https://acmewidgets.co.uk/careers",
      jobs: {
        provider: "greenhouse",
        total: 2,
        uk: 1,
        top: [
          { title: "Designer", url: "https://job/2", location: "London, UK", uk: true },
          { title: "Engineer", url: "https://job/1", location: "New York", uk: false },
        ],
      },
    });
  });

  it("recognises a careers link that points straight at an ATS", async () => {
    const { enrich } = setup({
      "https://acmewidgets.co.uk": `Acme Widgets <a href="https://jobs.lever.co/acme">Join us</a>`,
      "https://api.lever.co/v0/postings/acme?mode=json": [
        { text: "PM", hostedUrl: "https://lever/1", categories: { location: "Manchester" } },
      ],
    });
    const { jobs } = (await enrich([{ name: "Acme Widgets Ltd" }]))["Acme Widgets Ltd"];
    expect(jobs).toMatchObject({ provider: "lever", total: 1, uk: 1 });
  });

  it("serves repeat lookups from the store and job cache without network calls", async () => {
    const { enrich, calls } = setup(acmeSite);
    const first = await enrich([{ name: "Acme Widgets Ltd" }]);
    calls.length = 0;
    expect(await enrich([{ name: "Acme Widgets Ltd" }])).toEqual(first);
    expect(calls).toEqual([]);
  });

  it("remembers that nothing was found", async () => {
    const { enrich, store, calls } = setup({}, []);
    expect(await enrich([{ name: "Unknown Things Ltd" }])).toEqual({ "Unknown Things Ltd": {} });
    expect((await store.get(["Unknown Things Ltd"]))["Unknown Things Ltd"]).toMatchObject({ website: null });
    calls.length = 0;
    await enrich([{ name: "Unknown Things Ltd" }]);
    expect(calls).toEqual([]);
  });

  it("does not attribute a guessed domain to a company it doesn't mention", async () => {
    const { enrich } = setup({ "https://acmewidgets.co.uk": "<h1>Something else entirely</h1>" });
    expect((await enrich([{ name: "Acme Widgets Ltd" }]))["Acme Widgets Ltd"]).toEqual({});
  });

  it("keeps going when one sponsor's lookups fail", async () => {
    const { http } = fakeHttp(acmeSite);
    const enrich = createEnricher({
      store: createMemoryStore(),
      http,
      resolves: async (d) => {
        if (d.startsWith("broken")) throw new Error("dns down");
        return d === "acmewidgets.co.uk";
      },
    });
    const result = await enrich([{ name: "Broken Co Ltd" }, { name: "Acme Widgets Ltd" }]);
    expect(result["Broken Co Ltd"]).toEqual({});
    expect(result["Acme Widgets Ltd"].jobs?.total).toBe(2);
  });
});

describe("isUkLocation", () => {
  it.each([
    ["London, UK", true],
    ["Remote - United Kingdom", true],
    ["Manchester", true],
    ["New York", false],
    ["Cambridge, MA", false],
    ["Remote", false],
  ])("%s -> %s", async (location, uk) => {
    const { isUkLocation } = await import("./ats");
    expect(isUkLocation(location)).toBe(uk);
  });
});

describe("careers discovery", () => {
  it("follows an 'open roles' link from the careers page to find the board", async () => {
    const { enrich } = setup({
      "https://acmewidgets.co.uk": `Acme Widgets <a href="/careers">Careers</a>`,
      "https://acmewidgets.co.uk/careers": `<a href="/careers/jobs">View open roles</a>`,
      "https://acmewidgets.co.uk/careers/jobs": `<iframe src="https://jobs.ashbyhq.com/Acme%20Widgets"></iframe>`,
      "https://api.ashbyhq.com/posting-api/job-board/Acme%20Widgets": {
        jobs: [{ title: "SRE", jobUrl: "https://ashby/1", location: "Remote", secondaryLocations: [{ location: "London" }] }],
      },
    });
    const { jobs } = (await enrich([{ name: "Acme Widgets Ltd" }]))["Acme Widgets Ltd"];
    expect(jobs).toMatchObject({ provider: "ashby", total: 1, uk: 1 });
  });
});

describe("website discovery", () => {
  it("prefers the trading name in 't/a' registrations", async () => {
    const { enrich } = setup({ "https://deliveroo.co.uk": "<title>Deliveroo</title>" }, ["deliveroo.co.uk"]);
    const result = await enrich([{ name: "Roofoods Ltd t/a Deliveroo" }]);
    expect(result["Roofoods Ltd t/a Deliveroo"].website).toBe("https://deliveroo.co.uk");
  });
});
