import type { Metadata } from "next";
import Link from "next/link";
import { AskAi } from "@/components/AskAi";
import { JsonLd } from "@/components/JsonLd";
import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BookmarkIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { directoryInfo } from "@/lib/directory";
import { JobCard } from "@/components/JobCard";
import { DailyQuest } from "@/components/DailyQuest";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { POPULAR_LOCATIONS } from "@/lib/sponsorTypes";
import { SITE, SITE_TITLE, SITE_DESCRIPTION, faq, pageMetadata, placePath, rolePath } from "@/lib/seo";
import { Horus } from "@/components/game/Horus";
import { StampRushLoader } from "@/components/game/StampRushLoader";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { OCCUPATIONS, occupationByCode } from "@/lib/soc";
import { BlurWords, MorphWord, Reveal, ScrollFill } from "@/components/motion";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const goingRate = (code: string) => occupationByCode(code)?.goingRate ?? THRESHOLDS.general;

// Set here, not in the layout, so other pages never inherit the home page's canonical
export const metadata: Metadata = pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" });

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
      <JsonLd data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE}/#website`,
            name: "Horus",
            url: SITE,
            description: SITE_DESCRIPTION,
            inLanguage: "en-GB",
            publisher: { "@id": `${SITE}/#organization` },
          },
          faq(FAQ),
        ]} />

      <section className="hero-stage">
        <div className="reveal container max-w-6xl px-4 pb-16 pt-12 sm:pb-24 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_20rem]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-medium text-mint-foreground">
                <ShieldCheckIcon className="text-sage" />
                Official Home Office data{date && ` · updated ${date}`}
              </p>
              <h1 className="mt-7 font-display text-[3.25rem] leading-[0.95] tracking-[-0.015em] sm:text-7xl xl:text-[5.25rem]">
                <BlurWords text="Big plans." />
                <br />
                <span className="text-muted-foreground">
                  Clear next <MorphWord words={["steps.", "moves.", "goals."]} />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Find UK employers that can sponsor your work visa. Search {countLabel} licensed sponsors, see who&apos;s hiring, and build your next chapter, one application at a time.
              </p>

              <div className="search-tabs mt-10 max-w-xl">
                <p className="flex items-center gap-2 px-3 pb-2 pt-1.5 text-sm font-medium text-accent-foreground">
                  Search {countLabel} sponsors
                  <span className="rounded-md bg-card/80 px-1.5 py-0.5 text-xs text-primary">Free</span>
                </p>
                <form action="/sponsors" className="flex items-center gap-2 rounded-[0.9rem] bg-card p-1.5 shadow-card">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Company name</span>
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
                    <input
                      name="q"
                      type="search"
                      placeholder="Company name, e.g. Deliveroo"
                      className="h-11 w-full bg-transparent pl-10 pr-3 text-base outline-none"
                    />
                  </label>
                  <Button type="submit" variant="brand">Search</Button>
                </form>
              </div>

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
            <div className="relative hidden py-10 lg:block">
              <div className="hero-mascot flex aspect-square items-center justify-center">
                <Horus size={180} />
              </div>
              <span className="hero-sticker absolute -left-6 top-2 rounded-full bg-card px-4 py-2 text-sm font-medium">Big moves start small.</span>
              <span className="hero-sticker absolute -right-3 bottom-2 rounded-full bg-mint px-4 py-2 text-sm font-medium text-mint-foreground">Your next chapter</span>
            </div>
          </div>

          <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
            {[
              {
                href: "/jobs",
                eyebrow: "Ready to apply",
                title: "Explore open roles",
                body: jobCount > 0 ? `${jobCount.toLocaleString("en-GB")} live roles, newest first.` : "Live roles from licensed sponsors.",
                cta: "Browse jobs",
                tone: "bg-mint text-mint-foreground",
              },
              { href: "/sponsors", eyebrow: "Looking for a sponsor", title: "Browse licensed employers", body: "Filter by town, visa route and rating.", cta: "Find sponsors", tone: "bg-accent text-accent-foreground" },
              { href: "/saved", eyebrow: "Already applying", title: "Track your applications", body: "Save jobs and sponsors, and get reminded when to follow up.", cta: "Open tracker", tone: "bg-muted text-foreground" },
            ].map((c, i) => (
              <Reveal key={c.href} delay={i * 120} className="flex">
                <Link href={c.href} className={`interactive-card group flex min-h-[17rem] w-full flex-col rounded-[1.75rem] p-7 ${c.tone}`}>
                  <p className="eyebrow">
                    <span className="tabular-nums">0{i + 1}</span> · {c.eyebrow}
                  </p>
                  <h2 className="mt-auto pt-10 font-display text-[2rem] leading-tight">{c.title}</h2>
                  <p className="mt-2 opacity-80">{c.body}</p>
                  <p className="mt-5 text-sm font-medium">
                    <span className="underline decoration-current/30 underline-offset-4 group-hover:decoration-current">{c.cta}</span> →
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
          <DailyQuest className="mt-10" />
        </div>
      </section>

      <section className="container max-w-6xl px-4 pb-6 pt-12" aria-labelledby="salary-check">
        <Reveal className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">New · Visa salary checker</p>
            <h2 id="salary-check" className="mt-3 font-display text-3xl sm:text-4xl">
              Is the salary high enough <span className="text-muted-foreground">to sponsor you?</span>
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
        </Reveal>
      </section>

      <section className="container max-w-6xl px-4 pb-20" aria-labelledby="tailor">
        <Reveal className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">New · Tailor my application</p>
            <h2 id="tailor" className="mt-3 font-display text-3xl sm:text-4xl">
              Fit your CV to the job <span className="text-muted-foreground">in seconds.</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pick any job and Horus reads the full ad, shows which of its keywords your CV already covers, and drafts CV bullets and a cover
              letter in the employer&apos;s own words, upfront about needing sponsorship.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/jobs?sort=match">Find a job to tailor</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/profile">Add your CV</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The keyword check runs in your browser. AI only runs when you ask, and nothing is stored.
            </p>
          </div>

          <ol className="space-y-3 text-sm" aria-label="How it works">
            <li className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">
                <span className="tabular-nums text-muted-foreground">1</span> · Reads the whole job ad
              </p>
              <p className="mt-1 text-muted-foreground">Straight from the company&apos;s job board, not just the preview.</p>
            </li>
            <li className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">
                <span className="tabular-nums text-muted-foreground">2</span> · Checks your keywords
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Example keyword check">
                {["Python", "AWS", "PostgreSQL"].map((k) => (
                  <li key={k} className="rounded-md bg-sage/10 px-2 py-0.5 text-sage">
                    ✓ {k}
                  </li>
                ))}
                {["Kafka", "Go"].map((k) => (
                  <li key={k} className="rounded-md bg-clay/10 px-2 py-0.5 text-clay">
                    {k}
                  </li>
                ))}
              </ul>
            </li>
            <li className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">
                <span className="tabular-nums text-muted-foreground">3</span> · Drafts bullets and a cover letter
              </p>
              <p className="mt-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                &ldquo;Reduced chargeback losses by 18% by building rule-based fraud checks into payment flows.&rdquo;
              </p>
            </li>
          </ol>
        </Reveal>
      </section>

      <section className="section-band py-24 sm:py-32" aria-labelledby="why-horus">
        <div className="container grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <h2 id="why-horus" className="font-display text-5xl leading-[1.02] sm:text-6xl lg:sticky lg:top-32 lg:self-start">
            <BlurWords text="A list of licences isn't a job search." />
          </h2>
          <div className="space-y-8">
            <ScrollFill
              className="text-2xl leading-snug sm:text-[2rem]"
              text={`The register names ${countLabel} employers. It doesn't say which of them are hiring, which roles pay enough to sponsor you, or where to start.`}
            />
            <ScrollFill
              className="text-2xl leading-snug sm:text-[2rem]"
              text="So you end up with a spreadsheet, fifty open tabs and a cover letter you've rewritten for the tenth time."
            />
            <ScrollFill
              className="text-2xl leading-snug sm:text-[2rem]"
              text="Horus does the sorting. Your energy goes into the applications that can actually go somewhere."
            />
          </div>
        </div>
      </section>

      <section className="section-band py-16">
        <div className="container flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4">
          <div>
            <Reveal as="p" className="font-display text-7xl tabular-nums tracking-[-0.02em] sm:text-8xl">{countLabel}</Reveal>
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
            <h2 className="font-display text-3xl sm:text-4xl">Latest jobs from licensed sponsors</h2>
            <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
              See all {jobCount.toLocaleString("en-GB")} jobs →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {latestJobs.map((job, i) => (
              <Reveal key={job.url} delay={(i % 2) * 100}>
                <JobCard job={job} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="container max-w-4xl px-4 pt-24" aria-labelledby="stamp-rush">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">A short break</p>
            <h2 id="stamp-rush" className="mt-2 font-display text-3xl sm:text-4xl">
              Bored of forms? Play <span className="text-muted-foreground">Stamp Rush</span>.
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Every stamp is a real A-rated sponsor. Catch a gold one and it might just be your next employer.
            </p>
          </div>
        </div>
        <StampRushLoader />
      </section>

      <section className="container max-w-4xl px-4 py-24">
        <h2 className="font-display text-4xl sm:text-5xl">
          From register to <span className="text-muted-foreground">application in three steps.</span>
        </h2>
        <ol className="mt-14 divide-y divide-border">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 80} className="grid gap-4 py-8 sm:grid-cols-[6rem_1fr]">
              <span className="font-display text-6xl text-muted-foreground">{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 font-display text-2xl">
                  <Icon width={20} height={20} className="text-primary" /> {title}
                </h3>
                <p className="mt-2 max-w-xl text-lg text-muted-foreground">{body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section-band py-20">
        <div className="container max-w-4xl px-4">
          <h2 className="font-display text-3xl">Good to know</h2>
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
        <Reveal className="rounded-[2rem] bg-foreground px-6 py-20 text-center text-background">
          <h2 className="font-display text-5xl sm:text-6xl">
            <BlurWords text="Ready to find your sponsor?" />
          </h2>
          <Button asChild size="lg" className="mt-8 bg-background text-foreground hover:bg-background/90">
            <Link href="/sponsors">Search sponsors</Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
