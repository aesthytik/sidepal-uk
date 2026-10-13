import type { AtsProvider, Job, JobSummary, Salary } from "../sponsorTypes";
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

const SNIPPET_LENGTH = 600;

/** Plain text from an HTML or plain description, cut to a short snippet. */
export function toSnippet(text: unknown): string | undefined {
  if (typeof text !== "string") return undefined;
  const plain = toPlainText(text).replace(/\s+/g, " ").trim();
  return plain ? plain.slice(0, SNIPPET_LENGTH) : undefined;
}

/** Readable plain text from a job description's HTML, keeping paragraphs and list items on their own lines. */
export function toPlainText(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped third-party JSON */
/**
 * The full description of one job on a known board, or null. Only builds URLs on the
 * providers' own API hosts, so it can't be pointed at arbitrary sites.
 */
export async function fetchJobDescription(jobUrl: string, board: AtsBoard, http: Http): Promise<string | null> {
  const slug = encodeURIComponent(board.slug);
  switch (board.provider) {
    case "greenhouse": {
      const id = jobUrl.match(/[?&]gh_jid=(\d+)/)?.[1] ?? jobUrl.match(/\/jobs\/(\d+)/)?.[1];
      if (!id) return null;
      const data = await getJson<any>(http, `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${id}`);
      return typeof data?.content === "string" ? toPlainText(data.content) : null;
    }
    case "lever": {
      const id = jobUrl.match(/jobs\.lever\.co\/[^/]+\/([0-9a-f-]{36})/i)?.[1];
      if (!id) return null;
      const j = await getJson<any>(http, `https://api.lever.co/v0/postings/${slug}/${id}?mode=json`);
      if (!j) return null;
      const lists = (j.lists ?? []).map((l: any) => `${l.text}\n${toPlainText(String(l.content ?? ""))}`);
      return [j.descriptionPlain, ...lists, j.additionalPlain].filter((s) => typeof s === "string" && s.trim()).join("\n\n").trim() || null;
    }
    case "ashby": {
      const data = await getJson<any>(http, `https://api.ashbyhq.com/posting-api/job-board/${slug}`);
      const j = data?.jobs?.find((x: any) => x.jobUrl === jobUrl || x.applyUrl === jobUrl);
      const text = j?.descriptionPlain ?? (j?.descriptionHtml && toPlainText(j.descriptionHtml));
      return typeof text === "string" ? text.trim() : null;
    }
    case "workable": {
      const data = await getJson<any>(http, `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`);
      const j = data?.jobs?.find((x: any) => x.url === jobUrl || x.shortlink === jobUrl);
      return typeof j?.description === "string" ? toPlainText(j.description) : null;
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const PERIODS: Record<string, Salary["period"]> = {
  year: "year", yearly: "year", annual: "year", "per-year-salary": "year", "1 year": "year",
  month: "month", monthly: "month", "1 month": "month",
  week: "week", weekly: "week",
  day: "day", daily: "day",
  hour: "hour", hourly: "hour", "per-hour-wage": "hour", "1 hour": "hour",
};

function salary(min: unknown, max: unknown, currency: unknown, interval: unknown): Salary | undefined {
  const lo = typeof min === "number" && min > 0 ? min : undefined;
  const hi = typeof max === "number" && max > 0 ? max : undefined;
  if (lo === undefined && hi === undefined) return undefined;
  const period = PERIODS[String(interval ?? "year").toLowerCase()] ?? "year";
  return { min: lo, max: hi, currency: typeof currency === "string" ? currency.toUpperCase() : "GBP", period };
}

/** An ISO date string from an ISO string or epoch milliseconds; undefined if unusable. */
function isoDate(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

function job(title: unknown, url: unknown, location: unknown, extra: Partial<Job> = {}): Job | null {
  if (typeof title !== "string" || typeof url !== "string") return null;
  const loc = typeof location === "string" ? location : "";
  const department = typeof extra.department === "string" && extra.department.trim() ? extra.department.trim() : undefined;
  return { title: title.trim(), url, location: loc, uk: isUkLocation(loc), ...extra, department };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped third-party JSON */
const FETCHERS: Record<AtsProvider, (slug: string, http: Http) => Promise<(Job | null)[] | null>> = {
  async greenhouse(slug, http) {
    const data = await getJson<any>(http, `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
    return (
      data?.jobs?.map((j: any) => {
        const pay = j.pay_input_ranges?.[0];
        return job(j.title, j.absolute_url, j.location?.name, {
          snippet: toSnippet(j.content),
          postedAt: isoDate(j.first_published ?? j.updated_at),
          department: j.departments?.[0]?.name,
          salary: pay && salary(pay.min_cents / 100, pay.max_cents / 100, pay.currency_type, "year"),
        });
      }) ?? null
    );
  },
  async lever(slug, http) {
    const data = await getJson<any>(http, `https://api.lever.co/v0/postings/${slug}?mode=json`);
    return Array.isArray(data)
      ? data.map((j: any) =>
          job(j.text, j.hostedUrl, (j.categories?.allLocations ?? [j.categories?.location]).filter(Boolean).join(" / "), {
            snippet: toSnippet(j.descriptionPlain),
            postedAt: isoDate(j.createdAt),
            department: j.categories?.department ?? j.categories?.team,
            salary: j.salaryRange && salary(j.salaryRange.min, j.salaryRange.max, j.salaryRange.currency, j.salaryRange.interval),
          })
        )
      : null;
  },
  async ashby(slug, http) {
    const data = await getJson<any>(http, `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
    return (
      data?.jobs?.map((j: any) => {
        const pay = j.compensation?.compensationTiers?.[0]?.components?.find((c: any) => c.compensationType === "Salary");
        return job(
          j.title,
          j.jobUrl,
          [j.location, ...(j.secondaryLocations ?? []).map((l: any) => l.location)].filter(Boolean).join(" / "),
          {
            snippet: toSnippet(j.descriptionPlain ?? j.descriptionHtml),
            postedAt: isoDate(j.publishedAt),
            department: j.department ?? j.team,
            salary: pay && salary(pay.minValue, pay.maxValue, pay.currencyCode, pay.interval),
          }
        );
      }) ?? null
    );
  },
  async workable(slug, http) {
    const data = await getJson<any>(http, `https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    return (
      data?.jobs?.map((j: any) =>
        job(j.title, j.url || j.shortlink, [j.city, j.state, j.country].filter(Boolean).join(", "), {
          snippet: toSnippet(j.description),
          postedAt: isoDate(j.published_on ?? j.created_at),
          department: j.department,
        })
      ) ?? null
    );
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Every open role on a board, or null if the board can't be read. */
export async function fetchAllJobs(board: AtsBoard, http: Http): Promise<Job[] | null> {
  const raw = await FETCHERS[board.provider](encodeURIComponent(board.slug), http);
  return raw ? raw.filter((j): j is Job => j !== null) : null;
}

/**
 * The company name a board reports for itself, where the provider offers one
 * (Greenhouse and Workable). Used to check a guessed board belongs to the sponsor.
 */
export async function boardName(board: AtsBoard, http: Http): Promise<string | null> {
  const slug = encodeURIComponent(board.slug);
  if (board.provider === "greenhouse") {
    const data = await getJson<{ name?: string }>(http, `https://boards-api.greenhouse.io/v1/boards/${slug}`);
    return data?.name ?? null;
  }
  if (board.provider === "workable") {
    const data = await getJson<{ name?: string }>(http, `https://apply.workable.com/api/v1/widget/accounts/${slug}`);
    return data?.name ?? null;
  }
  return null;
}

/**
 * Fetches a board's open roles from the provider's public API.
 * Returns null if the board can't be read.
 */
export async function fetchJobs(board: AtsBoard, http: Http, role?: RegExp): Promise<JobSummary | null> {
  const jobs = await fetchAllJobs(board, http);
  if (!jobs) return null;
  // Stable sort: roles matching the requested role first, then UK roles, otherwise the board's own order
  const matches = (j: Job) => Number(role?.test(j.title) ?? false);
  const sorted = [...jobs].sort((a, b) => matches(b) - matches(a) || Number(b.uk) - Number(a.uk));
  return {
    ...(role && { matching: jobs.filter((j) => matches(j)).length }),
    provider: board.provider,
    total: jobs.length,
    uk: jobs.filter((j) => j.uk).length,
    top: sorted.slice(0, TOP_JOBS),
  };
}
