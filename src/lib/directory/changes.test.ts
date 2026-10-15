import { describe, expect, it, vi } from "vitest";
import type { Sponsor } from "../sponsorTypes";
import { changeDescription, createChangeRecorder, diffSponsors, type RegisterSnapshot } from "./changes";

const sponsor = (extra: Partial<Sponsor> = {}): Sponsor => ({
  id: "acme", name: "Acme", city: "London", county: "", location: "London",
  rating: "A", routes: ["Skilled Worker"], visaTypes: ["Skilled Worker"], ...extra,
});
const snapshot: RegisterSnapshot = {
  key: "csv-hash", source: "https://example.test/register.csv", registerDate: "2026-10-15", observedAt: "2026-10-15T04:00:00Z",
};

describe("diffSponsors", () => {
  it("records additions and removals using the appropriate snapshot's name, id and location", () => {
    const old = sponsor({ id: "old", name: "Old Ltd", location: "Leeds" });
    const added = sponsor({ id: "new", name: "New Ltd", location: "Bristol", routes: ["Scale-up"] });
    expect(diffSponsors([old], [added])).toEqual([
      { sponsorId: "new", sponsorName: "New Ltd", location: "Bristol", type: "newly_licensed", previousValue: null, newValue: null },
      { sponsorId: "old", sponsorName: "Old Ltd", location: "Leeds", type: "removed", previousValue: null, newValue: null },
    ]);
  });

  it("records rating changes and each raw route added or removed", () => {
    const old = sponsor({ routes: ["Skilled Worker", "Global Business Mobility: Senior or Specialist Worker"] });
    const next = sponsor({ rating: "B", routes: ["Skilled Worker", "Global Business Mobility: UK Expansion Worker", "Scale-up"] });
    expect(diffSponsors([old], [next]).map(({ type, previousValue, newValue }) => ({ type, previousValue, newValue }))).toEqual([
      { type: "rating_changed", previousValue: "A", newValue: "B" },
      { type: "route_added", previousValue: null, newValue: "Global Business Mobility: UK Expansion Worker" },
      { type: "route_added", previousValue: null, newValue: "Scale-up" },
      { type: "route_removed", previousValue: "Global Business Mobility: Senior or Specialist Worker", newValue: null },
    ]);
  });

  it("ignores route ordering and duplicates without mutating either snapshot", () => {
    const old = sponsor({ routes: ["Scale-up", "Skilled Worker", "Scale-up"] });
    const next = sponsor({ routes: ["Skilled Worker", "Scale-up"] });
    const before = JSON.stringify([old, next]);
    expect(diffSponsors([old], [next])).toEqual([]);
    expect(JSON.stringify([old, next])).toBe(before);
    expect(diffSponsors([sponsor()], [sponsor({ routes: ["Scale-up", "Scale-up"] })]).map((c) => c.type))
      .toEqual(["route_added", "route_removed"]);
  });

  it("matches by name when slug collisions shift ids and ignores non-register metadata", () => {
    expect(diffSponsors([sponsor()], [sponsor({ id: "acme-2", sector: "tech", city: "Leeds", location: "Leeds" })])).toEqual([]);
    expect(diffSponsors([sponsor({ name: "Acme!" })], [sponsor({ name: "Acme?" })]).map((c) => c.type))
      .toEqual(["newly_licensed", "removed"]);
  });

  it("establishes a first-import baseline and supports known empty snapshots", () => {
    expect(diffSponsors(null, [sponsor()])).toEqual([]);
    expect(diffSponsors([], [sponsor()]).map((c) => c.type)).toEqual(["newly_licensed"]);
    expect(diffSponsors([sponsor()], []).map((c) => c.type)).toEqual(["removed"]);
    expect(diffSponsors([], [])).toEqual([]);
  });

  it("records ratings becoming available or unlisted", () => {
    expect(diffSponsors([sponsor({ rating: "" })], [sponsor({ rating: "A (SME+)" })])[0])
      .toMatchObject({ type: "rating_changed", previousValue: "", newValue: "A (SME+)" });
    const [change] = diffSponsors([sponsor()], [sponsor({ rating: "" })]);
    expect(changeDescription(change)).toBe("Rating changed from A to not listed.");
  });

  it("detects a sponsor rejoining the register after a removal", () => {
    const old = [sponsor()];
    expect(diffSponsors(old, []).map((c) => c.type)).toEqual(["removed"]);
    expect(diffSponsors([], old).map((c) => c.type)).toEqual(["newly_licensed"]);
  });
});

describe("createChangeRecorder", () => {
  it("injects persistence and passes snapshot provenance with the diff", async () => {
    const save = vi.fn(async () => {});
    const record = createChangeRecorder({ store: { save } });
    const previous = [sponsor()];
    const current = [sponsor({ rating: "B" })];
    expect(await record(previous, current, snapshot)).toBe(1);
    expect(save).toHaveBeenCalledExactlyOnceWith(diffSponsors(previous, current), snapshot);
  });

  it("still saves imports with no events so the baseline and other fields update", async () => {
    const save = vi.fn(async () => {});
    expect(await createChangeRecorder({ store: { save } })(null, [sponsor()], snapshot)).toBe(0);
    expect(save).toHaveBeenCalledExactlyOnceWith([], snapshot);
  });

  it("propagates write failures to fail the refresh", async () => {
    const save = vi.fn(async () => { throw new Error("Database unavailable"); });
    await expect(createChangeRecorder({ store: { save } })([], [sponsor()], snapshot)).rejects.toThrow("Database unavailable");
  });
});
