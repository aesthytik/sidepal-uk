import type { SectorId } from "../sectors/taxonomy";
import type { AtsProvider, Salary, Sponsor } from "../sponsorTypes";
import type { IndexedJob } from "../jobs/indexer";

export interface SponsorRow {
  id: string;
  name: string;
  city: string;
  county: string;
  location: string;
  rating: string;
  routes: string[];
  visa_types: string[];
  sector: string | null;
}

export interface JobRow {
  url: string;
  sponsor_id: string;
  title: string;
  location: string;
  uk: boolean;
  snippet: string | null;
  posted_at: string | null;
  department: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  provider: string;
  sponsor: string | null;
  rating: string | null;
  sector: string | null;
  visa_types: string[] | null;
}

export const SPONSOR_COLUMNS = "id,name,city,county,location,rating,routes,visa_types,sector";

export function rowToSponsor(r: SponsorRow): Sponsor {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    county: r.county,
    location: r.location,
    rating: r.rating,
    routes: r.routes,
    visaTypes: r.visa_types,
    sector: (r.sector ?? undefined) as SectorId | undefined,
  };
}

export function sponsorToRow(
  s: Sponsor,
  ord: number,
  extra: { overrides: Record<string, SectorId | null>; registerDate: string | null; stamp: string }
) {
  const overridden = Object.prototype.hasOwnProperty.call(extra.overrides, s.name);
  return {
    id: s.id,
    name: s.name,
    city: s.city,
    county: s.county,
    location: s.location,
    rating: s.rating,
    routes: s.routes,
    visa_types: s.visaTypes,
    sector: s.sector ?? null,
    sector_override: overridden ? extra.overrides[s.name] : null,
    override_set: overridden,
    ord,
    register_date: extra.registerDate,
    updated_at: extra.stamp,
  };
}

export function rowToJob(r: JobRow): IndexedJob {
  const salary: Salary | undefined =
    r.salary_currency && r.salary_period
      ? {
          ...(r.salary_min !== null && { min: Number(r.salary_min) }),
          ...(r.salary_max !== null && { max: Number(r.salary_max) }),
          currency: r.salary_currency,
          period: r.salary_period as Salary["period"],
        }
      : undefined;
  return {
    title: r.title,
    url: r.url,
    location: r.location,
    uk: r.uk,
    ...(salary && { salary }),
    ...(r.snippet && { snippet: r.snippet }),
    ...(r.posted_at && { postedAt: new Date(r.posted_at).toISOString() }),
    ...(r.department && { department: r.department }),
    sponsorId: r.sponsor_id,
    sponsor: r.sponsor ?? "",
    rating: r.rating ?? "",
    ...(r.sector && { sector: r.sector as SectorId }),
    visaTypes: r.visa_types ?? [],
    provider: r.provider as AtsProvider,
  };
}

export function jobToRow(j: IndexedJob, seenAt: string) {
  return {
    url: j.url,
    sponsor_id: j.sponsorId,
    title: j.title,
    location: j.location,
    uk: j.uk,
    snippet: j.snippet ?? null,
    posted_at: j.postedAt ? new Date(j.postedAt).toISOString() : null,
    department: j.department ?? null,
    salary_min: j.salary?.min ?? null,
    salary_max: j.salary?.max ?? null,
    salary_currency: j.salary?.currency ?? null,
    salary_period: j.salary?.period ?? null,
    provider: j.provider,
    last_seen_at: seenAt,
  };
}
