import { THRESHOLDS } from "../eligibility/thresholds";
import type { RoleId } from "../sectors/taxonomy";
import { type Occupation, OCCUPATIONS, SHORTAGE_LIST_ENDS, SNAPSHOT_DATE, occupationByCode, salaryRule } from "./index";

/**
 * Plain-English answers about each occupation's Skilled Worker salary, written so the
 * first paragraph of a page answers the question on its own (what search and AI quote).
 */

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const HOURS_PER_YEAR = 37.5 * 52;
export const hourly = (yearly: number) => `£${(yearly / HOURS_PER_YEAR).toFixed(2)}`;

export const snapshotDateLabel = () => new Date(SNAPSHOT_DATE).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Lower-cased title for sentences, keeping acronyms like "IT" and "HR". */
const lower = (title: string) => title.replace(/\b([A-Z][a-z]+)\b/g, (w) => w.toLowerCase());

/** The one-paragraph answer to "what salary do I need to be sponsored as a …?". */
export function occupationAnswer(occ: Occupation): string {
  const job = `SOC ${occ.code} (${lower(occ.title)})`;
  switch (occ.status) {
    case "ineligible":
      return `${occ.title} (SOC ${occ.code}) jobs cannot be sponsored for a Skilled Worker, Global Business Mobility or Scale-up visa, whatever the salary.`;
    case "existing-only": {
      const rule = salaryRule(occ, { existingWorker: true });
      return `Since 22 July 2025, jobs in ${job} can no longer be sponsored for new Skilled Worker applicants. People who already held a Skilled Worker visa before then can still be sponsored in this occupation if they're paid at least ${fmt(rule.minimum!)} a year.`;
    }
    case "health-education":
      return `${occ.title} (SOC ${occ.code}) is a listed health or education occupation, so the salary must be at least ${fmt(THRESHOLDS.healthEducation)} a year and meet the national pay scale for the role. ${occ.payScale ? `${occ.payScale}.` : ""}`.trim();
    default: {
      const general = salaryRule(occ).minimum!;
      const entrant = salaryRule(occ, { newEntrant: true }).minimum!;
      const why =
        (occ.goingRate ?? 0) >= THRESHOLDS.general
          ? `the going rate for this occupation, which is above the ${fmt(THRESHOLDS.general)} general minimum`
          : `the general minimum, which is above this occupation's ${fmt(occ.goingRate ?? 0)} going rate`;
      const shortage =
        occ.status === "shortage" ? ` It is on the Temporary Shortage List, so new applicants can be sponsored if their certificate is issued before ${SHORTAGE_LIST_ENDS}.` : "";
      return `For a Skilled Worker visa in ${job}, you need a salary of at least ${fmt(general)} a year: ${why}. New entrants, such as recent graduates, people under 26 or those switching from a Student or Graduate visa, need at least ${fmt(entrant)}.${shortage}`;
    }
  }
}

/** Questions people ask about one occupation, answered from the rules. */
export function occupationFaq(occ: Occupation): { q: string; a: string }[] {
  const name = lower(occ.title);
  const answer = occupationAnswer(occ);
  const faqs = [{ q: `What salary do ${name} need for a UK Skilled Worker visa?`, a: answer }];
  if (occ.status === "eligible" || occ.status === "shortage") {
    faqs.push(
      {
        q: `What is the going rate for SOC ${occ.code}?`,
        a: `The going rate for ${occ.title} (SOC ${occ.code}) is ${fmt(occ.goingRate!)} a year (${hourly(occ.goingRate!)} an hour) for a 37.5-hour week. It must be pro-rated for other working patterns.`,
      },
      {
        q: `Can a new graduate be sponsored in SOC ${occ.code}?`,
        a: `Yes, if the job meets the new-entrant rate: at least ${fmt(salaryRule(occ, { newEntrant: true }).minimum!)} a year, which is 70% of the going rate and no less than ${fmt(THRESHOLDS.newEntrant)}. New-entrant rates can be used for up to four years in total.`,
      }
    );
  }
  faqs.push({
    q: "Who decides which occupation code a job uses?",
    a: "Your sponsor chooses the SOC 2020 code when it assigns your certificate of sponsorship. It must match the job's actual duties, not just its title.",
  });
  return faqs;
}

/** Which occupation codes each role family on the site usually maps to, for cross-linking. */
export const ROLE_OCCUPATIONS: Record<RoleId, string[]> = {
  software: ["2134", "2139", "2133", "2136", "2135", "2132", "2141"],
  data: ["2133", "2433", "3544", "2134"],
  health: ["2237", "2231", "2235", "2211", "2221", "2251", "6135"],
  engineering: ["2121", "2122", "2123", "2124", "2127", "2453", "2455"],
  finance: ["2421", "2422", "2423", "2431", "3534", "2433"],
  education: ["2314", "2313", "2311", "2312", "2316"],
  hospitality: ["5434", "5435", "1221", "1222"],
  sales: ["3556", "3552", "2432", "1132"],
  design: ["2141", "2142", "3429", "3416"],
  logistics: ["1243", "1241", "8211", "8214"],
};

export const occupationsForRole = (role: RoleId): Occupation[] =>
  ROLE_OCCUPATIONS[role].map(occupationByCode).filter((o): o is Occupation => o !== undefined);

/** Occupations in the same minor group (first three digits), for "related" links. */
export const relatedOccupations = (occ: Occupation, limit = 6): Occupation[] =>
  OCCUPATIONS.filter((o) => o.code !== occ.code && o.code.slice(0, 3) === occ.code.slice(0, 3)).slice(0, limit);
