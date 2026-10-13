import { annualGbp, assess } from "../eligibility/assess";
import { THRESHOLDS } from "../eligibility/thresholds";
import { placeOf } from "../geo/geocode";
import { PLACE_BY_ID } from "../geo/places";
import type { IndexedJob } from "../jobs/indexer";
import { countMentions } from "../profile/skills";
import { type Profile, hasMatchable, isExistingWorker, isNewEntrant } from "../profile/types";
import { roleFamily } from "../sectors/taxonomy";

export interface Match {
  score: number; // 0-100
  reasons: string[]; // Best first: what fits, then what doesn't
}

// How much each part counts. Parts the profile says nothing about are left out, not scored zero.
const WEIGHTS = { skills: 40, role: 20, place: 15, salary: 15, sponsorship: 10 };
// The index keeps only the first ~300 characters of each ad, mostly intro prose, so two hits is a strong signal
const SKILLS_FOR_FULL_MARKS = 2;
const VERDICT_VALUE = { likely: 1, check: 0.6, unknown: 0.4, unlikely: 0 };

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const list = (items: string[]) => (items.length > 3 ? `${items.slice(0, 3).join(", ")} +${items.length - 3}` : items.join(", "));

/** How well a job fits the user, with plain-English reasons. Null when the profile has no skills or roles yet. */
export function scoreJob(job: IndexedJob, profile: Profile | null | undefined): Match | null {
  if (!hasMatchable(profile)) return null;
  const good: string[] = [];
  const bad: string[] = [];
  let earned = 0;
  let possible = 0;
  const add = (part: keyof typeof WEIGHTS, value: number) => {
    earned += WEIGHTS[part] * value;
    possible += WEIGHTS[part];
  };

  if (profile.skills.length) {
    const text = `${job.title} ${job.department ?? ""} ${job.snippet ?? ""}`;
    const hits = profile.skills.filter((s) => countMentions(text, s) > 0);
    add("skills", Math.min(1, hits.length / Math.min(SKILLS_FOR_FULL_MARKS, profile.skills.length)));
    if (hits.length) good.push(`Mentions your skills: ${list(hits)}`);
    else bad.push("None of your skills appear in the ad's opening");
  }

  if (profile.roles.length) {
    const families = profile.roles.map(roleFamily).filter((f) => f !== undefined);
    const byTitle = families.find((f) => f.titles.test(job.title));
    const bySector = !byTitle && families.find((f) => job.sector && (f.sectors as readonly string[]).includes(job.sector));
    add("role", byTitle ? 1 : bySector ? 0.4 : 0);
    if (byTitle) good.push(`A ${byTitle.label.toLowerCase()} role`);
    else if (bySector) good.push(`At an employer that hires for ${bySector.label.toLowerCase()}`);
    else bad.push("Outside your target roles");
  }

  if (profile.places.length || profile.remoteOk) {
    const at = placeOf(job.location);
    const near = at && at !== "remote" && profile.places.includes(at.id);
    const remote = at === "remote" && profile.remoteOk;
    const wanted = profile.places.length > 0;
    if (wanted || remote) add("place", near || remote ? 1 : 0);
    if (near) good.push(`In ${at.name}`);
    else if (remote) good.push("Remote or anywhere in the UK");
    else if (wanted) bad.push(`Not in ${profile.places.map((id) => PLACE_BY_ID.get(id)?.name ?? id).join(" or ")}`);
  }

  const newEntrant = isNewEntrant(profile);
  const assessment = assess(job, job.rating, { newEntrant, existingWorker: isExistingWorker(profile) });
  const pay = annualGbp(job.salary);
  // The visa minimum for this role (its going rate when the occupation is known), or the user's own floor if higher
  const visaMin = assessment.required ?? (newEntrant ? THRESHOLDS.newEntrant : THRESHOLDS.general);
  const floor = Math.max(profile.minSalary ?? 0, visaMin);
  if (pay === null) add("salary", 0.5);
  else if (pay >= floor) {
    add("salary", 1);
    good.push(`Pays up to ${fmt(pay)}`);
  } else {
    add("salary", 0);
    bad.push(`Pays up to ${fmt(pay)}, under the ${fmt(floor)} ${floor === visaMin ? "visa minimum for this role" : "floor you set"}`);
  }

  const { verdict } = assessment;
  add("sponsorship", VERDICT_VALUE[verdict]);
  if (verdict === "likely") good.push("Looks sponsorable");
  if (verdict === "unlikely") bad.push("Sponsorship looks unlikely");

  return { score: Math.round((100 * earned) / possible), reasons: [...good, ...bad] };
}

/** Best fit first. Stable, so equal scores keep the newest-first order. */
export function rankJobs(jobs: IndexedJob[], profile: Profile): IndexedJob[] {
  return jobs
    .map((job) => ({ job, score: scoreJob(job, profile)?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.job);
}
