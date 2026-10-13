import { type Occupation, salaryRule } from "../soc";
import { type OccupationMatch, matchOccupation } from "../soc/match";
import type { Job, Salary } from "../sponsorTypes";
import { THRESHOLDS } from "./thresholds";

export type Verdict = "likely" | "check" | "unlikely" | "unknown";
export interface Assessment {
  verdict: Verdict;
  reasons: string[];
  occupation?: Pick<Occupation, "code" | "title" | "status"> & Pick<OccupationMatch, "confidence">;
  required?: number; // Lowest sponsorable salary for this user and role, GBP a year
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
 * A rough guide to whether a role can be sponsored. Not immigration advice. The job title
 * is matched to a SOC 2020 occupation code to find its going rate; when that isn't clear,
 * only the general minimums are checked. `newEntrant` and `existingWorker` come from the
 * user's profile; without them, only entry-level titles get the new-entrant rate.
 */
export function assess(
  job: Pick<Job, "title" | "salary" | "snippet" | "uk">,
  rating?: string,
  opts: { newEntrant?: boolean; existingWorker?: boolean } = {}
): Assessment {
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

  const match = matchOccupation(job.title);
  const occ = match?.occupation;
  const guess = match?.confidence === "medium" ? " (a best guess from the job title)" : "";
  const occupation = occ && { code: occ.code, title: occ.title, status: occ.status, confidence: match.confidence };
  const general = occ ? salaryRule(occ, { existingWorker: opts.existingWorker }) : null;
  const entryRule = occ ? salaryRule(occ, { existingWorker: opts.existingWorker, newEntrant: true }) : null;
  const pay = annualGbp(job.salary);

  if (general && !general.eligible) {
    reasons.push(`${general.explanation}${guess}`);
    score -= 3;
    known = true;
    return finish(undefined);
  }

  const generalMin = general?.minimum ?? THRESHOLDS.general;
  const entryMin = entryRule?.minimum ?? THRESHOLDS.newEntrant;
  const entry = opts.newEntrant || ENTRY_LEVEL.test(job.title);
  const required = opts.newEntrant ? entryMin : generalMin;
  const role = occ ? ` for ${occ.title} (SOC ${occ.code})${guess}` : "";

  if (pay !== null) {
    known = true;
    if (pay >= required) {
      reasons.push(`Salary up to ${fmt(pay)} meets the ${fmt(required)} needed${role}${opts.newEntrant ? " as a new entrant" : ""}.`);
      score += 1;
    } else if (entry && pay >= entryMin) {
      reasons.push(`Salary up to ${fmt(pay)} meets the ${fmt(entryMin)} new-entrant rate${role}, if you qualify as a new entrant.`);
    } else {
      reasons.push(`Salary up to ${fmt(pay)} is below the ${fmt(entry ? entryMin : required)} needed${role}.`);
      score -= 2;
    }
  } else {
    reasons.push(`No salary shown. ${occ ? `This looks like ${occ.title} (SOC ${occ.code})${guess}, which needs at least ${fmt(required)}.` : "The minimum can't be checked."}`);
  }
  if (occ?.status === "health-education" && occ.payScale) reasons.push(`It must also meet the national pay scale: ${occ.payScale}.`);
  if (occ?.status === "shortage") reasons.push("This occupation is on the Temporary Shortage List, which ends on 31 December 2026.");
  return finish(required);

  function finish(required: number | undefined): Assessment {
    if (rating?.startsWith("B")) {
      reasons.push("This sponsor is B-rated (on an action plan) and may not be able to issue new certificates.");
      score -= 2;
    }
    if (!job.uk) reasons.push("The role may not be based in the UK.");
    const verdict: Verdict = !known ? "unknown" : score >= 1 ? "likely" : score <= -1 ? "unlikely" : "check";
    return { verdict, reasons, ...(occupation && { occupation }), ...(required !== undefined && { required }) };
  }
}
