import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabaseRead } from "../supabase/client";
import { parseChangeFilters, searchSponsorChanges, sponsorHistory } from "./changeQueries";

vi.mock("../supabase/client", () => ({ supabaseRead: vi.fn() }));

const row = {
  id: 1, sponsor_id: "acme", sponsor_name: "Acme", location: "London", change_type: "rating_changed",
  previous_value: "A", new_value: "B", register_date: "2026-10-15", observed_at: "2026-10-15T04:00:00Z", source_url: "https://example.test/register.csv",
};

// A thenable query double lets us inspect the actual Supabase filters without
// connecting to any database, including history for sponsors already removed.
function queryResult(data: unknown, error: { message: string } | null = null) {
  const result = Promise.resolve({ data, error });
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(), then: result.then.bind(result),
  };
  return query;
}

beforeEach(() => vi.resetAllMocks());

describe("parseChangeFilters", () => {
  it("validates change types, trims locations and bounds pagination", () => {
    expect(parseChangeFilters({ type: "removed", location: " Leeds ", page: "2" }))
      .toEqual({ type: "removed", location: "Leeds", page: 2 });
    expect(parseChangeFilters({ type: "arbitrary", location: ["London"], page: "-1" }))
      .toEqual({ type: undefined, location: "", page: 1 });
    for (const page of ["NaN", "Infinity", "1.5", "", undefined, ["2"]]) {
      expect(parseChangeFilters({ page }).page).toBe(1);
    }
    expect(parseChangeFilters({ page: "1000000", location: "x".repeat(200) })).toMatchObject({ page: 10_000, location: "x".repeat(120) });
  });
});

describe("searchSponsorChanges", () => {
  it("combines type and literal location filters with stable newest-first pagination", async () => {
    const query = queryResult(Array.from({ length: 31 }, (_, i) => ({ ...row, id: i + 1 })));
    const from = vi.fn().mockReturnValue(query);
    vi.mocked(supabaseRead).mockReturnValue({ from } as unknown as ReturnType<typeof supabaseRead>);
    const result = await searchSponsorChanges({ type: "removed", location: "100%_\\London", page: 2 });
    expect(from).toHaveBeenCalledWith("sponsor_changes");
    expect(query.eq).toHaveBeenCalledExactlyOnceWith("change_type", "removed");
    expect(query.ilike).toHaveBeenCalledExactlyOnceWith("location", "%100\\%\\_\\\\London%");
    expect(query.order.mock.calls).toEqual([["observed_at", { ascending: false }], ["id", { ascending: false }]]);
    expect(query.range).toHaveBeenCalledWith(30, 60);
    expect(result.items).toHaveLength(30);
    expect(result.hasMore).toBe(true);
    expect(result.items[0]).toMatchObject({ sponsorName: "Acme", previousValue: "A", newValue: "B", source: row.source_url });
  });

  it("distinguishes an empty feed from a database failure", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult([])).mockReturnValueOnce(queryResult(null, { message: "Unavailable" }));
    vi.mocked(supabaseRead).mockReturnValue({ from } as unknown as ReturnType<typeof supabaseRead>);
    expect(await searchSponsorChanges({ location: "", page: 1 })).toEqual({ items: [], hasMore: false });
    await expect(searchSponsorChanges({ location: "", page: 1 })).rejects.toThrow("Sponsor changes failed: Unavailable");
  });
});

describe("sponsorHistory", () => {
  it("uses names and fetches the latest admission independently of the recent event limit", async () => {
    const recent = queryResult([row]);
    const admission = queryResult({ ...row, id: 2, change_type: "newly_licensed", register_date: "2026-01-01" });
    const from = vi.fn().mockReturnValueOnce(recent).mockReturnValueOnce(admission);
    vi.mocked(supabaseRead).mockReturnValue({ from } as unknown as ReturnType<typeof supabaseRead>);
    const history = await sponsorHistory("Acme");
    expect(recent.eq).toHaveBeenCalledWith("sponsor_name", "Acme");
    expect(recent.limit).toHaveBeenCalledWith(20);
    expect(admission.eq).toHaveBeenCalledWith("change_type", "newly_licensed");
    expect(admission.order).toHaveBeenCalledWith("observed_at", { ascending: false });
    expect(admission.limit).toHaveBeenCalledWith(1);
    expect(history.licensedSince).toMatchObject({ type: "newly_licensed", registerDate: "2026-01-01" });
  });

  it("does not invent a licence date for existing sponsors without a recorded admission", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult([row])).mockReturnValueOnce(queryResult(null));
    vi.mocked(supabaseRead).mockReturnValue({ from } as unknown as ReturnType<typeof supabaseRead>);
    expect((await sponsorHistory("Acme")).licensedSince).toBeNull();
  });

  it("propagates history lookup failures", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult(null, { message: "Missing table" })).mockReturnValueOnce(queryResult(null));
    vi.mocked(supabaseRead).mockReturnValue({ from } as unknown as ReturnType<typeof supabaseRead>);
    await expect(sponsorHistory("Acme")).rejects.toThrow("Sponsor history failed: Missing table");
  });
});
