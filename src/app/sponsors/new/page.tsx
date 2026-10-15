import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/seo";
import { getSponsors } from "@/lib/directory";
import { CHANGE_LABELS, CHANGE_TYPES, changeDescription } from "@/lib/directory/changes";
import { parseChangeFilters, searchSponsorChanges } from "@/lib/directory/changeQueries";
import { SPONSOR_CHANGES_PATH, breadcrumbs, formatDate, itemList, sponsorPath } from "@/lib/seo";

const title = "New UK visa sponsors and register changes";
const description = "Track newly licensed UK visa sponsors, removals, rating changes and visa routes added or removed. Filter daily sponsor register changes by location and type.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: SPONSOR_CHANGES_PATH },
  openGraph: { title, description, url: SPONSOR_CHANGES_PATH, type: "website" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SponsorChangesPage({ searchParams }: Props) {
  const filters = parseChangeFilters(await searchParams);
  const result = await searchSponsorChanges(filters).catch((error) => {
    console.error("Could not load sponsor changes:", error);
    return null;
  });
  // Only link to sponsors that still exist with this name; old events can hold
  // a slug that was subsequently assigned to a different organisation.
  const sponsors = result?.items.length
    ? await getSponsors([...new Set(result.items.map((c) => c.sponsorId))]).catch(() => [])
    : [];
  const current = new Map(sponsors.map((s) => [s.name, s]));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Sponsors", path: "/sponsors" },
    { name: "Register changes", path: SPONSOR_CHANGES_PATH },
  ];
  function pagePath(page: number) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.location) params.set("location", filters.location);
    if (page > 1) params.set("page", String(page));
    return `${SPONSOR_CHANGES_PATH}${params.size ? `?${params}` : ""}`;
  }

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={[breadcrumbs(crumbs), itemList(sponsors.map((s) => ({ name: s.name, path: sponsorPath(s.id) })))]} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <p className="eyebrow">Daily register changes</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">New sponsors and licence changes</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          See which employers have joined or left the GOV.UK sponsor register, changed rating, or added and removed visa routes.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Dates show when changes were observed in our daily comparisons. A first appearance is not the original licence grant date;
          an employer may also have changed its registered name. History starts when Horus began tracking changes.
        </p>
      </header>

      <form action={SPONSOR_CHANGES_PATH} method="get" className="card mt-8 flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-0 flex-1 basis-52">
          <label htmlFor="change-type" className="text-sm font-medium">Change type</label>
          <select id="change-type" name="type" defaultValue={filters.type ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All changes</option>
            {CHANGE_TYPES.map((type) => <option key={type} value={type}>{CHANGE_LABELS[type]}</option>)}
          </select>
        </div>
        <div className="min-w-0 flex-1 basis-52">
          <label htmlFor="change-location" className="text-sm font-medium">Town, city or county</label>
          <input id="change-location" name="location" type="search" defaultValue={filters.location} placeholder="e.g. London" maxLength={120}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <Button type="submit" size="lg">Filter changes</Button>
        {(filters.type || filters.location) && <Link href={SPONSOR_CHANGES_PATH} className="py-3 text-sm text-primary hover:underline">Clear filters</Link>}
      </form>

      <section className="mt-8" aria-label="Recent register changes">
        {result === null ? (
          <div className="card p-8 text-center">
            <h2 className="font-display text-xl">Couldn&apos;t load register changes</h2>
            <p className="mt-2 text-muted-foreground">Please try again in a moment.</p>
            <Link href={pagePath(filters.page)} className="mt-4 inline-block text-primary hover:underline">Try again</Link>
          </div>
        ) : result.items.length === 0 ? (
          <div className="card p-8 text-center">
            <h2 className="font-display text-xl">No changes found</h2>
            <p className="mt-2 text-muted-foreground">
              {filters.type || filters.location ? "Try another change type or location." : "Changes will appear here after daily register comparisons find them."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {result.items.map((change) => {
              const sponsor = current.get(change.sponsorName);
              const date = change.registerDate ?? change.observedAt;
              return (
                <li key={change.id} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="rounded-md bg-muted px-2.5 py-1 font-medium">{CHANGE_LABELS[change.type]}</span>
                    <time dateTime={date} className="text-muted-foreground">{formatDate(date)}</time>
                  </div>
                  <h2 className="mt-3 font-display text-xl">
                    {sponsor ? <Link href={sponsorPath(sponsor.id)} className="hover:text-primary hover:underline">{change.sponsorName}</Link> : change.sponsorName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{change.location}</p>
                  <p className="mt-2 text-sm">{changeDescription(change)}</p>
                </li>
              );
            })}
          </ul>
        )}
        {result !== null && (filters.page > 1 || result.hasMore) && (
          <nav aria-label="Change feed pages" className="mt-6 flex items-center justify-between gap-4 text-sm">
            {filters.page > 1 ? <Link href={pagePath(filters.page - 1)} className="text-primary hover:underline">← Previous page</Link> : <span />}
            <span className="text-muted-foreground">Page {filters.page}</span>
            {result.hasMore ? <Link href={pagePath(filters.page + 1)} className="text-primary hover:underline">Next page →</Link> : <span />}
          </nav>
        )}
      </section>
    </main>
  );
}
