import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs } from "@/components/seo";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { breadcrumbs, n, rolePath, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Jobs with UK visa sponsorship, by role",
  description: "Live UK jobs from employers licensed to sponsor work visas, grouped by role: software, data, nursing and care, engineering, finance, teaching and more.",
  path: "/visa-sponsorship-jobs",
});

export default async function RolesPage() {
  const [info, counts] = await Promise.all([
    jobsInfo().catch(() => null),
    Promise.all(ROLE_FAMILIES.map((r) => searchJobs({ role: r.id, limit: 1 }).then((p) => p.total).catch(() => null))),
  ]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Jobs with visa sponsorship", path: "/visa-sponsorship-jobs" },
  ];
  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={breadcrumbs(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Jobs with UK visa sponsorship</h1>
        <Answer>
          {info?.count ? `${n(info.count)} live roles from ${n(info.sponsors)} licensed sponsors` : "Live roles from licensed sponsors"}, read from
          their own job boards and updated daily. Choose a role to see the latest openings and the sponsors that hire for it.
        </Answer>
      </header>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {ROLE_FAMILIES.map((r, i) => (
          <li key={r.id}>
            <Link href={rolePath(r.id)} className="flex items-baseline justify-between gap-4 py-4 hover:bg-muted/40 sm:px-2">
              <span className="font-display text-xl font-semibold">{r.label}</span>
              {counts[i] !== null && <span className="text-sm tabular-nums text-muted-foreground">{n(counts[i]!)} live roles</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
