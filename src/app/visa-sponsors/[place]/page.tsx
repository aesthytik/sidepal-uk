import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs, FaqList, SponsorList } from "@/components/seo";
import { countSponsors, directoryInfo, listPlaces, searchSponsors } from "@/lib/directory";
import { searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { MIN_PLACE_SPONSORS, breadcrumbs, faq, formatDate, itemList, n, placePath, rolePath, slug, sponsorPath, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ place: string }> };

async function findPlace(s: string) {
  const places = await listPlaces(MIN_PLACE_SPONSORS).catch(() => []);
  return { place: places.find((p) => slug(p.place) === s), places };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { place } = await findPlace((await params).place);
  if (!place) return { title: "Place not found", robots: { index: false } };
  const total = await countSponsors({ location: place.place }).catch(() => place.count);
  const title = `Visa sponsors in ${place.place}: ${n(total)} licensed employers`;
  const description = `${n(total)} employers in ${place.place} are licensed by the Home Office to sponsor UK work visas. Browse A-rated Skilled Worker sponsors and live sponsored jobs in ${place.place}.`;
  return pageMetadata({ title, description, path: placePath(place.place) });
}

export default async function PlacePage({ params }: Params) {
  const { place, places } = await findPlace((await params).place);
  if (!place) notFound();
  const where = place.place;

  const [total, aRated, skilled, top, jobs, info] = await Promise.all([
    countSponsors({ location: where }),
    countSponsors({ location: where, rating: "A" }),
    countSponsors({ location: where, visa: "Skilled Worker" }),
    searchSponsors({ location: where, rating: "A", visa: "Skilled Worker", limit: 60 }),
    searchJobs({ location: where, limit: 8 }).catch(() => ({ items: [], total: 0 })),
    directoryInfo().catch(() => null),
  ]);
  const updated = formatDate(info?.registerDate);

  const answer = `${n(total)} employers in ${where} are on the Home Office register of licensed sponsors${updated ? ` (updated ${updated})` : ""}. ${n(
    aRated
  )} of them are A-rated, and ${n(skilled)} are licensed for the Skilled Worker visa, the most common route for sponsored jobs.`;

  const faqs = [
    { q: `How many companies sponsor visas in ${where}?`, a: answer },
    {
      q: `Which companies in ${where} sponsor Skilled Worker visas?`,
      a: `${n(skilled)} licensed sponsors in ${where} can sponsor Skilled Worker visas, including ${top.items
        .slice(0, 5)
        .map((s) => s.name)
        .join(", ")}. Horus lists them all, with links to their careers pages and open roles.`,
    },
    {
      q: `Are there visa sponsorship jobs in ${where}?`,
      a: jobs.total
        ? `Horus currently lists ${n(jobs.total)} live roles in ${where} from licensed sponsors, newest first.`
        : `Horus hasn't indexed live roles in ${where} yet; browse the sponsors below and check their careers pages for roles that offer sponsorship.`,
    },
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa sponsors by place", path: "/visa-sponsors" },
    { name: where, path: placePath(where) },
  ];
  const otherPlaces = places.filter((p) => p.place !== where).slice(0, 30);

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={[breadcrumbs(crumbs), faq(faqs), itemList(top.items.map((s) => ({ name: s.name, path: sponsorPath(s.id) })))]} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-6">
        <p className="eyebrow">UK visa sponsors</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Visa sponsors in {where}</h1>
        <Answer>{answer}</Answer>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-center">
        {[
          [n(total), "licensed sponsors"],
          [n(aRated), "A-rated"],
          [n(skilled), "Skilled Worker"],
        ].map(([value, label]) => (
          <div key={label} className="bg-card p-4">
            <dd className="font-display text-3xl font-semibold tabular-nums">{value}</dd>
            <dt className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      {jobs.items.length > 0 && (
        <section className="mt-12" aria-labelledby="jobs">
          <h2 id="jobs" className="font-display text-2xl font-semibold">
            Latest sponsored jobs in {where}
          </h2>
          <div className="mt-4 space-y-4">
            {jobs.items.map((job) => (
              <JobCard key={job.url} job={job} />
            ))}
          </div>
          <p className="mt-4 text-sm">
            <Link href={`/jobs?location=${encodeURIComponent(where)}`} className="font-medium text-primary hover:underline">
              All {n(jobs.total)} jobs in {where} →
            </Link>
          </p>
        </section>
      )}

      <section className="mt-12" aria-labelledby="sponsors">
        <h2 id="sponsors" className="font-display text-2xl font-semibold">
          A-rated Skilled Worker sponsors in {where}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">The first {top.items.length} in register order. Search for more or filter by role.</p>
        <div className="mt-4">
          <SponsorList sponsors={top.items} />
        </div>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href={`/sponsors?location=${encodeURIComponent(where)}`} className="font-medium text-primary hover:underline">
            Search all {n(total)} sponsors in {where} →
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="roles">
        <h2 id="roles" className="font-display text-2xl font-semibold">
          Sponsors in {where} by role
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {ROLE_FAMILIES.map((r) => (
            <li key={r.id}>
              <Link
                href={`/sponsors?location=${encodeURIComponent(where)}&role=${r.id}`}
                className="inline-block rounded-md border border-border px-3 py-1.5 hover:border-foreground/40"
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Or see{" "}
          {ROLE_FAMILIES.slice(0, 3).map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <Link href={rolePath(r.id)} className="text-primary hover:underline">
                {r.label.toLowerCase()} jobs with sponsorship
              </Link>
            </span>
          ))}{" "}
          across the UK.
        </p>
      </section>

      <FaqList title={`Visa sponsorship in ${where}: common questions`} entries={faqs} />

      <section className="mt-12" aria-labelledby="places">
        <h2 id="places" className="font-display text-2xl font-semibold">
          Visa sponsors in other places
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {otherPlaces.map((p) => (
            <li key={p.place}>
              <Link href={placePath(p.place)} className="hover:text-primary hover:underline">
                {p.place}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
