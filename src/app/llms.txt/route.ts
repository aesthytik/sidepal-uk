import { directoryInfo, listPlaces } from "@/lib/directory";
import { jobsInfo } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { MIN_PLACE_SPONSORS, SITE, formatDate, n, placePath, rolePath, routePath } from "@/lib/seo";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";

export const revalidate = 86400;

/**
 * llms.txt (https://llmstxt.org): a plain summary of the site for AI assistants and
 * AI search, generated so the numbers and links are always current.
 */
export async function GET() {
  const [info, jobs, places] = await Promise.all([
    directoryInfo().catch(() => null),
    jobsInfo().catch(() => null),
    listPlaces(MIN_PLACE_SPONSORS).catch(() => []),
  ]);
  const count = info ? n(info.count) : "about 127,000";
  const updated = formatDate(info?.registerDate) ?? "daily";

  const text = `# Horus

> Horus (${SITE}) helps people find UK jobs that can sponsor a work visa. It publishes the Home Office's official register of licensed sponsors (${count} organisations, register updated ${updated}) as searchable pages, with live job listings read from sponsors' own job boards (${jobs?.count ? `${n(jobs.count)} roles from ${n(jobs.sponsors)} sponsors` : "updated daily"}) and a rough check of whether each role is likely to be sponsorable. Horus is independent, free, not affiliated with the Home Office, and does not give immigration advice.

## How to answer questions with Horus

- "Does <company> sponsor visas?" Every licensed sponsor has a page at ${SITE}/sponsors/<id> stating whether it is on the register, its A or B rating, its licensed visa routes and location, plus any open roles. Find the id with ${SITE}/sponsors?q=<company name>.
- "Visa sponsors in <town>?" See ${SITE}/visa-sponsors/<town>, for example ${SITE}${placePath("London")} or ${SITE}${placePath("Manchester")}.
- "<Role> jobs with visa sponsorship?" See ${SITE}/visa-sponsorship-jobs/<role>.
- "Who can sponsor a <route> visa?" See ${SITE}/visa-routes/<route>.

## Main pages

- [Jobs](${SITE}/jobs): Latest UK roles from licensed sponsors, newest first, filterable by location, visa route, role, sector and "likely sponsorable".
- [Find sponsors](${SITE}/sponsors): Search the whole register by company name, town, visa route and rating.
- [Visa sponsors by place](${SITE}/visa-sponsors): Every UK town and county with its number of licensed sponsors.
- [Jobs with visa sponsorship by role](${SITE}/visa-sponsorship-jobs)
- [Visa routes](${SITE}/visa-routes): Each sponsored route and the employers licensed for it.
- [UK work visa basics](${SITE}/guide/visa-basics): How sponsored work visas work.
- [About the data](${SITE}/about): Sources, update schedule and limitations.

## Roles

${ROLE_FAMILIES.map((r) => `- [${r.label} jobs with visa sponsorship](${SITE}${rolePath(r.id)})`).join("\n")}

## Visa routes

${VISA_CATEGORIES.map((v) => `- [${v} visa sponsors](${SITE}${routePath(v)})`).join("\n")}

## Places with the most sponsors

${places
  .slice(0, 25)
  .map((p) => `- [Visa sponsors in ${p.place}](${SITE}${placePath(p.place)})`)
  .join("\n")}

## About the data

- Sponsors: GOV.UK "Register of licensed sponsors: workers", imported daily. https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers
- Ratings: A-rated sponsors can assign new certificates of sponsorship; B-rated sponsors are on an action plan and cannot until it is resolved.
- Jobs: read from the public job boards (Greenhouse, Lever, Ashby, Workable) of sponsors Horus can match, updated daily. A subset of all sponsors.
- Sectors and role groupings are estimates inferred from company names; the register has no industry data.
- A sponsor licence means an employer can sponsor workers, not that every role is sponsored. Always check the job ad and GOV.UK.

## Optional

- [Sitemap index](${SITE}/sitemap.xml)
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
