import { type Http, getJson, getPage } from "./http";

export interface WebsiteDeps {
  http: Http;
  /** Whether a domain has DNS records. */
  resolves: (domain: string) => Promise<boolean>;
  google?: { key: string; cx: string };
}

/**
 * Directory / aggregator sites that search results often return instead of
 * the company's own website. These are never a company's official domain.
 */
const BLOCKED_HOSTS = [
  "gov.uk",
  "cqc.org.uk",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "yell.com",
  "endole.co.uk",
  "companycheck.co.uk",
  "opencorporates.com",
  "bizdb.co.uk",
  "glassdoor.com",
  "glassdoor.co.uk",
  "indeed.com",
  "indeed.co.uk",
  "wikipedia.org",
  "google.com",
  "trustpilot.com",
];

function isCompanySite(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return !BLOCKED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const LEGAL_SUFFIXES =
  /\b(limited|ltd|llp|llc|plc|inc|uk|group|holdings|company|co|the|t\/a|services|international)\b/g;

/** "Acme Widgets (UK) Limited" -> "acmewidgets" */
function coreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks that a homepage mentions the company, so that a guessed domain
 * like "abc.com" isn't attributed to "ABC Care Ltd".
 */
async function mentionsCompany(http: Http, url: string, name: string): Promise<boolean> {
  const page = await getPage(http, url);
  if (!page) return false;
  const html = page.html.toLowerCase();
  const core = coreName(name);
  if (core.length >= 4 && html.replace(/[^a-z0-9]/g, "").includes(core)) return true;

  // Fall back to requiring every significant word of the name
  const words = name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(LEGAL_SUFFIXES, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  return words.length > 0 && words.every((w) => html.includes(w));
}

async function viaGoogle(deps: WebsiteDeps, name: string, city?: string): Promise<string | null> {
  if (!deps.google) return null;
  const q = `${name} ${city || ""} official website`;
  const url =
    `https://www.googleapis.com/customsearch/v1?num=5` +
    `&key=${encodeURIComponent(deps.google.key)}&cx=${encodeURIComponent(deps.google.cx)}` +
    `&q=${encodeURIComponent(q)}`;
  const data = await getJson<{ items?: { link: string }[] }>(deps.http, url);
  for (const item of data?.items ?? []) {
    if (isCompanySite(item.link)) return new URL(item.link).origin;
  }
  return null;
}

const TRADING_AS = /\b(?:t\/as?|trading as)\b/i;

/**
 * Domain stems to try, most specific first: the trading name for
 * "Roofoods Ltd t/a Deliveroo", then the full name, then its first word
 * ("Monzo Bank Ltd" -> monzo).
 */
function domainStems(name: string): string[] {
  const [legal, trading] = name.split(TRADING_AS);
  const stems: string[] = [];
  for (const part of trading ? [trading, legal] : [legal]) {
    const core = coreName(part);
    const firstWord = coreName(part.trim().split(/\s+/)[0] || "");
    // Very short names (e.g. "023") match unrelated domains far too often
    if (core.length >= 4) stems.push(core);
    if (firstWord.length >= 5) stems.push(firstWord);
  }
  return Array.from(new Set(stems));
}

/** Guesses common domains from the name, then verifies the site is theirs. */
async function viaDomainGuess(deps: WebsiteDeps, name: string): Promise<string | null> {
  const stems = domainStems(name);
  if (stems.length === 0) return null;
  const candidates = stems.flatMap((stem) =>
    [".co.uk", ".com", ".uk", ".org.uk", ".org", ".io"].map((tld) => stem + tld)
  );

  const resolved = await Promise.all(
    candidates.map(async (d) => ((await deps.resolves(d).catch(() => false)) ? d : null))
  );
  for (const domain of resolved) {
    const brand = name.split(TRADING_AS)[1] ?? name;
    if (domain && (await mentionsCompany(deps.http, `https://${domain}`, brand))) {
      return `https://${domain}`;
    }
  }
  return null;
}

/** The company's official website origin, or null if it can't be found. */
export async function findWebsite(deps: WebsiteDeps, name: string, city?: string): Promise<string | null> {
  return (await viaGoogle(deps, name, city)) ?? (await viaDomainGuess(deps, name));
}
