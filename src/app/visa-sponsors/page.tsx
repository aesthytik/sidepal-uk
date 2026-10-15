import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs } from "@/components/seo";
import { countSponsors, directoryInfo, listPlaces } from "@/lib/directory";
import { MIN_PLACE_SPONSORS, breadcrumbs, formatDate, n, placePath, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "UK visa sponsors by town and county",
  description:
    "Every UK town and county with employers licensed to sponsor work visas, from London and Manchester to Aberdeen. Browse the licensed sponsors in each place.",
  path: "/visa-sponsors",
});

export default async function PlacesPage() {
  const [places, info] = await Promise.all([listPlaces(MIN_PLACE_SPONSORS).catch(() => []), directoryInfo().catch(() => null)]);
  const busiest = await Promise.all(
    places.slice(0, 5).map(async (p) => ({ place: p.place, count: await countSponsors({ location: p.place }).catch(() => null) }))
  );
  const sorted = [...places].sort((a, b) => a.place.localeCompare(b.place));
  const byLetter = new Map<string, typeof sorted>();
  for (const p of sorted) {
    const letter = p.place[0].toUpperCase();
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), p]);
  }
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa sponsors by place", path: "/visa-sponsors" },
  ];

  return (
    <main className="container max-w-5xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbs(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">UK visa sponsors by place</h1>
        <Answer>
          {info ? `${n(info.count)} organisations` : "Over 120,000 organisations"} are licensed to sponsor UK work visas
          {info?.registerDate ? ` (register updated ${formatDate(info.registerDate)})` : ""}. Pick a town or county to see its
          sponsors. The busiest are{" "}
          {busiest.map((p, i) => (
            <span key={p.place}>
              {i > 0 && (i === busiest.length - 1 ? " and " : ", ")}
              <Link href={placePath(p.place)} className="text-primary hover:underline">
                {p.place}
              </Link>
              {p.count !== null && ` (${n(p.count)})`}
            </span>
          ))}
          .
        </Answer>
      </header>

      <div className="mt-10 space-y-8">
        {[...byLetter].map(([letter, group]) => (
          <section key={letter} aria-label={letter}>
            <h2 className="border-b border-border pb-1 font-display text-2xl font-semibold">{letter}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {group.map((p) => (
                <li key={p.place}>
                  <Link href={placePath(p.place)} className="hover:text-primary hover:underline">
                    {p.place}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
