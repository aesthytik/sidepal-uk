/** A fetch-compatible function: the global fetch in production, a fake in tests. */
export type Http = (url: string, init?: RequestInit) => Promise<Response>;

const USER_AGENT = "Mozilla/5.0 (compatible; HorusSponsorFinder/1.0)";
const TIMEOUT_MS = 6000;
// Some homepages inline megabytes of images before their footer links
const MAX_HTML = 2_000_000;

export function request(http: Http, url: string, method: "GET" | "HEAD" = "GET") {
  return http(url, {
    method,
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** GETs a page, returning its final URL (after redirects) and HTML, or null. */
export async function getPage(http: Http, url: string): Promise<{ url: string; html: string } | null> {
  try {
    const res = await request(http, url);
    if (!res.ok) return null;
    return { url: res.url || url, html: (await res.text()).slice(0, MAX_HTML) };
  } catch {
    return null;
  }
}

export async function getJson<T>(http: Http, url: string): Promise<T | null> {
  try {
    const res = await request(http, url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Whether a URL answers with a 2xx. Falls back to GET for servers that reject HEAD. */
export async function exists(http: Http, url: string): Promise<boolean> {
  try {
    let res = await request(http, url, "HEAD");
    if (res.status === 405 || res.status === 403) {
      res = await request(http, url);
      res.body?.cancel().catch(() => {});
    }
    return res.ok;
  } catch {
    return false;
  }
}
