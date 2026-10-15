import type { Sponsor } from "../sponsorTypes";

export const CHANGE_TYPES = ["newly_licensed", "removed", "rating_changed", "route_added", "route_removed"] as const;
export type SponsorChangeType = (typeof CHANGE_TYPES)[number];

export const CHANGE_LABELS: Record<SponsorChangeType, string> = {
  newly_licensed: "Newly licensed",
  removed: "Removed from register",
  rating_changed: "Rating changed",
  route_added: "Visa route added",
  route_removed: "Visa route removed",
};

export interface SponsorChange {
  sponsorId: string;
  sponsorName: string;
  location: string;
  type: SponsorChangeType;
  previousValue: string | null;
  newValue: string | null;
}

export interface RegisterSnapshot {
  key: string; // Register day + CSV hash: stable across retries, distinct across daily snapshots
  source: string;
  registerDate: string | null;
  observedAt: string;
}

export interface RecordedSponsorChange extends SponsorChange {
  id: number;
  registerDate: string | null;
  observedAt: string;
  source: string;
}

/**
 * Names are the register's natural key; slug ids can move when names collide.
 * `null` means the first import, which establishes a baseline rather than
 * claiming that every existing sponsor was newly licensed today.
 */
export function diffSponsors(previous: readonly Sponsor[] | null, current: readonly Sponsor[]): SponsorChange[] {
  if (previous === null) return [];
  const before = new Map(previous.map((s) => [s.name, s]));
  const after = new Set(current.map((s) => s.name));
  const changes: SponsorChange[] = [];

  function add(s: Sponsor, type: SponsorChangeType, previousValue: string | null = null, newValue: string | null = null) {
    changes.push({ sponsorId: s.id, sponsorName: s.name, location: s.location, type, previousValue, newValue });
  }

  for (const sponsor of current) {
    const old = before.get(sponsor.name);
    if (!old) {
      add(sponsor, "newly_licensed");
      continue;
    }
    if (old.rating !== sponsor.rating) add(sponsor, "rating_changed", old.rating, sponsor.rating);
    const oldRoutes = new Set(old.routes);
    const newRoutes = new Set(sponsor.routes);
    for (const route of [...newRoutes].sort()) {
      if (!oldRoutes.has(route)) add(sponsor, "route_added", null, route);
    }
    for (const route of [...oldRoutes].sort()) {
      if (!newRoutes.has(route)) add(sponsor, "route_removed", route);
    }
  }
  for (const sponsor of previous) {
    if (!after.has(sponsor.name)) add(sponsor, "removed");
  }
  return changes;
}

export interface SponsorChangeStore {
  // The store applies the register update and its events together, including
  // imports with no events. Tests can inject a memory store without Supabase.
  save(changes: SponsorChange[], snapshot: RegisterSnapshot): Promise<void>;
}

export function createChangeRecorder(deps: { store: SponsorChangeStore }) {
  return async (previous: readonly Sponsor[] | null, current: readonly Sponsor[], snapshot: RegisterSnapshot) => {
    const changes = diffSponsors(previous, current);
    await deps.store.save(changes, snapshot);
    return changes.length;
  };
}

export function changeDescription(change: SponsorChange): string {
  switch (change.type) {
    case "newly_licensed": return "First appeared on the register in our daily comparisons.";
    case "removed": return "No longer appears on the register.";
    case "rating_changed": return `Rating changed from ${change.previousValue || "not listed"} to ${change.newValue || "not listed"}.`;
    case "route_added": return `Added ${change.newValue}.`;
    case "route_removed": return `Removed ${change.previousValue}.`;
  }
}
