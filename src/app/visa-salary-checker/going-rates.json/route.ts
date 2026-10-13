import { NextResponse } from "next/server";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { SITE, occupationPath } from "@/lib/seo";
import { OCCUPATIONS, SHORTAGE_LIST_ENDS, SNAPSHOT_DATE, SNAPSHOT_SOURCES, salaryRule } from "@/lib/soc";

export const dynamic = "force-static";

/**
 * Every SOC 2020 occupation with its Skilled Worker going rate and the minimum salary that
 * can be sponsored, as JSON for AI assistants and other tools. Data is Crown copyright,
 * published under the Open Government Licence.
 */
export function GET() {
  const body = {
    name: "UK Skilled Worker visa going rates by SOC 2020 occupation",
    description:
      "Minimum salaries for UK Skilled Worker visa sponsorship by occupation code: the going rate, the new-entrant rate and whether the occupation is open to new applicants.",
    url: `${SITE}/visa-salary-checker`,
    snapshotDate: SNAPSHOT_DATE,
    sources: SNAPSHOT_SOURCES,
    license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    rules: {
      generalMinimum: THRESHOLDS.general,
      newEntrantMinimum: THRESHOLDS.newEntrant,
      healthEducationMinimum: THRESHOLDS.healthEducation,
      hoursPerWeek: 37.5,
      temporaryShortageListEnds: SHORTAGE_LIST_ENDS,
      summary:
        "Salary must be at least the higher of the general minimum and the occupation's going rate. New entrants need the higher of the new-entrant minimum and 70% of the going rate. Listed health and education jobs need at least the health/education minimum and the national pay scale rate. 'existing-only' occupations are open only to people who held a Skilled Worker visa before 22 July 2025. PhD discounts, the Immigration Salary List and pre-April-2024 transitional rates are not included.",
    },
    occupations: OCCUPATIONS.map((o) => ({
      code: o.code,
      title: o.title,
      status: o.status,
      goingRate: o.goingRate ?? null,
      minimumSalary: salaryRule(o).minimum ?? null,
      minimumSalaryNewEntrant: salaryRule(o, { newEntrant: true }).minimum ?? null,
      payScale: o.payScale ?? null,
      note: o.note ?? null,
      exampleJobTitles: o.examples,
      url: `${SITE}${occupationPath(o)}`,
    })),
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
