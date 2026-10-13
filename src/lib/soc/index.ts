import { THRESHOLDS } from "../eligibility/thresholds";
import snapshot from "./occupations.json";

/**
 * SOC 2020 occupation codes and their Skilled Worker going rates, from a snapshot of
 * Appendix Skilled Occupations and the Temporary Shortage List on GOV.UK.
 * Refresh with `node --no-warnings scripts/update-going-rates.ts`.
 */

export type OccupationStatus = "eligible" | "shortage" | "health-education" | "existing-only" | "ineligible";

export interface Occupation {
  code: string;
  title: string;
  examples: string[];
  status: OccupationStatus;
  goingRate?: number; // GBP a year for 37.5 hours a week
  newEntrantRate?: number; // GBP a year, already at least the new-entrant minimum
  payScale?: string;
  note?: string;
}

export const OCCUPATIONS = snapshot.occupations as Occupation[];
export const SNAPSHOT_DATE = snapshot.fetchedAt;
export const SNAPSHOT_SOURCES = snapshot.sources;
export const SHORTAGE_LIST_ENDS = "31 December 2026";

const BY_CODE = new Map(OCCUPATIONS.map((o) => [o.code, o]));
export const occupationByCode = (code: string) => BY_CODE.get(code);

export const STATUS_LABELS: Record<OccupationStatus, string> = {
  eligible: "Eligible",
  shortage: "Temporary Shortage List",
  "health-education": "Health or education (national pay scale)",
  "existing-only": "Only if already on a Skilled Worker visa",
  ineligible: "Not eligible",
};

export interface SalaryRule {
  eligible: boolean;
  minimum?: number; // Lowest salary that can be sponsored, GBP a year
  explanation: string;
}

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;

/**
 * The Skilled Worker salary rule for an occupation (options A, E and K). A guide only:
 * PhD discounts, Immigration Salary List jobs and pre-April-2024 transitional rates aren't covered.
 */
export function salaryRule(occ: Occupation, who: { newEntrant?: boolean; existingWorker?: boolean } = {}): SalaryRule {
  const label = `${occ.title} (SOC ${occ.code})`;
  if (occ.status === "ineligible") return { eligible: false, explanation: `${label} jobs can't be sponsored for a Skilled Worker visa.` };
  if (occ.status === "existing-only" && !who.existingWorker) {
    return {
      eligible: false,
      explanation: `Since 22 July 2025, ${label} jobs can only be sponsored for people already on a Skilled Worker visa.`,
    };
  }
  if (occ.status === "health-education") {
    return {
      eligible: true,
      minimum: THRESHOLDS.healthEducation,
      explanation: `${label} is paid on a national pay scale: at least ${fmt(THRESHOLDS.healthEducation)} and the rate for the band. ${occ.payScale ?? ""}`.trim(),
    };
  }
  const goingRate = occ.goingRate ?? 0;
  const minimum = who.newEntrant
    ? Math.max(THRESHOLDS.newEntrant, occ.newEntrantRate ?? goingRate)
    : Math.max(THRESHOLDS.general, goingRate);
  const shortage = occ.status === "shortage" ? ` It's on the Temporary Shortage List until ${SHORTAGE_LIST_ENDS}.` : "";
  return {
    eligible: true,
    minimum,
    explanation: who.newEntrant
      ? `As a new entrant, ${label} needs at least ${fmt(minimum)} (70% of the ${fmt(goingRate)} going rate, and at least ${fmt(THRESHOLDS.newEntrant)}).${shortage}`
      : `${label} needs at least ${fmt(minimum)} (the ${fmt(goingRate)} going rate, and at least ${fmt(THRESHOLDS.general)}).${shortage}`,
  };
}
