import { PLACES } from "../geo/places";
import { ROLE_FAMILIES, type RoleId } from "../sectors/taxonomy";
import { SKILLS, countMentions } from "./skills";
import { EMPTY_PROFILE, type Profile, type VisaStatus } from "./types";

const MAX_SKILLS = 25;
const MAX_ROLES = 3;
const MAX_PLACES = 3;
const MAX_YEARS = 45;
const HEAD_CHARS = 600; // Roughly the name, headline and summary

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE = String.raw`(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+|(\d{1,2})[/.-])?((?:19|20)\d{2})`;
const RANGE = new RegExp(String.raw`${DATE}\s*(?:-|–|—|to|until)\s*(?:${DATE}|(present|current|now|date|ongoing))`, "gi");
const STATED_YEARS = /(\d{1,2})\+?\s*(?:years|yrs)['’]?\s+(?:of\s+)?(?:professional\s+|industry\s+|commercial\s+|relevant\s+|work\s+|hands-on\s+)?experience/gi;

/** Reads skills, likely roles, experience, places and visa situation from CV text. Runs in the browser. */
export function extractProfile(text: string, now = new Date()): Profile {
  const clean = text.replace(/\s+/g, " ").trim();
  const skills = findSkills(clean);
  return {
    ...EMPTY_PROFILE,
    headline: findHeadline(text),
    skills,
    roles: findRoles(clean, skills),
    places: findPlaces(clean),
    yearsExperience: findYears(clean, now),
    visaStatus: findVisaStatus(clean),
  };
}

function findSkills(text: string): string[] {
  return SKILLS.map((s) => ({ name: s.name, n: countMentions(text, s.name) }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, MAX_SKILLS)
    .map((s) => s.name);
}

/** Role families scored by job-title words (weighted towards the top of the CV) and the skills found. */
function findRoles(text: string, skills: string[]): RoleId[] {
  const head = text.slice(0, HEAD_CHARS);
  const scored = ROLE_FAMILIES.map((family) => {
    const titles = new RegExp(family.titles.source, "gi");
    const inHead = head.match(titles)?.length ?? 0;
    const anywhere = Math.min(5, text.match(titles)?.length ?? 0);
    const fromSkills = SKILLS.filter((s) => s.role === family.id && skills.includes(s.name)).length;
    return { id: family.id, score: inHead * 3 + anywhere + fromSkills };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  return scored
    .filter((r) => r.score >= 3 && r.score >= top * 0.4)
    .slice(0, MAX_ROLES)
    .map((r) => r.id);
}

/** Town and city names, capitalised, so "reading" and "bath" in prose don't count. */
function findPlaces(text: string): string[] {
  return PLACES.map((p) => ({ id: p.id, n: text.match(new RegExp(String.raw`\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\b`, "g"))?.length ?? 0 }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, MAX_PLACES)
    .map((p) => p.id);
}

/** "5+ years of experience" if the CV says so, otherwise the total time covered by date ranges. */
function findYears(text: string, now: Date): number | undefined {
  const stated = [...text.matchAll(STATED_YEARS)].map((m) => Number(m[1])).filter((n) => n > 0 && n <= MAX_YEARS);
  if (stated.length) return Math.max(...stated);

  const nowMonth = now.getFullYear() * 12 + now.getMonth();
  const toMonth = (mon?: string, num?: string, year?: string, end = false) => {
    if (!year) return nowMonth;
    const m = mon ? MONTHS.indexOf(mon.slice(0, 3).toLowerCase()) : num ? Number(num) - 1 : end ? 11 : 0;
    return Number(year) * 12 + Math.min(Math.max(m, 0), 11);
  };
  const ranges = [...text.matchAll(RANGE)]
    .map((m) => [toMonth(m[1], m[2], m[3]), m[7] ? nowMonth : toMonth(m[4], m[5], m[6], true)] as const)
    .filter(([from, to]) => from <= to && to <= nowMonth + 1 && to - from < MAX_YEARS * 12)
    .sort((a, b) => a[0] - b[0]);
  if (!ranges.length) return undefined;

  // Union of the ranges, so overlapping roles aren't counted twice
  let months = 0;
  let [start, end] = ranges[0];
  for (const [from, to] of ranges.slice(1)) {
    if (from <= end) end = Math.max(end, to);
    else {
      months += end - start + 1;
      [start, end] = [from, to];
    }
  }
  months += end - start + 1;
  return Math.min(MAX_YEARS, Math.floor(months / 12));
}

function findVisaStatus(text: string): VisaStatus {
  if (/\b(graduate (visa|route)|post[- ]study work)\b/i.test(text)) return "graduate";
  if (/\b(skilled worker visa|tier 2 (\(general\) |general )?visa)\b/i.test(text)) return "skilled-worker";
  if (/\b(student visa|tier 4)\b/i.test(text)) return "new-entrant"; // Switching from a Student visa counts as a new entrant
  return "unknown";
}

/** The first short line near the top that reads like a job title. */
function findHeadline(text: string): string | undefined {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  return lines.find((l) => l.length <= 80 && ROLE_FAMILIES.some((f) => f.titles.test(l)));
}
