import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs, FaqList } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { jobsForOccupation } from "@/lib/jobs";
import { SALARY_CHECKER_PATH, SITE, breadcrumbs, faq, n, occupationPath, pageMetadata } from "@/lib/seo";
import { OCCUPATIONS, type Occupation, SNAPSHOT_SOURCES, STATUS_LABELS, salaryRule } from "@/lib/soc";
import { hourly, occupationAnswer, occupationFaq, relatedOccupations, snapshotDateLabel } from "@/lib/soc/content";

export const revalidate = 86400;
export function generateStaticParams() {
  return OCCUPATIONS.map((o) => ({ occupation: occupationPath(o).split("/").pop()! }));
}

type Params = { params: Promise<{ occupation: string }> };

const fmt = (v: number) => `£${v.toLocaleString("en-GB")}`;

/** Accepts "2134-any-words" so old or shortened links still resolve to the code. */
function findOccupation(param: string): Occupation | undefined {
  const code = param.match(/^(\d{4})/)?.[1];
  return OCCUPATIONS.find((o) => o.code === code);
}

function titleFor(occ: Occupation): string {
  const rule = salaryRule(occ);
  if (occ.status === "ineligible") return `${occ.title} (SOC ${occ.code}): not eligible for a Skilled Worker visa`;
  if (occ.status === "existing-only") return `${occ.title} (SOC ${occ.code}): Skilled Worker visa rules since July 2025`;
  if (occ.status === "health-education") return `${occ.title} (SOC ${occ.code}): Skilled Worker visa salary and pay scale`;
  return `${occ.title} visa salary: ${fmt(rule.minimum!)} going rate (SOC ${occ.code})`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const occ = findOccupation((await params).occupation);
  if (!occ) return { title: "Occupation not found", robots: { index: false } };
  const title = titleFor(occ);
  const description = occupationAnswer(occ).slice(0, 300);
  const path = occupationPath(occ);
  return pageMetadata({ title, description, path: path });
}

export default async function OccupationPage({ params }: Params) {
  const occ = findOccupation((await params).occupation);
  if (!occ) notFound();
  const path = occupationPath(occ);
  // A short or old slug still works, but search engines see one URL
  if ((await params).occupation !== path.split("/").pop()) permanentRedirect(path);

  const jobs = await jobsForOccupation(occ.code).catch(() => ({ items: [], total: 0 }));
  const answer = occupationAnswer(occ);
  const faqs = occupationFaq(occ);
  const related = relatedOccupations(occ);
  const general = salaryRule(occ);
  const entrant = salaryRule(occ, { newEntrant: true });
  const sponsorable = occ.status !== "ineligible" && occ.status !== "existing-only";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa salary checker", path: SALARY_CHECKER_PATH },
    { name: `SOC ${occ.code}`, path },
  ];

  const occupationLd = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: occ.title,
    description: answer,
    url: `${SITE}${path}`,
    occupationalCategory: { "@type": "CategoryCode", codeValue: occ.code, inCodeSet: { "@type": "CategoryCodeSet", name: "SOC 2020" } },
    occupationLocation: { "@type": "Country", name: "United Kingdom" },
    ...(occ.examples.length && { alternateName: occ.examples }),
    ...(sponsorable &&
      general.minimum && {
        estimatedSalary: {
          "@type": "MonetaryAmountDistribution",
          name: "Minimum salary for a Skilled Worker visa",
          currency: "GBP",
          duration: "P1Y",
          ...(occ.goingRate ? { median: occ.goingRate } : {}),
          percentile10: entrant.minimum,
        },
      }),
  };

  return (
    <main className="container max-w-4xl px-4 py-6 sm:py-10">
      <JsonLd data={[breadcrumbs(crumbs), faq(faqs), occupationLd]} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium tabular-nums text-muted-foreground">SOC 2020 code {occ.code}</span>
          <Badge tone={sponsorable ? "success" : "warning"}>{STATUS_LABELS[occ.status]}</Badge>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{occ.title}: Skilled Worker visa salary</h1>
        <Answer>{answer}</Answer>
      </header>

      {sponsorable && general.minimum !== undefined && (
        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <dt className="text-sm text-muted-foreground">Minimum salary</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{fmt(general.minimum)}</dd>
            <dd className="text-xs text-muted-foreground">{hourly(general.minimum)} an hour</dd>
          </div>
          {occ.goingRate !== undefined && (
            <div className="card p-4">
              <dt className="text-sm text-muted-foreground">Going rate</dt>
              <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{fmt(occ.goingRate)}</dd>
              <dd className="text-xs text-muted-foreground">For a 37.5-hour week</dd>
            </div>
          )}
          {entrant.minimum !== undefined && occ.status !== "health-education" && (
            <div className="card p-4">
              <dt className="text-sm text-muted-foreground">New entrants</dt>
              <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{fmt(entrant.minimum)}</dd>
              <dd className="text-xs text-muted-foreground">70% of the going rate, at least {fmt(THRESHOLDS.newEntrant)}</dd>
            </div>
          )}
        </dl>
      )}

      <section className="mt-10 space-y-3 text-muted-foreground">
        <h2 className="font-display text-2xl font-semibold text-foreground">What this covers</h2>
        {occ.examples.length > 0 && (
          <p>
            Job titles in SOC {occ.code} include: <span className="text-foreground">{occ.examples.join(", ")}</span>.
          </p>
        )}
        {occ.note && <p>Condition from the Immigration Rules: {occ.note}</p>}
        <p>
          <Link href={`${SALARY_CHECKER_PATH}?title=${encodeURIComponent(occ.examples[0] ?? occ.title)}`} className="font-medium text-primary hover:underline">
            Check a specific salary for this job →
          </Link>
        </p>
      </section>

      {jobs.total > 0 && (
        <section className="mt-12" aria-labelledby="live-jobs">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <h2 id="live-jobs" className="font-display text-2xl font-semibold">
              Live {occ.title.toLowerCase()} jobs at licensed sponsors
            </h2>
            <span className="text-sm text-muted-foreground">{n(jobs.total)} open now</span>
          </div>
          <div className="mt-6 space-y-4">
            {jobs.items.map((job) => (
              <JobCard key={job.url} job={job} />
            ))}
          </div>
        </section>
      )}

      <FaqList title={`Questions about SOC ${occ.code}`} entries={faqs} />

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related">
          <h2 id="related" className="font-display text-2xl font-semibold">
            Related occupations
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {related.map((o) => {
              const min = salaryRule(o).minimum;
              return (
                <li key={o.code}>
                  <Link href={occupationPath(o)} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 hover:bg-muted/40 sm:px-2">
                    <span>
                      <span className="tabular-nums text-muted-foreground">{o.code}</span> <span className="font-medium">{o.title}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {o.status === "ineligible" || o.status === "existing-only" ? STATUS_LABELS[o.status] : min ? `From ${fmt(min)}` : STATUS_LABELS[o.status]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Source: Immigration Rules{" "}
        <a href={SNAPSHOT_SOURCES[0]} target="_blank" rel="noopener noreferrer" className="underline">
          Appendix Skilled Occupations
        </a>{" "}
        and the{" "}
        <a href={SNAPSHOT_SOURCES[1]} target="_blank" rel="noopener noreferrer" className="underline">
          Temporary Shortage List
        </a>{" "}
        on GOV.UK, as of {snapshotDateLabel()}. A guide, not immigration advice: PhD discounts, the Immigration Salary List and
        pre-April-2024 transitional rates aren&apos;t covered.
      </p>
    </main>
  );
}
