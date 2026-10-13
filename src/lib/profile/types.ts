import { PLACE_BY_ID } from "../geo/places";
import { type RoleId, isRoleId } from "../sectors/taxonomy";

export const VISA_STATUSES = ["unknown", "new-entrant", "graduate", "switching", "skilled-worker"] as const;
export type VisaStatus = (typeof VISA_STATUSES)[number];

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  unknown: "Not sure yet",
  "new-entrant": "New entrant (recent graduate, under 26, or early career)",
  graduate: "On a Graduate visa",
  switching: "Switching from another visa",
  "skilled-worker": "Already on a Skilled Worker visa (since before 22 July 2025)",
};

/**
 * What the user told us about themselves, or what we read from their CV.
 * Kept in the browser; only these derived fields are ever sent to the server
 * (for ranking jobs), never the CV text itself.
 */
export interface Profile {
  headline?: string;
  skills: string[];
  roles: RoleId[];
  places: string[]; // Place ids from lib/geo/places
  remoteOk: boolean;
  yearsExperience?: number;
  minSalary?: number; // GBP per year
  visaStatus: VisaStatus;
}

export const EMPTY_PROFILE: Profile = { skills: [], roles: [], places: [], remoteOk: true, visaStatus: "unknown" };

const MAX_SKILLS = 40;

/** Whether the lower new-entrant salary rate is likely to apply. Graduate visa holders switching in usually qualify. */
export const isNewEntrant = (p: Pick<Profile, "visaStatus">) => p.visaStatus === "new-entrant" || p.visaStatus === "graduate";

/** Already sponsored, so occupations closed to new applicants since 22 July 2025 may still be open. */
export const isExistingWorker = (p: Pick<Profile, "visaStatus">) => p.visaStatus === "skilled-worker";

/** Enough to rank jobs meaningfully. */
export const hasMatchable = (p: Profile | null | undefined): p is Profile => Boolean(p && (p.skills.length || p.roles.length));

/** Complete enough for the "Know Thyself" achievement. */
export const isComplete = (p: Profile) => p.skills.length >= 3 && p.roles.length >= 1 && p.visaStatus !== "unknown";

const num = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), max) : undefined;
const strings = (v: unknown, maxItems: number, maxLen = 40) =>
  Array.isArray(v)
    ? [...new Set(v.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, maxLen)).filter(Boolean))].slice(0, maxItems)
    : [];

/** Turns untrusted input (a request body, an AI reply, old localStorage) into a valid profile. */
export function sanitizeProfile(input: unknown): Profile {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  // Not trimmed, so a space can be typed at the end while editing
  const headline = typeof o.headline === "string" ? o.headline.slice(0, 120) : "";
  return {
    ...(headline.trim() && { headline }),
    skills: strings(o.skills, MAX_SKILLS),
    roles: strings(o.roles, 5).filter(isRoleId),
    places: strings(o.places, 10).filter((id) => PLACE_BY_ID.has(id)),
    remoteOk: o.remoteOk !== false,
    yearsExperience: num(o.yearsExperience, 50),
    minSalary: num(o.minSalary, 1_000_000),
    visaStatus: VISA_STATUSES.includes(o.visaStatus as VisaStatus) ? (o.visaStatus as VisaStatus) : "unknown",
  };
}
