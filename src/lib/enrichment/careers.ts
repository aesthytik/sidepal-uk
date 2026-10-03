import { type AtsBoard, detectAts } from "./ats";
import { type Http, exists, getPage } from "./http";

const COMMON_CAREER_PATHS = [
  "/careers",
  "/jobs",
  "/join-us",
  "/vacancies",
  "/work-with-us",
  "/work-for-us",
  "/about/careers",
  "/career",
];

const CAREER_KEYWORDS = [
  "career",
  "job",
  "join us",
  "join our team",
  "vacanc",
  "work with us",
  "work for us",
  "recruitment",
];

// Links from a careers landing page to the actual job list
const OPENINGS_KEYWORDS = ["open role", "open position", "vacanc", "current opening", "all jobs", "view jobs", "see jobs"];

/** The first link on a page whose text or URL contains one of `keywords`. */
function findLink(html: string, baseUrl: string, keywords: string[]): string | null {
  const linkRegex = /<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const [, href, rawText] of html.matchAll(linkRegex)) {
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    const text = rawText.replace(/<[^>]+>/g, " ").toLowerCase();
    const hrefLower = href.toLowerCase();
    if (keywords.some((k) => text.includes(k) || hrefLower.includes(k.replace(/ /g, "-")))) {
      try {
        return new URL(href, baseUrl).toString();
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function probeCommonPaths(http: Http, baseUrl: string): Promise<string | null> {
  // Single-page apps answer 200 for any path, which would make every probe succeed
  if (await exists(http, `${baseUrl}/this-page-should-not-exist-${Date.now()}`)) return null;
  const found = await Promise.all(
    COMMON_CAREER_PATHS.map(async (p) => ((await exists(http, baseUrl + p)) ? baseUrl + p : null))
  );
  return found.find(Boolean) ?? null;
}

function isHomepage(url: string): boolean {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") === "";
  } catch {
    return false;
  }
}

/**
 * Finds a company's careers page and, if it is hosted on (or embeds) a
 * known ATS, that job board. Follows at most one extra "open roles" link.
 */
export async function findCareers(
  http: Http,
  website: string
): Promise<{ careersUrl: string | null; ats: AtsBoard | null }> {
  const baseUrl = website.replace(/\/+$/, "");
  const home = await getPage(http, baseUrl);
  const homeAts = home ? detectAts(home.html) : null;

  const link =
    (home && findLink(home.html, home.url, CAREER_KEYWORDS)) ?? (await probeCommonPaths(http, baseUrl));
  if (!link) return { careersUrl: null, ats: homeAts };

  // The link itself may point at the ATS
  const linkAts = detectAts(link);
  if (linkAts) return { careersUrl: link, ats: linkAts };

  const page = await getPage(http, link);
  // A "careers" link that redirects to the homepage isn't a careers page
  if (!page || isHomepage(page.url)) return { careersUrl: page ? null : link, ats: homeAts };

  let ats = detectAts(page.url) ?? detectAts(page.html);
  if (!ats) {
    const openings = findLink(page.html, page.url, OPENINGS_KEYWORDS);
    if (openings && openings !== page.url) {
      ats = detectAts(openings);
      if (!ats) {
        const list = await getPage(http, openings);
        ats = list ? detectAts(list.url) ?? detectAts(list.html) : null;
      }
    }
  }
  return { careersUrl: page.url, ats: ats ?? homeAts };
}
