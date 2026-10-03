import { describe, expect, it } from "vitest";
import { createDirectory, parseRegisterCsv } from "./core";

const CSV = `﻿Organisation Name,Town/City,County,Type & Rating,Route
Acme Software Ltd,London,,Worker (A rating),Skilled Worker
Acme Software Ltd,London,,Worker (A rating),Global Business Mobility: Senior or Specialist Worker
Big Acme Holdings,Leeds,West Yorkshire,Worker (A rating),Skilled Worker
Leeds Bakery,Leeds,,Worker (B rating),Skilled Worker
St Mary's Church,Bath,Somerset,Temporary Worker (A rating),Religious Worker
Kent Care Homes,Maidstone,Kent,"Worker (A (SME+))",Skilled Worker
Monzo Bank Limited,London,,Worker (A rating),Skilled Worker
`;

const directory = createDirectory(parseRegisterCsv(CSV));
const names = (r: { items: { name: string }[] }) => r.items.map((s) => s.name);

describe("directory", () => {
  it("merges one row per route into one sponsor per organisation", () => {
    expect(directory.count).toBe(6);
    const [acme] = directory.search({ q: "acme software" }).items;
    expect(acme.id).toBe("acme-software-ltd");
    expect(acme.visaTypes).toEqual(["Skilled Worker", "Global Business Mobility"]);
    expect(acme.rating).toBe("A");
  });

  it("parses nested ratings", () => {
    expect(directory.search({ q: "kent care" }).items[0].rating).toBe("A (SME+)");
  });

  it("ranks name prefix, then name contains, then location matches", () => {
    expect(names(directory.search({ q: "acme" }))).toEqual(["Acme Software Ltd", "Big Acme Holdings"]);
    expect(names(directory.search({ q: "leeds" }))).toEqual(["Leeds Bakery", "Big Acme Holdings"]);
  });

  it("falls back to fuzzy matches for typos and says so", () => {
    const result = directory.search({ q: "monzzo" });
    expect(names(result)).toEqual(["Monzo Bank Limited"]);
    expect(result.fuzzy).toBe(true);
  });

  it("filters by location (city or county), visa and rating", () => {
    expect(names(directory.search({ location: "kent" }))).toEqual(["Kent Care Homes"]);
    expect(names(directory.search({ location: "leeds", rating: "A" }))).toEqual(["Big Acme Holdings"]);
    expect(names(directory.search({ visa: "religious worker" }))).toEqual(["St Mary's Church"]);
  });

  it("pages results and clamps out-of-range pages", () => {
    const page = directory.search({ limit: 4, page: 99 });
    expect(page).toMatchObject({ total: 6, page: 2, pageCount: 2 });
    expect(page.items).toHaveLength(2);
  });

  it("suggests the busiest places first, merging variants and dropping typos", () => {
    const row = (name: string, city: string, county = "") => ({ name, city, county, routes: [], rating: "A" });
    const places = createDirectory([
      row("A", "London"),
      row("B", "LONDON "),
      row("C", "London, England"),
      row("D", "London"),
      row("E", "Leeds", "West Yorkshire"),
      row("F", "Leeds", "West Yorkshire"),
      row("G", "leeds", "West Yorkshire"),
      row("H", "Lodnon"),
    ]);
    expect(places.suggestLocations("l")).toEqual(["London", "Leeds"]);
    expect(places.suggestLocations("york")).toEqual(["West Yorkshire"]);
  });

  it("looks sponsors up by id, skipping unknown ids", () => {
    expect(names({ items: directory.getByIds(["monzo-bank-limited", "nope"]) })).toEqual(["Monzo Bank Limited"]);
  });
});
