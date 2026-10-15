import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Answer, Breadcrumbs } from "@/components/seo";
import { directoryInfo } from "@/lib/directory";
import { jobsInfo } from "@/lib/jobs";
import { SITE, breadcrumbs, formatDate, n, pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "About Horus and its data",
  description:
    "Where Horus's data comes from, how often it updates, how jobs are found and checked for sponsorship, and its limitations. Built on the Home Office register of licensed sponsors.",
  path: "/about",
});

const REGISTER_URL = "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const [info, jobs] = await Promise.all([directoryInfo().catch(() => null), jobsInfo().catch(() => null)]);
  const updated = formatDate(info?.registerDate);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];

  return (
    <main className="container max-w-3xl space-y-8 px-4 py-8 sm:py-12">
      <JsonLd
        data={[
          breadcrumbs(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "UK register of licensed visa sponsors, searchable",
            description: `Every organisation on the Home Office register of licensed sponsors (workers), with rating, licensed visa routes and location${
              info ? `: ${n(info.count)} organisations` : ""
            }. Republished from GOV.UK and updated daily.`,
            url: `${SITE}/sponsors`,
            isBasedOn: REGISTER_URL,
            license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
            creator: { "@type": "Organization", name: "Horus", url: SITE },
            spatialCoverage: { "@type": "Place", name: "United Kingdom" },
            ...(info?.registerDate && { dateModified: info.registerDate }),
            keywords: ["UK visa sponsors", "licensed sponsors register", "Skilled Worker visa", "certificate of sponsorship"],
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">About Horus</h1>
        <Answer>
          Horus is a free, independent tool for finding UK employers that can sponsor a work visa. It turns the Home Office&apos;s
          register of licensed sponsors{info ? ` (${n(info.count)} organisations` : ""}
          {updated ? `, updated ${updated})` : info ? ")" : ""} into searchable pages, adds live jobs from those employers&apos;
          own job boards, and helps you track your applications.
        </Answer>
      </header>

      <Section title="Where the data comes from">
        <ul>
          <li>
            <strong className="text-foreground">Sponsors</strong> come from the GOV.UK{" "}
            <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Register of licensed sponsors: workers
            </a>
            , published under the Open Government Licence. Horus imports it every day and shows each organisation&apos;s name,
            town, rating and licensed visa routes exactly as listed.
          </li>
          <li>
            <strong className="text-foreground">Jobs</strong>{jobs?.count ? ` (${n(jobs.count)} live roles from ${n(jobs.sponsors)} sponsors)` : ""} are read
            daily from the public job boards (Greenhouse, Lever, Ashby and Workable) of sponsors whose board Horus can confidently
            match to their register entry. Only UK roles are listed, and every role links to the employer&apos;s own page to apply.
          </li>
          <li>
            <strong className="text-foreground">Websites and careers pages</strong> are looked up when you view a sponsor, and
            cached.
          </li>
        </ul>
      </Section>

      <Section title="How to read it">
        <ul>
          <li>
            <strong className="text-foreground">A-rated</strong> sponsors are fully trusted and can assign new certificates of
            sponsorship. <strong className="text-foreground">B-rated</strong> sponsors are on a Home Office action plan and
            can&apos;t until it&apos;s resolved.
          </li>
          <li>
            <strong className="text-foreground">Sectors and roles</strong> are estimates inferred from company names, because the
            register doesn&apos;t record what employers do.
          </li>
          <li>
            <strong className="text-foreground">&quot;Likely sponsorable&quot;</strong> is a rule-based guide from a job&apos;s
            advertised salary and wording, not a decision about your application.
          </li>
        </ul>
      </Section>

      <Section title="Limitations">
        <p>
          A sponsor licence means an employer <em>can</em> sponsor workers, not that every role will be sponsored. Job coverage is a
          subset of sponsors and grows over time. Horus is not affiliated with the Home Office and doesn&apos;t give immigration
          advice: check the job ad, ask the employer, and read the current rules on{" "}
          <a href="https://www.gov.uk/browse/visas-immigration/work-visas" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            GOV.UK
          </a>
          .
        </p>
      </Section>

      <Section title="Start here">
        <ul>
          <li>
            <Link href="/sponsors" className="text-primary hover:underline">Search every licensed sponsor</Link>
          </li>
          <li>
            <Link href="/visa-sponsors" className="text-primary hover:underline">Visa sponsors by town and county</Link>
          </li>
          <li>
            <Link href="/visa-sponsorship-jobs" className="text-primary hover:underline">Jobs with visa sponsorship, by role</Link>
          </li>
          <li>
            <Link href="/guide/visa-basics" className="text-primary hover:underline">UK work visa basics</Link>
          </li>
        </ul>
      </Section>
    </main>
  );
}
