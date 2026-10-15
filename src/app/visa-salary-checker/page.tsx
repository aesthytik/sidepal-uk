import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs, FaqList } from "@/components/seo";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { SALARY_CHECKER_PATH, SITE, breadcrumbs, faq, occupationPath, pageMetadata } from "@/lib/seo";
import { OCCUPATIONS, SHORTAGE_LIST_ENDS, SNAPSHOT_DATE, SNAPSHOT_SOURCES, occupationByCode, salaryRule } from "@/lib/soc";
import { snapshotDateLabel } from "@/lib/soc/content";
import { OccupationTable } from "./OccupationTable";
import { SalaryChecker } from "./SalaryChecker";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;

// Common jobs people search for, linked to their own pages
const POPULAR = ["2134", "2139", "2133", "2433", "3544", "2237", "2231", "2121", "2122", "2421", "2412", "2314", "2221", "2132", "2141", "5434"];

export const metadata: Metadata = pageMetadata({
  path: SALARY_CHECKER_PATH,
  title: "Skilled Worker visa salary checker: going rates for every job (2026)",
  description: `The minimum salary for a UK Skilled Worker visa is ${fmt(THRESHOLDS.general)} or the job's going rate, whichever is higher (${fmt(THRESHOLDS.newEntrant)} for new entrants). Check the going rate for any job title across all ${OCCUPATIONS.length} SOC 2020 codes.`,
});

const FAQ = [
  {
    q: "What is the minimum salary for a UK Skilled Worker visa?",
    a: `For most jobs your salary must be at least ${fmt(THRESHOLDS.general)} a year and at least the going rate for the job's occupation code, whichever is higher. For example, a software developer (SOC 2134) needs ${fmt(salaryRule(occupationByCode("2134")!).minimum!)}.`,
  },
  {
    q: "What is the going rate for a Skilled Worker visa?",
    a: "Each SOC 2020 occupation code has its own going rate, set from UK earnings data and published in Appendix Skilled Occupations of the Immigration Rules. Rates are yearly for a 37.5-hour week and must be pro-rated for other hours.",
  },
  {
    q: "What salary do new entrants need?",
    a: `New entrants (under 26, recent graduates, switching from a Student or Graduate visa, or working towards a professional qualification) need at least ${fmt(THRESHOLDS.newEntrant)} and 70% of the going rate, whichever is higher.`,
  },
  {
    q: "What is the Temporary Shortage List?",
    a: `It lets some medium-skilled jobs, such as data analysts and engineering technicians, still be sponsored for new applicants if the certificate of sponsorship is issued before ${SHORTAGE_LIST_ENDS}. The usual salary rules still apply.`,
  },
  {
    q: "What salary do nurses, doctors and teachers need?",
    a: `Listed health and education jobs need at least ${fmt(THRESHOLDS.healthEducation)} a year and the national pay scale rate for the role, such as the NHS Agenda for Change band or the teacher pay scale.`,
  },
  {
    q: "Which jobs can no longer be sponsored?",
    a: "Since 22 July 2025, most jobs below degree level (RQF 6), such as chefs and care workers, can only be sponsored for people who already held a Skilled Worker visa before that date. Some occupations, like drivers and sales assistants, can't be sponsored at all.",
  },
];

export default function SalaryCheckerPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa salary checker", path: SALARY_CHECKER_PATH },
  ];
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "UK Skilled Worker visa going rates by SOC 2020 occupation",
    description: `Going rates, new-entrant rates and eligibility for all ${OCCUPATIONS.length} SOC 2020 occupation codes under the UK Immigration Rules (Appendix Skilled Occupations and the Temporary Shortage List).`,
    url: `${SITE}${SALARY_CHECKER_PATH}`,
    dateModified: SNAPSHOT_DATE,
    license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    creator: { "@type": "Organization", name: "UK Home Office" },
    publisher: { "@type": "Organization", name: "Horus", url: SITE },
    isBasedOn: SNAPSHOT_SOURCES,
    spatialCoverage: "United Kingdom",
    variableMeasured: ["SOC 2020 occupation code", "Going rate (GBP per year)", "New-entrant rate (GBP per year)", "Eligibility"],
    distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}${SALARY_CHECKER_PATH}/going-rates.json` }],
  };
  const tool = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Skilled Worker visa salary checker",
    url: `${SITE}${SALARY_CHECKER_PATH}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  };

  return (
    <main className="container max-w-4xl px-4 py-6 sm:py-10">
      <JsonLd data={[breadcrumbs(crumbs), faq(FAQ), dataset, tool]} />
      <Breadcrumbs items={crumbs} />
      <header className="mb-6 mt-4">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Skilled Worker visa salary checker</h1>
        <Answer>
          To be sponsored for a UK Skilled Worker visa, your salary must usually be at least {fmt(THRESHOLDS.general)} a year or the going rate for
          your job&apos;s occupation code, whichever is higher. New entrants need {fmt(THRESHOLDS.newEntrant)} or 70% of the going rate. Type a job
          title to find its code and the salary you need. Based on the Immigration Rules on GOV.UK as of {snapshotDateLabel()}.
        </Answer>
      </header>

      <Suspense fallback={<div className="card h-64 animate-pulse" aria-hidden="true" />}>
        <SalaryChecker />
      </Suspense>

      <section className="mt-10" aria-labelledby="popular">
        <h2 id="popular" className="font-display text-2xl font-semibold">
          Popular jobs
        </h2>
        <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
          {POPULAR.map(occupationByCode)
            .filter((o) => o !== undefined)
            .map((o) => {
              const min = o.status === "existing-only" ? undefined : salaryRule(o).minimum;
              return (
                <li key={o.code} className="border-b border-border">
                  <Link href={occupationPath(o)} className="flex items-baseline justify-between gap-3 py-2.5 hover:text-primary">
                    <span className="font-medium">{o.title}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {o.status === "existing-only" ? "Existing visa holders" : min ? fmt(min) : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      <div className="mt-12">
        <OccupationTable />
      </div>

      <FaqList title="Common questions" entries={FAQ} />
    </main>
  );
}
