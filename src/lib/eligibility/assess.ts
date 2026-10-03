import type { Job, Salary } from "../sponsorTypes";
import { THRESHOLDS } from "./thresholds";

export type Verdict = "likely" | "check" | "unlikely" | "unknown";
export interface Assessment {
  verdict: Verdict;
  reasons: string[];
}

const POSITIVE = /\b(visa sponsorship (is )?(available|offered|provided)|we (can |will |do )?sponsor|sponsorship (is )?(available|offered|provided)|skilled worker visa|relocation (support|package)|will sponsor)\b/i;
const NEGATIVE =
  /\b(no (visa )?sponsorship|(unable|not able|cannot|can't|can not|do not|don't|does not|will not|won't) (to )?(offer |provide )?(visa )?sponsor\w*|must (already )?have (the )?(full )?right to work|right to work in the uk (is )?(required|essential)|without (the need for )?sponsorship|sponsorship (is )?not (available|offered|provided))\b/i;
const ENTRY_LEVEL = /\b(intern|internship|graduate|apprentice|trainee|junior|entry[- ]level)\b/i;

const PER_YEAR: Record<Salary["period"], number> = { year: 1, month: 12, week: 52, day: 260, hour: 2080 };

/** Annual GBP figure for a salary, using the top of the range. Null if not GBP or unknown. */
export function annualGbp(s?: Salary): number | null {
  if (!s || s.currency !== "GBP") return null;
  const amount = s.max ?? s.min;
  return amount ? Math.round(amount * PER_YEAR[s.period]) : null;
}

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;

/**
 * A rough guide to whether a role can be sponsored. Not immigration advice:
 * the real test depends on the occupation code and going rate.
 */
export function assess(job: Pick<Job, "title" | "salary" | "snippet" | "uk">, rating?: string): Assessment {
  const reasons: string[] = [];
  let score = 0; // >0 leans likely, <0 leans unlikely
  let known = false;

  const text = job.snippet ?? "";
  if (NEGATIVE.test(text)) {
    reasons.push("The ad says sponsorship isn't offered or that you need existing right to work.");
    return { verdict: "unlikely", reasons };
  }
  if (POSITIVE.test(text)) {
    reasons.push("The ad mentions visa sponsorship.");
    score += 2;
    known = true;
  }

  const pay = annualGbp(job.salary);
  const entry = ENTRY_LEVEL.test(job.title);
  if (pay !== null) {
    known = true;
    const min = entry ? THRESHOLDS.newEntrant : THRESHOLDS.general;
    if (pay >= THRESHOLDS.general) {
      reasons.push(`Salary up to ${fmt(pay)} meets the general minimum (${fmt(THRESHOLDS.general)}).`);
      score += 1;
    } else if (pay >= min) {
      reasons.push(`Salary up to ${fmt(pay)} meets the new-entrant minimum (${fmt(min)}), if you qualify as a new entrant.`);
    } else {
      reasons.push(`Salary up to ${fmt(pay)} is below the minimum (${fmt(min)}).`);
      score -= 2;
    }
  } else {
    reasons.push("No salary shown, so the minimum can't be checked.");
  }

  if (rating?.startsWith("B")) {
    reasons.push("This sponsor is B-rated (on an action plan) and may not be able to issue new certificates.");
    score -= 2;
  }
  if (!job.uk) reasons.push("The role may not be based in the UK.");

  const verdict: Verdict = !known ? "unknown" : score >= 1 ? "likely" : score <= -1 ? "unlikely" : "check";
  return { verdict, reasons };
}
