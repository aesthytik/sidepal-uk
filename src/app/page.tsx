import Link from "next/link";
import { AskAi } from "@/components/AskAi";
import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BookmarkIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { directoryInfo } from "@/lib/directory";
import { JobCard } from "@/components/JobCard";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { POPULAR_LOCATIONS } from "@/lib/sponsorTypes";
import { placePath, rolePath } from "@/lib/seo";
import { Horus } from "@/components/game/Horus";
import { StampRushLoader } from "@/components/game/StampRushLoader";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { OCCUPATIONS, occupationByCode } from "@/lib/soc";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const goingRate = (code: string) => occupationByCode(code)?.goingRate ?? THRESHOLDS.general;

// Re-render hourly so the sponsor count and register date stay current
export const revalidate = 3600;

const STEPS = [
  {
    icon: SearchIcon,
    title: "Find a licensed sponsor",
    body: "Search the official register by company, town or visa route. Every employer here can legally sponsor a work visa.",
  },
  {
    icon: BriefcaseIcon,
    title: "See their open roles",
    body: "We find each company's careers page and, where they use Greenhouse, Lever, Ashby or Workable, list their live jobs, UK roles first.",
  },
  {
    icon: BookmarkIcon,
    title: "Track your applications",
    body: "Shortlist sponsors and move them from Interested to Applied to Offer. Export to a spreadsheet any time.",
  },
];

const FAQ = [
  {
    q: "Does being on the sponsor register mean a job will sponsor my visa?",
    a: "No. A licence means an employer can sponsor workers, not that every role will. Look for visa sponsorship in the job ad or ask the recruiter.",
  },
  {
    q: "What does an A or B sponsor rating mean?",
    a: "A-rated sponsors can issue certificates of sponsorship. B-rated sponsors are on a Home Office action plan and cannot assign new certificates until it is resolved.",
  },
  {
    q: "Why can't I find a company I know?",
    a: "The register lists legal company names, which can differ from the brand. Look up the legal name on Companies House and search for that.",
  },
];

async function getStats() {
  try {
    const [info, jobs] = await Promise.all([directoryInfo(), jobsInfo()]);
    return {
      jobCount: jobs.count,
      count: info.count,
      date: info.registerDate
        ? new Date(info.registerDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null,
    };
  } catch {
    return { count: null, jobCount: 0, date: null };
  }
}

export default async function Home() {
  const { count, jobCount, date } = await getStats();
  const latestJobs = (await searchJobs({ limit: 6 }).catch(() => null))?.items ?? [];
  const countLabel = count ? count.toLocaleString("en-GB") : "120,000+";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Horus",
            url: "https://horus.to",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://horus.to/sponsors?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />

      <section className="reveal container max-w-6xl px-4 pb-16 pt-12 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheckIcon className="text-sage" />
              Official Home Office data{date && ` · updated ${date}`}
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
              Stop searching blind.{" "}
              <span className="font-normal italic text-muted-foreground">Find UK jobs that can sponsor your visa.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Search all {countLabel} licensed sponsors, see who&apos;s hiring, and keep track of where you&apos;ve applied.
            </p>

            <form action="/sponsors" className="mt-10 flex max-w-xl items-center gap-2 rounded-md border border-input bg-card p-1.5 focus-within:border-foreground/40">
              <label className="relative flex-1">
                <span className="sr-only">Company name</span>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
                <input
                  name="q"
                  type="search"
                  placeholder="Company name, e.g. Deliveroo"
                  className="h-10 w-full bg-transparent pl-10 pr-3 text-base outline-none"
                />
              </label>
              <Button type="submit">Search</Button>
            </form>

            <AskAi className="mt-3 max-w-xl text-left" />

            <dl className="mt-8 grid max-w-xl gap-3 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <dt className="w-14 text-muted-foreground">Places</dt>
                {POPULAR_LOCATIONS.slice(0, 6).map((place) => (
                  <dd key={place}>
                    <Link
                      href={placePath(place)}
                      className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                    >
                      {place}
                    </Link>
                  </dd>
                ))}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <dt className="w-14 text-muted-foreground">Roles</dt>
                {ROLE_FAMILIES.slice(0, 6).map(({ id, label }) => (
                  <dd key={id}>
                    <Link
                      href={rolePath(id)}
                      className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                    >
                      {label}
                    </Link>
                  </dd>
                ))}
              </div>
            </dl>
          </div>
          <div className="hidden justify-center lg:flex">
            <Horus size={200} />
          </div>
        </div>

        <div className="mt-16 grid border-y border-border text-left sm:grid-cols-3 sm:divide-x sm:divide-border">
          {[
            {
              href: "/jobs",
              eyebrow: "Ready to apply",
              title: "Latest sponsored jobs",
              body: jobCount > 0 ? `${jobCount.toLocaleString("en-GB")} live roles, newest first.` : "Live roles from licensed sponsors.",
              cta: "Browse jobs",
            },
            { href: "/sponsors", eyebrow: "Looking for a sponsor", title: "Browse licensed employers", body: "Filter by town, visa route and rating.", cta: "Find sponsors" },
            { href: "/saved", eyebrow: "Already applying", title: "Track your applications", body: "Move sponsors from Interested to Offer.", cta: "Open shortlist" },
          ].map((c, i) => (
            <Link key={c.href} href={c.href} className="group border-border py-8 sm:px-8 sm:first:pl-0 sm:last:pr-0 max-sm:border-b max-sm:last:border-b-0">
              <p className="eyebrow">
                <span className="tabular-nums">0{i + 1}</span> · {c.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold">{c.title}</h2>
              <p className="mt-2 text-muted-foreground">{c.body}</p>
              <p className="mt-5 text-sm font-medium text-primary">
                <span className="underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">{c.cta}</span> →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container max-w-6xl px-4 pb-20" aria-labelledby="salary-check">
        <div className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">New · Visa salary checker</p>
            <h2 id="salary-check" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Is the salary high enough <span className="italic">to sponsor you?</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each job has its own going rate, not just the {fmt(THRESHOLDS.general)} minimum. A software developer needs {fmt(goingRate("2134"))},
              a civil engineer {fmt(goingRate("2121"))}. Check yours in seconds, including new-entrant rates.
            </p>
          </div>
          <form action="/visa-salary-checker" className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Job title</span>
              <input
                name="title"
                required
                placeholder="e.g. Data engineer"
                className="h-11 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus:border-foreground/40"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Salary (£ a year)</span>
              <input
                name="salary"
                inputMode="numeric"
                placeholder="Optional"
                className="h-11 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus:border-foreground/40"
              />
            </label>
            <Button type="submit" size="lg">
              Check
            </Button>
            <p className="text-xs text-muted-foreground sm:col-span-3">
              Uses the official going rates for all {OCCUPATIONS.length} occupation codes.{" "}
              <Link href="/visa-salary-checker" className="underline underline-offset-2 hover:text-foreground">
                Browse all rates
              </Link>
            </p>
          </form>
        </div>
      </section>

      <section className="section-band py-16">
        <div className="container flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4">
          <div>
            <p className="font-display text-6xl font-semibold tabular-nums sm:text-7xl">{countLabel}</p>
            <p className="mt-2 text-muted-foreground">licensed sponsors on the register</p>
          </div>
        </div>
        <div className="mt-10">
          <Marquee items={POPULAR_LOCATIONS} />
        </div>
      </section>

      {latestJobs.length > 0 && (
        <section className="container max-w-6xl px-4 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Latest sponsored jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
              See all {jobCount.toLocaleString("en-GB")} jobs →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {latestJobs.map((job) => (
              <JobCard key={job.url} job={job} />
            ))}
          </div>
        </section>
      )}

      <section className="container max-w-4xl px-4 pt-24" aria-labelledby="stamp-rush">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">A short break</p>
            <h2 id="stamp-rush" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Bored of forms? Play <span className="italic">Stamp Rush</span>.
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Every stamp is a real A-rated sponsor. Catch a gold one and it might just be your next employer.
            </p>
          </div>
        </div>
        <StampRushLoader />
      </section>

      <section className="container max-w-4xl px-4 py-24">
        <h2 className="font-display text-4xl font-semibold sm:text-5xl">
          From register to <span className="font-normal italic text-muted-foreground">application in three steps.</span>
        </h2>
        <ol className="mt-14 divide-y divide-border">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="grid gap-4 py-8 sm:grid-cols-[6rem_1fr]">
              <span className="font-display text-5xl font-normal italic text-muted-foreground/60">{i + 1}.</span>
              <div>
                <h3 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <Icon width={20} height={20} className="text-primary" /> {title}
                </h3>
                <p className="mt-2 max-w-xl text-lg text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-band py-20">
        <div className="container max-w-4xl px-4">
          <h2 className="font-display text-3xl font-semibold">Good to know</h2>
          <ul className="mt-8 grid gap-8 text-muted-foreground md:grid-cols-3">
            <li>
              <strong className="block text-foreground">A licence isn&apos;t a promise.</strong> Being on the register means
              an employer <em>can</em> sponsor, not that every role will. Look for &quot;visa sponsorship&quot; in the job
              ad or ask the recruiter.
            </li>
            <li>
              <strong className="block text-foreground">Prefer A-rated sponsors.</strong> B-rated sponsors are on a Home
              Office action plan and can&apos;t assign new certificates of sponsorship until it&apos;s resolved.
            </li>
            <li>
              <strong className="block text-foreground">Search the legal name.</strong> The register lists registered company
              names, which can differ from the brand you know. If a brand doesn&apos;t show up, look up its legal name
              on Companies House.
            </li>
          </ul>
          <Button asChild variant="link" className="mt-6 px-0">
            <Link href="/guide/visa-basics">Read the visa basics guide →</Link>
          </Button>
        </div>
      </section>

      <section className="container px-4 py-20">
        <div className="rounded-lg bg-primary px-6 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">
            Ready to find your sponsor?
          </h2>
          <Button asChild size="lg" className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href="/sponsors">Search sponsors</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
