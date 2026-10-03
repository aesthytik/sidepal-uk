import { ROLE_FAMILIES, SECTORS, isRoleId, isSectorId } from "../sectors/taxonomy";
import { VISA_CATEGORIES, POPULAR_LOCATIONS } from "../sponsorTypes";
import type { SearchFilters } from "../searchParams";
import { lastJsonObject } from "./json";
import { complete } from "./openrouter";

export const MAX_TEXT = 200;

const SYSTEM = `You convert a job seeker's request into search filters for a UK visa-sponsor directory.
Reply with ONLY a JSON object, no prose, with these optional keys:
- "q": company name, only if the user names a specific company
- "location": a UK town, city or county (examples: ${POPULAR_LOCATIONS.join(", ")})
- "visa": exactly one of: ${VISA_CATEGORIES.join("; ")}
- "rating": "A" only if the user wants A-rated / top-rated sponsors
- "sector": one of: ${SECTORS.map((s) => `${s.id} (${s.label})`).join("; ")}, only if the user names an industry
- "role": one of: ${ROLE_FAMILIES.map((r) => `${r.id} (${r.label})`).join("; ")}, only if the user names a kind of job
Omit keys you are unsure about. Never invent values.`;

/** Keeps only values the directory understands; `places` checks a location is real. */
export function sanitise(raw: unknown, places: (name: string) => string | undefined): SearchFilters {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const filters: SearchFilters = {};
  if (typeof r.q === "string" && r.q.trim()) filters.q = r.q.trim().slice(0, 80);
  if (typeof r.location === "string") {
    const place = places(r.location.trim().slice(0, 50));
    if (place) filters.location = place;
  }
  if (typeof r.visa === "string") {
    const visa = VISA_CATEGORIES.find((v) => v.toLowerCase() === (r.visa as string).trim().toLowerCase());
    if (visa) filters.visa = visa;
  }
  if (r.rating === "A") filters.rating = "A";
  if (isSectorId(r.sector)) filters.sector = r.sector;
  if (isRoleId(r.role)) filters.role = r.role;
  return filters;
}

export async function parseQuery(
  text: string,
  places: (name: string) => string | undefined
): Promise<SearchFilters> {
  const reply = await complete(SYSTEM, text.slice(0, MAX_TEXT));
  const filters = sanitise(lastJsonObject(reply), places);
  if (Object.keys(filters).length === 0) throw new Error("Model returned no usable filters");
  return filters;
}
