/**
 * Common paths where career pages might be found
 */
const COMMON_CAREER_PATHS = [
  "/careers",
  "/jobs",
  "/join-us",
  "/vacancies",
  "/work-with-us",
  "/work-for-us",
  "/careers/",
  "/about/careers",
  "/career",
  "/join",
];

/**
 * Keywords that might indicate a link is to a careers page
 */
const CAREER_KEYWORDS = [
  "career",
  "job",
  "join us",
  "join our team",
  "vacanc",
  "work with us",
  "work for us",
  "recruitment",
  "opportunities",
];

const USER_AGENT = "Mozilla/5.0 (compatible; SidepalSponsorFinder/1.0)";
const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, method: "GET" | "HEAD") {
  return fetch(url, {
    method,
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/**
 * Checks if a URL exists. Falls back to GET for servers that reject HEAD.
 */
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    let res = await fetchWithTimeout(url, "HEAD");
    if (res.status === 405 || res.status === 403) {
      res = await fetchWithTimeout(url, "GET");
      res.body?.cancel().catch(() => {});
    }
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Extracts career page URL from HTML by scanning for links with career-related keywords
 */
function extractCareerUrlFromHtml(html: string, baseUrl: string): string | null {
  const linkRegex = /<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const [, href, rawText] = match;
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }

    const linkText = rawText.replace(/<[^>]+>/g, " ").toLowerCase();
    const hrefLower = href.toLowerCase();
    const isCareerLink = CAREER_KEYWORDS.some(
      (k) => linkText.includes(k) || hrefLower.includes(k.replace(/ /g, "-"))
    );

    if (isCareerLink) {
      try {
        return new URL(href, `${baseUrl}/`).toString();
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Attempts to find a career/jobs page URL for a company
 * @param websiteUrl The company's main website URL
 * @param homepageHtml Optional HTML content from the company's homepage
 * @returns The career page URL if found, null otherwise
 */
export async function findCareerUrl(
  websiteUrl: string,
  homepageHtml?: string
): Promise<string | null> {
  try {
    if (!websiteUrl || websiteUrl === "unknown") return null;

    const baseUrl = websiteUrl.replace(/\/+$/, "");

    // 1. Scan homepage links - most reliable signal
    let html = homepageHtml;
    if (!html) {
      try {
        const res = await fetchWithTimeout(baseUrl, "GET");
        if (res.ok) html = await res.text();
      } catch {
        // Homepage unreachable; fall through to path probing
      }
    }
    if (html) {
      const fromHtml = extractCareerUrlFromHtml(html, baseUrl);
      if (fromHtml) return fromHtml;
    }

    // 2. Probe common paths, unless the site answers 200 for any path
    // (single-page apps), which would make every probe look successful.
    const catchAll = await checkUrlExists(
      `${baseUrl}/this-page-should-not-exist-${Date.now()}`
    );
    if (catchAll) return null;

    const results = await Promise.all(
      COMMON_CAREER_PATHS.map(async (p) =>
        (await checkUrlExists(`${baseUrl}${p}`)) ? `${baseUrl}${p}` : null
      )
    );
    return results.find(Boolean) ?? null;
  } catch (error) {
    console.error(`Error finding career URL for ${websiteUrl}:`, error);
    return null;
  }
}
