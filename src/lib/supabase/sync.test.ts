import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { RegisterSnapshot } from "../directory/changes";
import type { Sponsor } from "../sponsorTypes";
import { sponsorToRow } from "./mappers";
import { syncSponsors } from "./sync";

const sponsor = (extra: Partial<Sponsor> = {}): Sponsor => ({
  id: "acme", name: "Acme", city: "London", county: "", location: "London",
  rating: "A", routes: ["Skilled Worker"], visaTypes: ["Skilled Worker"], ...extra,
});
const snapshot: RegisterSnapshot = {
  key: "2026-10-15:csv-hash", source: "https://example.test/register.csv", registerDate: "2026-10-15", observedAt: "2026-10-15T04:00:00Z",
};
const opts = { overrides: {}, snapshot };
const toRow = (s: Sponsor, i: number) => sponsorToRow(s, i, { overrides: {}, registerDate: snapshot.registerDate, stamp: snapshot.observedAt });

function database(existing: Sponsor[]) {
  const read = {
    select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
    returns: vi.fn(async () => ({ data: existing.map(toRow), error: null })),
  };
  const places = {
    delete: vi.fn(() => ({ neq: vi.fn(async () => ({ error: null })) })),
    upsert: vi.fn(async () => ({ error: null })),
  };
  const rpc = vi.fn<(name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>>()
    .mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => table === "sponsors" ? read : places);
  return { db: { from, rpc } as unknown as SupabaseClient, rpc, from, places };
}

describe("syncSponsors history persistence", () => {
  it("sends each sponsor mutation and all of its events to the same transactional RPC", async () => {
    const gone = sponsor({ id: "gone", name: "Gone", location: "Leeds" });
    const { db, rpc } = database([sponsor(), gone]);
    const next = [
      sponsor({ rating: "B", routes: ["Scale-up"], visaTypes: ["Scale-up"] }),
      sponsor({ id: "new", name: "New" }),
    ];
    expect(await syncSponsors(db, next, opts)).toBe(5);
    expect(rpc).toHaveBeenCalledTimes(2);
    const [upserts, removals] = rpc.mock.calls.map(([name, args]) => {
      expect(name).toBe("apply_sponsor_register_batch");
      return args;
    });
    expect(upserts.sponsor_rows).toEqual(next.map(toRow));
    expect(upserts.removed_names).toEqual([]);
    expect(upserts.change_rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ sponsor_name: "Acme", change_type: "rating_changed", previous_value: "A", new_value: "B" }),
      expect.objectContaining({ sponsor_name: "Acme", change_type: "route_added", new_value: "Scale-up" }),
      expect.objectContaining({ sponsor_name: "Acme", change_type: "route_removed", previous_value: "Skilled Worker" }),
      expect.objectContaining({ sponsor_name: "New", change_type: "newly_licensed" }),
    ]));
    expect(removals).toMatchObject({
      sponsor_rows: [], removed_names: ["Gone"],
      change_rows: [{
        sponsor_name: "Gone", sponsor_id: "gone", location: "Leeds", change_type: "removed", previous_value: null, new_value: null,
        snapshot_key: snapshot.key, source_url: snapshot.source, observed_at: snapshot.observedAt, register_date: snapshot.registerDate,
      }],
    });
  });

  it("does not emit duplicate events or rewrite sponsors on an unchanged retry", async () => {
    const { db, rpc } = database([sponsor()]);
    expect(await syncSponsors(db, [sponsor()], opts)).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("imports an initial baseline without claiming that every sponsor is new", async () => {
    const { db, rpc } = database([]);
    expect(await syncSponsors(db, [sponsor()], opts)).toBe(0);
    expect(rpc).toHaveBeenCalledWith("apply_sponsor_register_batch", {
      sponsor_rows: [toRow(sponsor(), 0)], removed_names: [], change_rows: [],
    });
  });

  it("updates snapshot metadata without recording a licence change", async () => {
    const { db, rpc } = database([sponsor()]);
    expect(await syncSponsors(db, [sponsor()], { overrides: {}, snapshot: { ...snapshot, registerDate: "2026-10-16" } })).toBe(0);
    expect(rpc).toHaveBeenCalledWith("apply_sponsor_register_batch", expect.objectContaining({ change_rows: [] }));
  });

  it("fails the refresh when the transactional write fails, before rebuilding places", async () => {
    const { db, rpc, places } = database([sponsor()]);
    rpc.mockResolvedValue({ error: { message: "Event insert failed" } });
    await expect(syncSponsors(db, [sponsor({ rating: "B" })], opts)).rejects.toThrow("sponsors and history: Event insert failed");
    expect(places.delete).not.toHaveBeenCalled();
  });

  it("keeps large updates bounded and includes only the events for each batch", async () => {
    const { db, rpc } = database([sponsor()]);
    const next = [sponsor(), ...Array.from({ length: 1001 }, (_, i) => sponsor({ id: `new-${i}`, name: `New ${i}` }))];
    expect(await syncSponsors(db, next, opts)).toBe(1001);
    expect(rpc).toHaveBeenCalledTimes(3);
    for (const [, args] of rpc.mock.calls) {
      const rows = args.sponsor_rows as { name: string }[];
      const events = args.change_rows as { sponsor_name: string }[];
      expect(rows.length).toBeLessThanOrEqual(500);
      expect(events.map((e) => e.sponsor_name)).toEqual(rows.map((r) => r.name));
    }
  });
});
