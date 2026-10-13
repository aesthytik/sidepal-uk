import { ROLE_FAMILIES, roleFamily } from "./sectors/taxonomy";
import { VISA_CATEGORIES } from "./sponsorTypes";

export const SITE = "https://horus.to";

/** "Newcastle Upon Tyne" -> "newcastle-upon-tyne". Used for place, role and route URLs. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const sponsorPath = (id: string) => `/sponsors/${id}`;
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

export function itemList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: `${SITE}${item.path}` })),
  };
}
