import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, FaqList } from "@/components/seo";
import { directoryInfo, getSponsor, listPlaces, searchSponsors } from "@/lib/directory";
import { jobsForSponsor } from "@/lib/jobs";
import { sectorLabel } from "@/lib/sectors/taxonomy";
import { MIN_PLACE_SPONSORS, SITE, breadcrumbs, faq, formatDate, placePath, ratingSentence, routePath, slug, sponsorPath } from "@/lib/seo";
import { SponsorLive } from "./SponsorLive";

// Sponsor pages are rendered on first visit and cached for a day (the register updates daily)
export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ id: string }> };

function routeList(routes: string[]) {
  if (routes.length <= 1) return routes.join("");
  return `${routes.slice(0, -1).join(", ")} and ${routes[routes.length - 1]}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const sponsor = await getSponsor((await params).id).catch(() => null);
  if (!sponsor) return { title: "Sponsor not found", robots: { index: false } };
  const rating = sponsor.rating ? `${sponsor.rating}-rated` : "licensed";
  const title = `Does ${sponsor.name} sponsor visas? ${rating} UK sponsor`;
  const description = `Yes. ${sponsor.name} (${sponsor.location}) is on the Home Office register of licensed sponsors for ${routeList(sponsor.visaTypes)}. See its rating, visa routes and open roles.`;
  return {
    title,
    description,
    alternates: { canonical: sponsorPath(sponsor.id) },
    openGraph: { title, description, url: sponsorPath(sponsor.id), type: "website" },
  };
}

export default async function SponsorPage({ params }: Params) {
  const { id } = await params;
  const sponsor = await getSponsor(id).catch(() => null);
  if (!sponsor) notFound();

  const [info, jobs, places] = await Promise.all([
    directoryInfo().catch(() => null),
    jobsForSponsor(sponsor.id).catch(() => []),
    listPlaces(MIN_PLACE_SPONSORS).catch(() => []),
  ]);
  const city = sponsor.city || sponsor.county;
  const cityPage = places.find((p) => slug(p.place) === slug(city));
  const nearby = city
    ? (await searchSponsors({ location: city, rating: "A", limit: 9 }).catch(() => null))?.items.filter((s) => s.id !== sponsor.id).slice(0, 8) ?? []
    : [];
  const updated = formatDate(info?.registerDate);
  const routes = routeList(sponsor.visaTypes);

  const answer = `Yes. ${sponsor.name} is a licensed UK visa sponsor: it appears on the Home Office register of licensed sponsors${
    updated ? ` (as updated on ${updated})` : ""
  }, based in ${sponsor.location}, and is licensed for ${routes || "sponsored work"}. ${ratingSentence(sponsor.rating)}`;

  const faqs = [
    { q: `Does ${sponsor.name} sponsor visas?`, a: answer },
    { q: `What is ${sponsor.name}'s sponsor licence rating?`, a: ratingSentence(sponsor.rating) },
    {
      q: `Which visa routes can ${sponsor.name} sponsor?`,
      a: `${sponsor.name} is licensed for ${routes}. A licence means the employer can sponsor workers on these routes; it does not mean every role it advertises is open to sponsorship.`,
    },
    {
      q: `Is ${sponsor.name} hiring?`,
      a: jobs.length
        ? `Horus found ${jobs.length} open UK role${jobs.length === 1 ? "" : "s"} on ${sponsor.name}'s job board. Check each job ad for visa sponsorship before applying.`
        : `Horus hasn't found ${sponsor.name}'s job board yet. Search its careers page for roles that mention visa sponsorship.`,
    },
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    ...(cityPage ? [{ name: `Visa sponsors in ${cityPage.place}`, path: placePath(cityPage.place) }] : [{ name: "Sponsors", path: "/sponsors" }]),
    { name: sponsor.name, path: sponsorPath(sponsor.id) },
  ];

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE}${sponsorPath(sponsor.id)}#org`,
            name: sponsor.name,
            url: `${SITE}${sponsorPath(sponsor.id)}`,
            address: { "@type": "PostalAddress", addressLocality: sponsor.city || undefined, addressRegion: sponsor.county || undefined, addressCountry: "GB" },
            description: answer,
          },
          faq(faqs),
          breadcrumbs(crumbs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <header className="mt-6">
        <p className="eyebrow">Licensed UK visa sponsor</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{sponsor.name}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{answer}</p>
      </header>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {[
          ["Location", sponsor.location],
          ["Licence rating", sponsor.rating ? `${sponsor.rating}-rated` : "Not listed"],
          ["Sector (estimated)", sponsor.sector ? sectorLabel(sponsor.sector) : "Not known"],
          ["Register updated", updated ?? "Daily"],
        ].map(([label, value]) => (
          <div key={label} className="bg-card p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
        <div className="bg-card p-4 sm:col-span-2">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Licensed visa routes</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {sponsor.visaTypes.map((v) => (
              <Link key={v} href={routePath(v)} className="rounded-md border border-border px-2.5 py-1 text-sm hover:border-foreground/40">
                {v}
              </Link>
            ))}
          </dd>
        </div>
      </dl>

      <section className="mt-10" aria-labelledby="live">
        <h2 id="live" className="font-display text-2xl font-semibold">
          Website, careers page and live roles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Looked up live. Save the sponsor to track your application.</p>
        <div className="mt-4">
          <SponsorLive sponsor={sponsor} />
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="mt-10" aria-labelledby="jobs">
          <h2 id="jobs" className="font-display text-2xl font-semibold">
            Open UK roles at {sponsor.name}
          </h2>
          <div className="mt-4 space-y-4">
            {jobs.slice(0, 10).map((job) => (
              <JobCard key={job.url} job={job} />
            ))}
          </div>
          {jobs.length > 10 && (
            <p className="mt-4 text-sm">
              <Link href={`/jobs?q=${encodeURIComponent(sponsor.name)}`} className="font-medium text-primary hover:underline">
                See all {jobs.length} roles →
              </Link>
            </p>
          )}
        </section>
      )}

      <section className="mt-10 rounded-lg border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">A licence isn&apos;t a promise</p>
        <p className="mt-1">
          Being on the register means {sponsor.name} <em>can</em> sponsor workers, not that every role will be sponsored. Look for
          &quot;visa sponsorship&quot; in the job ad or ask the recruiter, and check the{" "}
          <a href="https://www.gov.uk/skilled-worker-visa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            current Skilled Worker rules on GOV.UK
          </a>
          .
        </p>
      </section>

      <FaqList title={`Questions about ${sponsor.name}`} entries={faqs} />

      {nearby.length > 0 && (
        <section className="mt-10" aria-labelledby="nearby">
          <h2 id="nearby" className="font-display text-2xl font-semibold">
            Other A-rated sponsors in {city}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {nearby.map((s) => (
              <li key={s.id}>
                <Link href={sponsorPath(s.id)} className="block rounded-md border border-border px-3 py-2 text-sm hover:border-foreground/40">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          {cityPage && (
            <p className="mt-4 text-sm">
              <Link href={placePath(cityPage.place)} className="font-medium text-primary hover:underline">
                All visa sponsors in {cityPage.place} →
              </Link>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
