import { SKILLS, countMentions } from "../profile/skills";

export interface KeywordGap {
  have: string[]; // Skills the ad asks for that the user has, most mentioned first
  missing: string[]; // Skills the ad asks for that aren't in the profile or CV
}

/**
 * Compares the skills a job ad mentions with the user's skills (and CV text, if they kept it).
 * Runs in the browser; no AI involved.
 */
export function keywordGap(description: string, skills: string[], cvText = ""): KeywordGap {
  const mine = (skill: string) =>
    skills.some((s) => s.toLowerCase() === skill.toLowerCase() || countMentions(skill, s) > 0) || (cvText ? countMentions(cvText, skill) > 0 : false);
  const asked = SKILLS.map((s) => ({ name: s.name, n: countMentions(description, s.name) }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((s) => s.name);
  // Skills the user typed that aren't in the lexicon still count when the ad names them
  const custom = skills.filter((s) => !asked.some((a) => a.toLowerCase() === s.toLowerCase()) && countMentions(description, s) > 0);
  return {
    have: [...asked.filter(mine), ...custom],
    missing: asked.filter((s) => !mine(s)),
  };
}
