/**
 * Common paths where career pages might be found
 */
const COMMON_CAREER_PATHS = [
  "/careers",
  "/jobs",
  "/join-us",
  "/join",
  "/work-with-us",
  "/work-for-us",
  "/opportunities",
  "/employment",
  "/vacancies",
  "/career",
];

/**
 * Keywords that might indicate a link is to a careers page
 */
const CAREER_KEYWORDS = [
  "career",
  "careers",
  "job",
  "jobs",
  "join",
  "vacancy",
  "vacancies",
  "opportunity",
  "opportunities",
  "work with us",
  "work for us",
  "employment",
];

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
    if (!websiteUrl || websiteUrl === "unknown") {
      return null;
    }

    // Normalize the website URL
    const baseUrl = websiteUrl.endsWith("/")
      ? websiteUrl.slice(0, -1)
      : websiteUrl;

    // 1. First try common paths
    for (const path of COMMON_CAREER_PATHS) {
      const careerUrl = `${baseUrl}${path}`;
      const exists = await checkUrlExists(careerUrl);
      if (exists) {
        return careerUrl;
      }
    }

    // 2. If we have homepage HTML, scan for career links
    if (homepageHtml) {
      const careerUrl = extractCareerUrlFromHtml(homepageHtml, baseUrl);
      if (careerUrl) {
        return careerUrl;
      }
    } else {
      // 3. If we don't have HTML, fetch the homepage and scan it
      try {
        const response = await fetch(baseUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; UKTechSponsorFinder/1.0)",
          },
        });

        if (response.ok) {
          const html = await response.text();
          const careerUrl = extractCareerUrlFromHtml(html, baseUrl);
          if (careerUrl) {
            return careerUrl;
          }
        }
      } catch (error) {
        console.error(`Error fetching homepage for ${baseUrl}:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error finding career URL for ${websiteUrl}:`, error);
    return null;
  }
}

/**
 * Checks if a URL exists by making a HEAD request
 */
async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UKTechSponsorFinder/1.0)",
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts career page URL from HTML by scanning for links with career-related keywords
 */
function extractCareerUrlFromHtml(
  html: string,
  baseUrl: string
): string | null {
  try {
    // Simple regex to extract <a> tags with href attributes
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const [, href, linkText] = match;

      // Skip empty links, anchors, or javascript: links
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        continue;
      }

      // Check if the link text contains any career keywords
      const lowerLinkText = linkText.toLowerCase();
      const hasCareerKeyword = CAREER_KEYWORDS.some((keyword) =>
        lowerLinkText.includes(keyword)
      );

      if (hasCareerKeyword) {
        // Resolve relative URLs
        if (href.startsWith("/")) {
          return `${baseUrl}${href}`;
        } else if (!href.startsWith("http")) {
          return `${baseUrl}/${href}`;
        }
        return href;
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting career URL from HTML:", error);
    return null;
  }
}

/**
 * Bulk career URL discovery function
 * @param companies List of companies with website URLs
 * @param cacheMap Optional cache of already discovered career URLs
 * @returns Map of company names to career URLs
 */
export async function bulkFindCareerUrls(
  companies: { name: string; website: string; homepageHtml?: string }[],
  cacheMap: Map<string, string | null> = new Map()
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>(cacheMap);
  const queue = companies.filter((company) => !cacheMap.has(company.name));

  // Process in batches to avoid overwhelming servers
  const BATCH_SIZE = 10;
  const DELAY_MS = 2000; // 2 seconds between batches

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (company) => {
      const careerUrl = await findCareerUrl(
        company.website,
        company.homepageHtml
      );
      return { name: company.name, careerUrl };
    });

    const batchResults = await Promise.all(batchPromises);

    // Add results to map
    batchResults.forEach(({ name, careerUrl }) => {
      results.set(name, careerUrl);
    });

    // Log progress
    console.log(
      `Found career URLs for ${i + batch.length}/${queue.length} companies`
    );

    // Delay before next batch if not the last batch
    if (i + BATCH_SIZE < queue.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}
