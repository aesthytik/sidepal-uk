import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs, FaqList, SponsorList } from "@/components/seo";
import { countSponsors, directoryInfo, listPlaces, searchSponsors } from "@/lib/directory";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";
import { MIN_PLACE_SPONSORS, breadcrumbs, faq, formatDate, itemList, n, routeFromSlug, routePath, sponsorPath, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;
// Rendered on first request and cached, like place pages: building all routes at once
// ran enough sponsor counts in parallel to hit the database's statement timeout
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ route: string }> };

// Short, deliberately general descriptions; the GOV.UK link is the source of truth for the rules
const ABOUT: Record<string, { what: string; gov: string }> = {
  "Skilled Worker": {
    what: "the main route for sponsored jobs. You need a job offer from a licensed sponsor in an eligible occupation that meets the salary requirements, and it can lead to settlement.",
    gov: "https://www.gov.uk/skilled-worker-visa",
  },
  "Global Business Mobility": {
    what: "for people moved to the UK by an overseas employer, such as Senior or Specialist Workers and Graduate Trainees. It is temporary.",
    gov: "https://www.gov.uk/browse/visas-immigration/work-visas",
  },
  "Scale-up": {
    what: "for skilled roles at fast-growing UK businesses. After the first six months you can change employer without a new sponsor.",
    gov: "https://www.gov.uk/scale-up-worker-visa",
  },
  "Creative Worker": { what: "for people working in the creative industries, such as entertainment or the arts, for up to two years.", gov: "https://www.gov.uk/creative-worker-visa" },
  "Charity Worker": { what: "for unpaid voluntary work for a charity, for up to a year.", gov: "https://www.gov.uk/temporary-worker-charity-worker-visa" },
  "Religious Worker": { what: "for religious work, such as preaching or working in a religious order, and for ministers of religion.", gov: "https://www.gov.uk/religious-worker-visa" },
  "International Sportsperson": { what: "for elite sportspeople and qualified coaches.", gov: "https://www.gov.uk/sportsperson-visa" },
  "Government Authorised Exchange": { what: "for work experience, research, training or fellowships through approved exchange schemes.", gov: "https://www.gov.uk/government-authorised-exchange" },
  "International Agreement": { what: "for work covered by international law, such as for a foreign government or as a private servant in a diplomatic household.", gov: "https://www.gov.uk/international-agreement-worker-visa" },
  "Seasonal Worker": { what: "for seasonal work in horticulture or poultry, for a limited period.", gov: "https://www.gov.uk/seasonal-worker-visa" },
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const route = routeFromSlug((await params).route);
  if (!route) return { title: "Route not found", robots: { index: false } };
  const total = await countSponsors({ visa: route }).catch(() => null);
  const title = `${route} visa sponsors in the UK${total ? `: ${n(total)} licensed employers` : ""}`;
  const description = `${total ? n(total) : "All"} employers licensed by the Home Office to sponsor ${route} visas. Browse them by town, see A-rated sponsors and live jobs.`;
  return pageMetadata({ title, description, path: routePath(route) });
}

export default async function RoutePage({ params }: Params) {
  const route = routeFromSlug((await params).route);
  if (!route) notFound();

  const [total, aRated, top, places, info] = await Promise.all([
    countSponsors({ visa: route }),
    countSponsors({ visa: route, rating: "A" }),
    searchSponsors({ visa: route, rating: "A", limit: 50 }),
    listPlaces(MIN_PLACE_SPONSORS).catch(() => []),
    directoryInfo().catch(() => null),
  ]);
  const about = ABOUT[route];
  const updated = formatDate(info?.registerDate);
  const answer = `${n(total)} employers are licensed to sponsor ${route} visas, according to the Home Office register${
    updated ? ` updated ${updated}` : ""
  }. ${n(aRated)} of them are A-rated. ${about ? `${route} is ${about.what}` : ""}`;

  const faqs = [
    { q: `How many employers can sponsor ${route} visas?`, a: `${n(total)} licensed employers, ${n(aRated)} of them A-rated.` },
    {
      q: `How do I find a ${route} visa sponsor?`,
      a: `Search the register of licensed sponsors on Horus by town or company name, filtered to the ${route} route, then check each employer's job ads for roles that offer sponsorship.`,
    },
    ...(about ? [{ q: `What is the ${route} visa?`, a: `The ${route} visa is ${about.what} Check the current rules on GOV.UK before applying.` }] : []),
  ];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa routes", path: "/visa-routes" },
    { name: route, path: routePath(route) },
  ];

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={[breadcrumbs(crumbs), faq(faqs), itemList(top.items.map((s) => ({ name: s.name, path: sponsorPath(s.id) })))]} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <p className="eyebrow">UK visa route</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{route} visa sponsors</h1>
        <Answer>{answer}</Answer>
        {about && (
          <p className="mt-3 text-sm">
            <a href={about.gov} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Current {route} rules on GOV.UK →
            </a>
          </p>
        )}
      </header>

      <section className="mt-12" aria-labelledby="sponsors">
        <h2 id="sponsors" className="font-display text-2xl">
          A-rated {route} sponsors
        </h2>
        <div className="mt-4">
          <SponsorList sponsors={top.items} />
        </div>
        <p className="mt-4 text-sm">
          <Link href={`/sponsors?visa=${encodeURIComponent(route)}`} className="font-medium text-primary hover:underline">
            Search all {n(total)} {route} sponsors →
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="places">
        <h2 id="places" className="font-display text-2xl">
          {route} sponsors by place
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {places.slice(0, 24).map((p) => (
            <li key={p.place}>
              <Link href={`/sponsors?location=${encodeURIComponent(p.place)}&visa=${encodeURIComponent(route)}`} className="hover:text-primary hover:underline">
                {p.place}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FaqList title={`${route} visa sponsorship: common questions`} entries={faqs} />

      <section className="mt-12" aria-labelledby="other">
        <h2 id="other" className="font-display text-2xl">
          Other visa routes
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {VISA_CATEGORIES.filter((v) => v !== route).map((v) => (
            <li key={v}>
              <Link href={routePath(v)} className="inline-block rounded-md border border-border px-3 py-1.5 hover:border-foreground/40">
                {v}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
