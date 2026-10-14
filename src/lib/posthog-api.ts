// Server-only reads from PostHog's API, for the admin analytics page. Needs a personal API key
// with the query:read and session_recording:read scopes (the public phc_ token can't read data).
const HOST = "https://us.posthog.com";

function config() {
  // Trimmed because pasted dashboard values often pick up a stray space or newline
  const key = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const project = process.env.POSTHOG_PROJECT_ID?.trim();
  if (!key || !project) throw new Error("Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to load analytics");
  return { key, project };
}

async function posthog<T>(path: string, init?: RequestInit): Promise<T> {
  const { key, project } = config();
  const res = await fetch(`${HOST}/api/projects/${project}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`PostHog ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function hogql<Row extends unknown[]>(query: string): Promise<Row[]> {
  const data = await posthog<{ results: Row[] }>("/query/", {
    method: "POST",
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  return data.results;
}

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export type Overview = {
  visitors: number;
  pageviews: number;
  sessions: number;
  daily: { date: string; visitors: number; pageviews: number }[];
  topPages: { path: string; views: number; visitors: number }[];
  referrers: { domain: string; visitors: number }[];
};

export async function getOverview(days: Range): Promise<Overview> {
  // Live site only: skip local test traffic and our own admin pages. `days` comes from RANGES, so it's safe to inline.
  const where = `timestamp > now() - INTERVAL ${days} DAY
    AND properties.$host NOT LIKE 'localhost%'
    AND properties.$pathname NOT LIKE '/admin%'`;

  const [[totals], daily, topPages, referrers] = await Promise.all([
    hogql<[number, number, number]>(
      `SELECT uniq(distinct_id), countIf(event = '$pageview'), uniq(properties.$session_id) FROM events WHERE ${where}`,
    ),
    hogql<[string, number, number]>(
      `SELECT toDate(timestamp) AS day, uniq(distinct_id), count() FROM events
       WHERE event = '$pageview' AND ${where} GROUP BY day ORDER BY day`,
    ),
    hogql<[string, number, number]>(
      `SELECT properties.$pathname AS path, count() AS views, uniq(distinct_id) FROM events
       WHERE event = '$pageview' AND ${where} GROUP BY path ORDER BY views DESC LIMIT 10`,
    ),
    hogql<[string, number]>(
      `SELECT properties.$referring_domain AS domain, uniq(distinct_id) AS visitors FROM events
       WHERE event = '$pageview' AND ${where} AND domain NOT IN ('$direct', 'horus.to') AND domain != ''
       GROUP BY domain ORDER BY visitors DESC LIMIT 8`,
    ),
  ]);

  return {
    visitors: totals?.[0] ?? 0,
    pageviews: totals?.[1] ?? 0,
    sessions: totals?.[2] ?? 0,
    daily: fillDays(days, daily),
    topPages: topPages.map(([path, views, visitors]) => ({ path, views, visitors })),
    referrers: referrers.map(([domain, visitors]) => ({ domain, visitors })),
  };
}

/** One entry per day in the range, so days with no traffic show as zero instead of disappearing. */
function fillDays(days: number, rows: [string, number, number][]) {
  const byDay = new Map(rows.map(([date, visitors, pageviews]) => [date.slice(0, 10), { visitors, pageviews }]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date, ...(byDay.get(date) ?? { visitors: 0, pageviews: 0 }) };
  });
}

export type Recording = {
  id: string;
  startTime: string;
  durationSeconds: number;
  activeSeconds: number;
  startUrl: string | null;
  clicks: number;
  country: string | null;
  browser: string | null;
  device: string | null;
  url: string;
};

type RawRecording = {
  id: string;
  start_time: string;
  recording_duration: number;
  active_seconds?: number;
  start_url?: string | null;
  click_count?: number;
  person?: { properties?: Record<string, string | undefined> };
};

export async function getRecordings(limit = 20): Promise<Recording[]> {
  const { project } = config();
  const data = await posthog<{ results: RawRecording[] }>(`/session_recordings/?limit=${limit}`);
  return data.results.map((r) => {
    const props = r.person?.properties ?? {};
    return {
      id: r.id,
      startTime: r.start_time,
      durationSeconds: r.recording_duration,
      activeSeconds: r.active_seconds ?? 0,
      startUrl: r.start_url ?? null,
      clicks: r.click_count ?? 0,
      country: props.$geoip_country_name ?? null,
      browser: props.$browser ?? null,
      device: props.$device_type ?? null,
      url: `${HOST}/project/${project}/replay/${r.id}`,
    };
  });
}
