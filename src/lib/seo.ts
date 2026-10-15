import type { Metadata } from "next";
import { ROLE_FAMILIES, roleFamily } from "./sectors/taxonomy";
import { VISA_CATEGORIES } from "./sponsorTypes";

export const SITE = "https://horus.to";
export const SITE_NAME = "Horus";
export const SITE_TITLE = "UK Visa Sponsorship Jobs & Licensed Sponsors";
export const SITE_DESCRIPTION = "Find UK visa sponsorship jobs and licensed employers using the Home Office register. Browse jobs, check Skilled Worker salary requirements and track applications.";

/** Keep each page's search result, canonical URL and sharing previews in sync. */
export function pageMetadata({ title, description, path, noIndex = false }: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const brandedTitle = `${title} | ${SITE_NAME}`;
  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: brandedTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: "Horus — UK visa sponsorship jobs and licensed sponsors" }],
    },
    twitter: { card: "summary_large_image", title: brandedTitle, description, images: [`${SITE}/twitter-image`] },
    ...(noIndex && { robots: { index: false, follow: true } }),
  };
}

/** "Newcastle Upon Tyne" -> "newcastle-upon-tyne". Used for place, role and route URLs. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const sponsorPath = (id: string) => `/sponsors/${id}`;
export const SPONSOR_CHANGES_PATH = "/sponsors/new";
export const placePath = (place: string) => `/visa-sponsors/${slug(place)}`;
export const routePath = (route: string) => `/visa-routes/${slug(route)}`;
export const rolePath = (roleId: string) => `/visa-sponsorship-jobs/${roleId}`;
export const SALARY_CHECKER_PATH = "/visa-salary-checker";
/** "/visa-salary-checker/2134-programmers-and-software-development-professionals" */
export const occupationPath = (occ: { code: string; title: string }) => `${SALARY_CHECKER_PATH}/${occ.code}-${slug(occ.title)}`;

export function routeFromSlug(s: string): string | undefined {
  return VISA_CATEGORIES.find((v) => slug(v) === s);
}

export function roleFromSlug(s: string) {
  return roleFamily(s);
}

export const ROLE_IDS = ROLE_FAMILIES.map((r) => r.id);

/** Places with enough sponsors to deserve their own page. */
export const MIN_PLACE_SPONSORS = 15;

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export const n = (value: number) => value.toLocaleString("en-GB");

/** Rating in words, for answers like "Yes, it has an A rating". */
export function ratingSentence(rating: string): string {
  if (rating.startsWith("A")) {
    return `It holds an ${rating} rating, which means it is fully trusted by the Home Office and can assign new certificates of sponsorship.`;
  }
  if (rating.startsWith("B")) {
    return `It holds a ${rating} rating: it is on a Home Office action plan and cannot assign new certificates of sponsorship until that is resolved.`;
  }
  return "The register does not list a rating for it.";
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

export function faq(entries: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function itemList(items: { name: string; path: string }[], offset = 0) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: offset + i + 1, name: item.name, url: `${SITE}${item.path}` })),
  };
}

/**
 * Short, stable id for a job, from its URL (jobs have no id of their own). Pure JS (cyrb53) rather
 * than node:crypto because client components build job links too.
 */
export function jobId(url: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(11, "0");
}

/** "/jobs/senior-software-engineer-0k3x9q2m1ab" */
export const jobPath = (job: { title: string; url: string }) => `/jobs/${[slug(job.title), jobId(job.url)].filter(Boolean).join("-")}`;

/** The id at the end of a job slug. */
export const jobIdFromSlug = (s: string) => s.slice(-11);

const SALARY_UNIT: Record<string, string> = { year: "YEAR", month: "MONTH", week: "WEEK", day: "DAY", hour: "HOUR" };
const REMOTE = /\bremote\b|\banywhere\b/i;
const OFFICE = /\bhybrid\b|\bon[ -]?site\b|\boffice\b/i;

/**
 * JobPosting structured data for a job's own page (Google for Jobs). Null for roles outside the UK
 * or without an original posting date or description. The caller must supply the full ad.
 * An unknown closing date is omitted, as required by Google's job posting guidelines.
 */
export function jobPostingLd(
  job: { title: string; url: string; location: string; uk: boolean; postedAt?: string; validThrough?: string; sponsor: string; sponsorId: string; salary?: { min?: number; max?: number; currency: string; period: string } },
  description: string,
  now = new Date()
) {
  const posted = job.postedAt ? new Date(job.postedAt) : null;
  const validThrough = job.validThrough ? new Date(job.validThrough) : null;
  if (!job.uk || !description.trim() || !posted || !Number.isFinite(posted.getTime())) return null;
  if (validThrough && (!Number.isFinite(validThrough.getTime()) || validThrough <= now)) return null;
  const remote = REMOTE.test(job.location) && !OFFICE.test(job.location);
  const town = job.location.split(/[,;|/]/).map((part) => part.replace(/\([^)]*\)|\b(?:hybrid|remote)\b/gi, "").trim())
    .find((part) => part && !/^(?:UK|GB|United Kingdom|anywhere)$/i.test(part));
  if (!remote && !job.location.trim()) return null;
  const s = job.salary;
  const value = s && (s.min ?? s.max);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: description.trim(),
    identifier: { "@type": "PropertyValue", name: job.sponsor, value: jobId(job.url) },
    datePosted: posted.toISOString(),
    ...(validThrough && { validThrough: validThrough.toISOString() }),
    url: `${SITE}${jobPath(job)}`,
    directApply: false,
    hiringOrganization: { "@type": "Organization", "@id": `${SITE}${sponsorPath(job.sponsorId)}#org`, name: job.sponsor },
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "United Kingdom" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", ...(town && { addressLocality: town }), addressCountry: "GB" },
          },
        }),
    ...(s && value && Number.isFinite(value) && value > 0 && /^[A-Z]{3}$/.test(s.currency) && SALARY_UNIT[s.period] && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: s.currency,
        value: {
          "@type": "QuantitativeValue",
          unitText: SALARY_UNIT[s.period],
          ...(s.min !== undefined && s.max !== undefined && s.min !== s.max ? { minValue: s.min, maxValue: s.max } : { value }),
        },
      },
    }),
  };
}
