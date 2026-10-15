import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs } from "@/components/seo";
import { countSponsors } from "@/lib/directory";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";
import { breadcrumbs, n, routePath, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "UK work visa routes and their licensed sponsors",
  description: "Every sponsored UK work visa route, from Skilled Worker to Seasonal Worker, with the number of employers licensed for each.",
  path: "/visa-routes",
});

export default async function RoutesPage() {
  const counts = await Promise.all(VISA_CATEGORIES.map((v) => countSponsors({ visa: v }).catch(() => null)));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa routes", path: "/visa-routes" },
  ];
  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbs(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <h1 className="font-display text-4xl sm:text-5xl">UK work visa routes</h1>
        <Answer>
          Employers are licensed for specific visa routes. Skilled Worker is by far the most common
          {counts[0] ? `, with ${n(counts[0])} licensed sponsors` : ""}. Pick a route to see who can sponsor it.
        </Answer>
      </header>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {VISA_CATEGORIES.map((v, i) => (
          <li key={v}>
            <Link href={routePath(v)} className="flex items-baseline justify-between gap-4 py-4 hover:bg-muted/40 sm:px-2">
              <span className="font-display text-xl">{v}</span>
              {counts[i] !== null && <span className="text-sm tabular-nums text-muted-foreground">{n(counts[i]!)} sponsors</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
