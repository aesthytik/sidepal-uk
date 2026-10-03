import type { AtsProvider, Job, JobSummary } from "../sponsorTypes";
import { type Http, getJson } from "./http";

export interface AtsBoard {
  provider: AtsProvider;
  slug: string;
}

const TOP_JOBS = 5;

// Path segments that look like slugs but are part of the ATS's own URLs
const NOT_SLUGS = new Set(["embed", "api", "j", "js", "www", "apply", "help", "resources", "jobs"]);

const PATTERNS: { provider: AtsProvider; regex: RegExp }[] = [
  {
    provider: "greenhouse",
    regex:
      /(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board(?:\/js)?\?for=)?([a-z0-9_-]+)/gi,
  },
  { provider: "lever", regex: /jobs\.lever\.co\/([a-z0-9_.-]+)/gi },
  { provider: "ashby", regex: /jobs\.ashbyhq\.com\/([a-z0-9_.%-]+)/gi },
  { provider: "workable", regex: /apply\.workable\.com\/([a-z0-9_-]+)/gi },
  { provider: "workable", regex: /\b([a-z0-9-]+)\.workable\.com/gi },
];

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Finds a hosted job board (Greenhouse, Lever, Ashby, Workable) referenced
 * in a URL or a page's HTML.
 */
export function detectAts(text: string): AtsBoard | null {
  for (const { provider, regex } of PATTERNS) {
    for (const match of text.matchAll(regex)) {
      const slug = safeDecode(match[1]);
      if (!NOT_SLUGS.has(slug.toLowerCase())) return { provider, slug };
    }
  }
  return null;
}

const UK_COUNTRY = /\b(uk|u\.k\.|united kingdom|great britain|britain|england|scotland|wales|northern ireland)\b/i;

const UK_CITIES =
  /\b(london|manchester|birmingham|leeds|edinburgh|glasgow|bristol|cambridge|oxford|belfast|cardiff|liverpool|newcastle|sheffield|nottingham|reading|brighton|leicester|southampton|aberdeen|milton keynes|coventry)\b/i;

// Places that share a name with a UK city, e.g. "Cambridge, MA"
const ELSEWHERE = /\b(usa|united states|canada|australia|new hampshire|massachusetts)\b|,\s*[A-Z]{2}\b/;

export function isUkLocation(location: string): boolean {
  if (UK_COUNTRY.test(location)) return true;
  return UK_CITIES.test(location) && !ELSEWHERE.test(location);
}

function job(title: unknown, url: unknown, location: unknown): Job | null {
  if (typeof title !== "string" || typeof url !== "string") return null;
  const loc = typeof location === "string" ? location : "";
  return { title: title.trim(), url, location: loc, uk: isUkLocation(loc) };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped third-party JSON */
const FETCHERS: Record<AtsProvider, (slug: string, http: Http) => Promise<(Job | null)[] | null>> = {
  async greenhouse(slug, http) {
    const data = await getJson<any>(http, `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    return data?.jobs?.map((j: any) => job(j.title, j.absolute_url, j.location?.name)) ?? null;
  },
  async lever(slug, http) {
    const data = await getJson<any>(http, `https://api.lever.co/v0/postings/${slug}?mode=json`);
    return Array.isArray(data)
      ? data.map((j: any) =>
          job(j.text, j.hostedUrl, (j.categories?.allLocations ?? [j.categories?.location]).filter(Boolean).join(" / "))
        )
      : null;
  },
  async ashby(slug, http) {
    const data = await getJson<any>(http, `https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    return (
      data?.jobs?.map((j: any) =>
        job(
          j.title,
          j.jobUrl,
          [j.location, ...(j.secondaryLocations ?? []).map((l: any) => l.location)].filter(Boolean).join(" / ")
        )
      ) ?? null
    );
  },
  async workable(slug, http) {
    const data = await getJson<any>(http, `https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    return (
      data?.jobs?.map((j: any) =>
        job(j.title, j.url || j.shortlink, [j.city, j.state, j.country].filter(Boolean).join(", "))
      ) ?? null
    );
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Fetches a board's open roles from the provider's public API.
 * Returns null if the board can't be read.
 */
export async function fetchJobs(board: AtsBoard, http: Http): Promise<JobSummary | null> {
  const raw = await FETCHERS[board.provider](encodeURIComponent(board.slug), http);
  if (!raw) return null;
  const jobs = raw.filter((j): j is Job => j !== null);
  // Stable sort: UK roles first, otherwise in the board's own order
  const sorted = [...jobs].sort((a, b) => Number(b.uk) - Number(a.uk));
  return {
    provider: board.provider,
    total: jobs.length,
    uk: jobs.filter((j) => j.uk).length,
    top: sorted.slice(0, TOP_JOBS),
  };
}
