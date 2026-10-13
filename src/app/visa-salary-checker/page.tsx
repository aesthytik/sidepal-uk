import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, FaqList } from "@/components/seo";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { breadcrumbs, faq } from "@/lib/seo";
import { SHORTAGE_LIST_ENDS, SNAPSHOT_DATE } from "@/lib/soc";
import { SalaryChecker } from "./SalaryChecker";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;

export const metadata: Metadata = {
  alternates: { canonical: "/visa-salary-checker" },
  title: "Skilled Worker visa salary checker: going rates by job",
  description:
    "Find the SOC 2020 occupation code for a UK job, its Skilled Worker going rate, and whether a salary is high enough to be sponsored. Covers new entrants, the Temporary Shortage List and health and education pay scales.",
};

const FAQ = [
  {
    q: "What is the going rate for a Skilled Worker visa?",
    a: `Each occupation code has its own going rate, set from UK pay data. For most jobs your salary must be at least ${fmt(THRESHOLDS.general)} and at least the going rate for the occupation, whichever is higher.`,
  },
  {
    q: "What salary do new entrants need?",
    a: `New entrants (for example under 26, recent graduates or switching from a Student or Graduate visa) need at least ${fmt(THRESHOLDS.newEntrant)} and 70% of the going rate.`,
  },
  {
    q: "What is the Temporary Shortage List?",
    a: `Some medium-skilled jobs, like data analysts and engineering technicians, can still be sponsored if the certificate of sponsorship is issued before ${SHORTAGE_LIST_ENDS}. The same salary rules apply.`,
  },
  {
    q: "Which jobs can't be sponsored any more?",
    a: "Since 22 July 2025 most jobs below degree level (RQF 6) can only be sponsored for people already on a Skilled Worker visa. Some occupations, like drivers and sales assistants, can't be sponsored at all.",
  },
];

export default function SalaryCheckerPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Visa salary checker", path: "/visa-salary-checker" },
  ];
  return (
    <main className="container max-w-4xl px-4 py-6 sm:py-10">
      <JsonLd data={[breadcrumbs(crumbs), faq(FAQ)]} />
      <Breadcrumbs items={crumbs} />
      <header className="mb-6 mt-4">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Visa salary checker</h1>
        <p className="mt-2 text-muted-foreground">
          Type a job title to find its occupation code and the salary needed for a Skilled Worker visa. Based on the Immigration Rules on
          GOV.UK as of {new Date(SNAPSHOT_DATE).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </header>
      <Suspense fallback={<div className="card h-64 animate-pulse" aria-hidden="true" />}>
        <SalaryChecker />
      </Suspense>
      <FaqList title="Common questions" entries={FAQ} />
    </main>
  );
}
