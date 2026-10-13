import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs, FaqList, SponsorList } from "@/components/seo";
import { countSponsors, searchSponsors } from "@/lib/directory";
import { searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES, sectorLabel } from "@/lib/sectors/taxonomy";
import { breadcrumbs, faq, n, occupationPath, roleFromSlug, rolePath } from "@/lib/seo";
import { salaryRule, STATUS_LABELS } from "@/lib/soc";
import { occupationsForRole } from "@/lib/soc/content";

export const revalidate = 3600;
export const dynamicParams = true;
// Rendered on first request and cached, so the build doesn't run every role's sponsor queries at once
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ role: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const role = roleFromSlug((await params).role);
  if (!role) return { title: "Role not found", robots: { index: false } };
  const jobs = await searchJobs({ role: role.id, limit: 1 }).catch(() => ({ total: 0 }));
  const title = `${role.label} jobs with UK visa sponsorship${jobs.total ? ` (${n(jobs.total)} live)` : ""}`;
  const description = `Live ${role.label.toLowerCase()} roles from UK employers licensed to sponsor Skilled Worker visas, with a sponsorship check on every job. Updated daily.`;
  return { title, description, alternates: { canonical: rolePath(role.id) }, openGraph: { title, description, url: rolePath(role.id) } };
}

export default async function RolePage({ params }: Params) {
  const role = roleFromSlug((await params).role);
  if (!role) notFound();
  const label = role.label.toLowerCase();

  const [jobs, likely, sponsorCount, sponsors] = await Promise.all([
    searchJobs({ role: role.id, limit: 20 }).catch(() => ({ items: [], total: 0 })),
    searchJobs({ role: role.id, sponsored: "likely", limit: 1 }).catch(() => ({ total: 0 })),
    countSponsors({ role: role.id, visa: "Skilled Worker", rating: "A" }).catch(() => 0),
    searchSponsors({ role: role.id, visa: "Skilled Worker", rating: "A", limit: 20 }).catch(() => ({ items: [] })),
  ]);
  const sectors = role.sectors.map((s) => sectorLabel(s).toLowerCase()).join(" and ");

  const answer = `Horus lists ${n(jobs.total)} live ${label} roles from UK employers on the Home Office register of licensed sponsors${
    likely.total ? `, ${n(likely.total)} of which look likely to qualify for sponsorship on salary and wording` : ""
  }. There are also ${n(sponsorCount)} A-rated Skilled Worker sponsors in ${sectors}, where ${label} roles are usually found.`;

  const faqs = [
    { q: `Are there ${label} jobs with visa sponsorship in the UK?`, a: answer },
    {
      q: `Which companies sponsor visas for ${label} roles?`,
      a: `Any employer on the register of licensed sponsors can sponsor a ${label} role if the job meets the visa's requirements. A-rated sponsors in ${sectors} include ${sponsors.items
        .slice(0, 5)
        .map((s) => s.name)
        .join(", ")}.`,
    },
    {
      q: "How do I know if a job will sponsor my visa?",
      a: "A sponsor licence means the employer can sponsor, not that every role will. Look for visa sponsorship in the job ad, check the role meets the Skilled Worker salary and occupation rules on GOV.UK, and ask the recruiter.",
    },
  ];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Jobs with visa sponsorship", path: "/visa-sponsorship-jobs" },
    { name: role.label, path: rolePath(role.id) },
  ];

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={[breadcrumbs(crumbs), faq(faqs)]} />
      <Breadcrumbs items={crumbs} />
      <header className="mt-6">
        <p className="eyebrow">Jobs with visa sponsorship</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{role.label} jobs with UK visa sponsorship</h1>
        <Answer>{answer}</Answer>
      </header>

      <section className="mt-12" aria-labelledby="jobs">
        <h2 id="jobs" className="font-display text-2xl font-semibold">
          Latest {label} roles from licensed sponsors
        </h2>
        {jobs.items.length ? (
          <div className="mt-4 space-y-4">
            {jobs.items.map((job) => (
              <JobCard key={job.url} job={job} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">No live roles indexed right now. Browse the sponsors below and check their careers pages.</p>
        )}
        <p className="mt-4 text-sm">
          <Link href={`/jobs?role=${role.id}`} className="font-medium text-primary hover:underline">
            Filter all {label} jobs →
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="salary">
        <h2 id="salary" className="font-display text-2xl font-semibold">
          Salary needed for a Skilled Worker visa
        </h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {occupationsForRole(role.id).map((o) => {
            const open = o.status !== "ineligible" && o.status !== "existing-only";
            const min = open ? salaryRule(o).minimum : undefined;
            return (
              <li key={o.code}>
                <Link href={occupationPath(o)} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 hover:bg-muted/40 sm:px-2">
                  <span>
                    <span className="tabular-nums text-muted-foreground">{o.code}</span> <span className="font-medium">{o.title}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{min ? `From £${min.toLocaleString("en-GB")}` : STATUS_LABELS[o.status]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/visa-salary-checker" className="font-medium text-primary hover:underline">
            Check the going rate for any job →
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="sponsors">
        <h2 id="sponsors" className="font-display text-2xl font-semibold">
          A-rated sponsors that hire for {label}
        </h2>
        <div className="mt-4">
          <SponsorList sponsors={sponsors.items} />
        </div>
        <p className="mt-4 text-sm">
          <Link href={`/sponsors?role=${role.id}&visa=Skilled+Worker`} className="font-medium text-primary hover:underline">
            Search all {n(sponsorCount)} →
          </Link>
        </p>
      </section>

      <FaqList title={`${role.label} visa sponsorship: common questions`} entries={faqs} />

      <section className="mt-12" aria-labelledby="other">
        <h2 id="other" className="font-display text-2xl font-semibold">
          Other jobs with visa sponsorship
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {ROLE_FAMILIES.filter((r) => r.id !== role.id).map((r) => (
            <li key={r.id}>
              <Link href={rolePath(r.id)} className="inline-block rounded-md border border-border px-3 py-1.5 hover:border-foreground/40">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
