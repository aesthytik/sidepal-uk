import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AskAi } from "@/components/AskAi";
import { JsonLd } from "@/components/JsonLd";
import { Marquee } from "@/components/Marquee";
import { ArrowChip, Button } from "@/components/ui/button";
import { BookmarkIcon, FileTextIcon, MapIcon, MessageIcon, PoundIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { directoryInfo } from "@/lib/directory";
import { JobCard } from "@/components/JobCard";
import { DailyQuest } from "@/components/DailyQuest";
import { jobsInfo, searchJobs } from "@/lib/jobs";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { POPULAR_LOCATIONS, VISA_CATEGORIES } from "@/lib/sponsorTypes";
import { SITE, SITE_TITLE, SITE_DESCRIPTION, faq, pageMetadata, placePath, rolePath } from "@/lib/seo";
import { StampRushLoader } from "@/components/game/StampRushLoader";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { OCCUPATIONS, occupationByCode } from "@/lib/soc";
import { Accordion, Carousel, Reveal, Tabs } from "@/components/motion";
import { HeroScroll } from "@/components/HeroScroll";

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;
const goingRate = (code: string) => occupationByCode(code)?.goingRate ?? THRESHOLDS.general;
/** Points a `.eyebrow` or `.float-label` dot at one of the five colour families. */
const dot = (family: string) => ({ "--dot": `var(--${family}-dot)` }) as CSSProperties;

// Set here, not in the layout, so other pages never inherit the home page's canonical
export const metadata: Metadata = pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" });

// Re-render hourly so the sponsor count and register date stay current
export const revalidate = 3600;

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
const FAQ_PHOTOS = ["/images/interview.webp", "/images/paperwork.webp", "/images/career-change.webp"];

// Literal class names so Tailwind keeps them
const HERO_LABELS = [
  { text: "Licensed sponsors", family: "purple", tone: "bg-purple-soft text-purple-ink", pos: "-left-[9%] top-[9%]" },
  { text: "Live jobs", family: "green", tone: "bg-green-soft text-green-ink", pos: "-right-[15%] top-[15%]" },
  { text: "Salary check", family: "blue", tone: "bg-blue-soft text-blue-ink", pos: "-left-[22%] top-[45%]" },
  { text: "Tailor my CV", family: "pink", tone: "bg-pink-soft text-pink-ink", pos: "-right-[6%] top-[52%]" },
  { text: "Shortlist", family: "green", tone: "bg-green-soft text-green-ink", pos: "-left-[6%] bottom-[8%]" },
  { text: "Interview prep", family: "amber", tone: "bg-amber-soft text-amber-ink", pos: "-right-[20%] bottom-[16%]" },
];

const PAINS = [
  { text: "Most licensed sponsors aren't hiring right now", family: "green", tone: "bg-green-soft text-green-ink", photo: "/images/interview.webp", pos: "lg:left-[18%] lg:top-[4%]" },
  { text: "Job ads rarely say whether they sponsor", family: "pink", tone: "bg-pink-soft text-pink-ink", photo: "/images/paperwork.webp", pos: "lg:right-[6%] lg:top-[12%]" },
  { text: "Salary rules change with every occupation code", family: "blue", tone: "bg-blue-soft text-blue-ink", photo: null, pos: "lg:left-0 lg:top-[16%]" },
  { text: "A cover letter rewritten for every single role", family: "purple", tone: "bg-purple-soft text-purple-ink", photo: "/images/smile.webp", pos: "lg:bottom-[14%] lg:left-[6%]" },
  { text: "Applications scattered across fifty open tabs", family: "amber", tone: "bg-amber-soft text-amber-ink", photo: "/images/tech.webp", pos: "lg:bottom-[22%] lg:left-[44%]" },
  { text: "Moving country is hard enough already", family: "green", tone: "bg-green-soft text-green-ink", photo: "/images/travel.webp", pos: "lg:bottom-[6%] lg:right-0" },
];

const ROLE_TONES = ["bg-green-dot", "bg-pink-dot", "bg-blue-dot", "bg-amber-dot", "bg-purple-dot"];

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

function Checklist({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={`rounded-[12px] border border-border bg-white p-3 text-[13px] shadow-float ${className ?? ""}`}>
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 py-1">
          <span aria-hidden="true" className="inline-flex size-4 items-center justify-center rounded-full bg-green-dot text-[10px] text-primary">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  const { count, jobCount, date } = await getStats();
  const latestJobs = (await searchJobs({ limit: 6 }).catch(() => null))?.items ?? [];
  const countLabel = count ? count.toLocaleString("en-GB") : "120,000+";

  const audiences = [
    {
      id: "graduates",
      label: "Graduates",
      photo: "/images/graduates.webp",
      alt: "Students working together on laptops",
      title: "Moving on from the Graduate visa",
      body: "Find employers that already sponsor entry-level roles, and check the lower new-entrant salary rate that may apply to you.",
      href: "/jobs",
      cta: "Browse entry-level friendly jobs",
    },
    {
      id: "skilled",
      label: "Skilled workers",
      photo: "/images/skilled-workers.webp",
      alt: "Colleagues celebrating in an office",
      title: "Switching sponsor, or coming from abroad",
      body: "Search every licensed employer by town, route and rating, and see which of them have live roles today.",
      href: "/sponsors",
      cta: "Search licensed sponsors",
    },
    {
      id: "health",
      label: "Healthcare",
      photo: "/images/healthcare.webp",
      alt: "Doctor in a white coat",
      title: "Nurses, carers and clinicians",
      body: "Health and care roles have their own salary rules and some of the most active sponsors. Start with the jobs that are open now.",
      href: rolePath("health"),
      cta: "See nursing and care jobs",
    },
    {
      id: "tech",
      label: "Tech",
      photo: "/images/tech.webp",
      alt: "A team writing code together",
      title: "Engineers, data and product people",
      body: `A software developer needs at least ${fmt(goingRate("2134"))}. Filter by role and see which tech sponsors are hiring.`,
      href: rolePath("software"),
      cta: "See software jobs",
    },
    {
      id: "changers",
      label: "Career changers",
      photo: "/images/career-change.webp",
      alt: "A team meeting in an open-plan office",
      title: "Trying a new field",
      body: "Every occupation code has its own going rate. Check what your new role needs to pay before you apply.",
      href: "/visa-salary-checker",
      cta: "Check a salary",
    },
  ];

  const tools = [
    { id: "sponsors", title: "Sponsor search", summary: "Every employer on the Home Office register, searchable.", icon: <SearchIcon />, chip: "bg-pink-dot", body: "Filter by town, visa route and A or B rating. Each sponsor page shows its live jobs and careers page.", href: "/sponsors", cta: "Search sponsors" },
    { id: "map", title: "Jobs map", summary: "See where licensed sponsors are hiring.", icon: <MapIcon />, chip: "bg-green-dot", body: `${jobCount > 0 ? jobCount.toLocaleString("en-GB") : "Thousands of"} live roles from licensed sponsors, grouped by place so you can see where the work is.`, href: "/jobs?view=map", cta: "Open the map" },
    { id: "salary", title: "Salary checker", summary: "Is the pay high enough to sponsor you?", icon: <PoundIcon />, chip: "bg-blue-dot", body: `Official going rates for all ${OCCUPATIONS.length} occupation codes, including new-entrant rates.`, href: "/visa-salary-checker", cta: "Check a salary" },
    { id: "tailor", title: "Tailor my CV", summary: "Match your CV to the job ad's own words.", icon: <FileTextIcon />, chip: "bg-amber-dot", body: "See which keywords your CV already covers and draft bullets and a cover letter that are upfront about sponsorship.", href: "/jobs?sort=match", cta: "Find a job to tailor" },
    { id: "prep", title: "Interview prep", summary: "Likely questions for the role in front of you.", icon: <MessageIcon />, chip: "bg-purple-dot", body: "Get questions, talking points and sponsorship answers for a specific job, ready to print.", href: "/jobs", cta: "Pick a job" },
    { id: "shortlist", title: "Shortlist tracker", summary: "From interested to offer, in one list.", icon: <BookmarkIcon />, chip: "bg-green-dot", body: "Save sponsors and jobs, move them through each stage and export to a spreadsheet any time.", href: "/saved", cta: "Open my shortlist" },
  ];

  return (
    <main>
      <JsonLd
        data={[
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
        ]}
      />

      <HeroScroll
        intro={
          <div className="container max-w-6xl px-4 pt-8 text-center sm:pt-10">
            <div data-hero-copy="">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                <ShieldCheckIcon /> Official Home Office data{date && ` · updated ${date}`}
              </p>
              <h1 className="mx-auto mt-5 max-w-4xl font-display text-[2.5rem] leading-[1.12] tracking-[-0.02em] sm:text-[52px] sm:leading-[1.15]">
                Find UK employers that can sponsor your visa
              </h1>
              <p className="mx-auto mt-4 max-w-2xl">
                Search {countLabel} licensed sponsors, see who&apos;s hiring right now, check the salary you need and track every application in one place.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/sponsors">
                    Search sponsors <ArrowChip />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/jobs">Browse jobs</Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto mt-10 max-w-[710px]">
              <div data-hero-photo="" className="relative aspect-[710/365] overflow-hidden rounded-[20px]">
                <Image
                  src="/images/hero-london.webp"
                  alt="Aerial view of London and the River Thames"
                  fill
                  priority
                  sizes="(min-width: 768px) 710px, 100vw"
                  className="object-cover"
                />
              </div>
              {HERO_LABELS.map((l) => (
                <span key={l.text} data-hero-label="" className={`float-label absolute hidden md:inline-flex ${l.tone} ${l.pos}`} style={dot(l.family)}>
                  {l.text}
                </span>
              ))}
            </div>
          </div>
        }
        statement={
          <div className="container relative flex max-w-6xl flex-col items-center justify-center px-4 py-20 lg:h-full lg:py-0">
            <h2 className="max-w-3xl text-center font-display text-[2rem] leading-[1.2] sm:text-[40px]">
              We turn a {countLabel}-name register into a short list of employers worth applying to.
            </h2>
            <ul className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:contents">
              {PAINS.map((p) => (
                <li key={p.text} data-pain="" className={`flex items-center gap-3 lg:absolute ${p.pos}`}>
                  {p.photo && (
                    <span className="relative size-[76px] shrink-0 overflow-hidden rounded-[12px]">
                      <Image src={p.photo} alt="" fill sizes="76px" className="object-cover" />
                    </span>
                  )}
                  <span className={`float-label max-w-[16rem] items-start rounded-[12px] px-4 py-4 leading-snug ${p.tone}`} style={dot(p.family)}>
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <section className="border-t border-border" aria-label="Horus in numbers">
        <dl className="container grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-10 text-center lg:grid-cols-4">
          {[
            { value: countLabel, label: "licensed sponsors" },
            { value: jobCount > 0 ? jobCount.toLocaleString("en-GB") : "1,000s", label: "live jobs" },
            { value: String(OCCUPATIONS.length), label: "occupation going rates" },
            { value: String(VISA_CATEGORIES.length), label: "visa routes covered" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-[44px] font-medium leading-none tracking-[-0.03em] tabular-nums sm:text-[64px]">{s.value}</dd>
              <dd className="mt-2 text-[17px]">{s.label}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="container max-w-6xl px-4 pt-16" aria-labelledby="lookup">
        <Reveal className="rounded-[20px] bg-accent p-6 sm:p-10">
          <p className="eyebrow">Search</p>
          <h2 id="lookup" className="mt-4 font-display text-[32px] leading-tight">
            Look up any employer
          </h2>
          <form action="/sponsors" className="mt-6 flex max-w-2xl items-center gap-2 rounded-[14px] border border-border bg-white p-1.5">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Company name</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
              <input name="q" type="search" placeholder="Company name, e.g. Deliveroo" className="h-11 w-full bg-transparent pl-10 pr-3 text-base outline-none" />
            </label>
            <Button type="submit">Search</Button>
          </form>
          <AskAi className="mt-3 max-w-2xl" />
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {POPULAR_LOCATIONS.slice(0, 6).map((place) => (
              <Link key={place} href={placePath(place)} className="rounded-[10px] bg-white px-3 py-1.5 hover:bg-primary hover:text-primary-foreground">
                {place}
              </Link>
            ))}
          </div>
          <DailyQuest className="mt-8" />
        </Reveal>
      </section>

      <section className="container grid max-w-6xl items-center gap-12 px-4 py-24 lg:grid-cols-2" aria-labelledby="salary-check">
        <Reveal>
          <p className="eyebrow">Salary check</p>
          <h2 id="salary-check" className="mt-5 font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
            Is the salary high enough to sponsor you?
          </h2>
          <p className="mt-5">
            Each job has its own going rate, not just the {fmt(THRESHOLDS.general)} minimum. A software developer needs {fmt(goingRate("2134"))}, a civil
            engineer {fmt(goingRate("2121"))}.
          </p>
          <p className="mt-3">Check yours in seconds, including the lower new-entrant rates for graduates and people under 26.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/visa-salary-checker">
                Check a salary <ArrowChip />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/guide/visa-basics">Read the visa guide</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal delay={120} className="relative">
          <div className="rounded-[20px] bg-green-dot pl-12 pt-12">
            <form action="/visa-salary-checker" className="space-y-4 rounded-tl-[16px] bg-white p-6">
              <p className="font-display text-xl">Visa salary checker</p>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Job title</span>
                <input name="title" required placeholder="e.g. Data engineer" className="h-11 w-full rounded-[10px] border border-input px-3 outline-none focus:border-primary" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Salary (£ a year)</span>
                <input name="salary" inputMode="numeric" placeholder="Optional" className="h-11 w-full rounded-[10px] border border-input px-3 outline-none focus:border-primary" />
              </label>
              <Button type="submit" className="w-full">
                Check
              </Button>
            </form>
          </div>
          <Checklist items={["Official going rates", "New-entrant rates", `All ${OCCUPATIONS.length} codes`]} className="absolute -left-6 top-1/3 hidden sm:block" />
        </Reveal>
      </section>

      <section className="container grid max-w-6xl items-center gap-12 px-4 pb-24 lg:grid-cols-2" aria-labelledby="tailor">
        <Reveal className="relative order-2 lg:order-1">
          <div className="rounded-[20px] bg-pink-dot pr-12 pt-12">
            <ol className="space-y-3 rounded-tr-[16px] bg-white p-6 text-sm" aria-label="How tailoring works">
              <li className="rounded-[12px] bg-muted p-4">
                <p className="font-medium">1 · Reads the whole job ad</p>
                <p className="mt-1 text-muted-foreground">Straight from the company&apos;s job board, not just the preview.</p>
              </li>
              <li className="rounded-[12px] bg-muted p-4">
                <p className="font-medium">2 · Checks your keywords</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Example keyword check">
                  {["Python", "AWS", "PostgreSQL"].map((k) => (
                    <li key={k} className="rounded-[8px] bg-green-soft px-2 py-0.5 text-green-ink">
                      ✓ {k}
                    </li>
                  ))}
                  {["Kafka", "Go"].map((k) => (
                    <li key={k} className="rounded-[8px] bg-pink-soft px-2 py-0.5 text-pink-ink">
                      {k}
                    </li>
                  ))}
                </ul>
              </li>
              <li className="rounded-[12px] bg-muted p-4">
                <p className="font-medium">3 · Drafts bullets and a cover letter</p>
                <p className="mt-2 border-l-2 border-pink-dot pl-3 italic text-muted-foreground">
                  &ldquo;Reduced chargeback losses by 18% by building rule-based fraud checks into payment flows.&rdquo;
                </p>
              </li>
            </ol>
          </div>
          <span className="float-label absolute -right-4 top-8 hidden bg-pink-soft text-pink-ink sm:inline-flex" style={dot("pink")}>
            Your CV
          </span>
        </Reveal>
        <Reveal delay={120} className="order-1 lg:order-2">
          <p className="eyebrow" style={dot("pink")}>
            Tailor my application
          </p>
          <h2 id="tailor" className="mt-5 font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
            Fit your CV to the job in seconds
          </h2>
          <ul className="mt-6 list-disc space-y-2 pl-5">
            <li>Reads the full ad from the employer&apos;s own job board</li>
            <li>Shows which keywords your CV already covers</li>
            <li>Drafts bullets and a cover letter in the employer&apos;s words</li>
            <li>Upfront about needing sponsorship</li>
            <li>The keyword check runs in your browser; nothing is stored</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/jobs?sort=match">
                Find a job to tailor <ArrowChip />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/profile">Add your CV</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="bg-primary py-24 text-white" aria-labelledby="hiring">
        <div className="container max-w-6xl px-4">
          <Reveal as="h2" className="mx-auto max-w-4xl text-center font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
            <span id="hiring">Licensed sponsors hiring across the UK</span>
          </Reveal>
        </div>
        <div className="mt-12">
          <Marquee items={POPULAR_LOCATIONS} itemClassName="text-[26px] text-white/85" />
        </div>
        <div className="container mt-16 max-w-6xl px-4">
          <Carousel label="Good to know" counter>
            {FAQ.map((item, i) => (
              <div key={item.q} className="grid w-[calc(min(72rem,100vw)-2rem)] gap-8 sm:grid-cols-[15rem_1fr] sm:items-center">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[15px]">
                  <Image src={FAQ_PHOTOS[i]} alt="" fill sizes="240px" className="object-cover" />
                </div>
                <div>
                  <p className="eyebrow text-white" style={dot("green")}>
                    Good to know
                  </p>
                  <p className="mt-5 font-display text-[1.75rem] leading-[1.25] sm:text-[36px]">{item.q}</p>
                  <p className="mt-5 max-w-2xl text-white/85">{item.a}</p>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      <section className="container max-w-6xl px-4 py-24" aria-labelledby="who">
        <Reveal className="text-center">
          <p className="eyebrow mx-auto" style={dot("pink")}>
            Who it&apos;s for
          </p>
          <h2 id="who" className="mt-5 font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
            Built for people moving their career to the UK
          </h2>
          <p className="mx-auto mt-4 max-w-2xl">Wherever you&apos;re starting from, Horus shows you the employers that can actually take you on.</p>
        </Reveal>
        <div className="mt-14">
          <Tabs
            label="Who Horus is for"
            items={audiences.map((a) => ({
              id: a.id,
              label: a.label,
              content: (
                <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
                  <div className="relative aspect-[4/5] -rotate-3 overflow-hidden rounded-[20px]">
                    <Image src={a.photo} alt={a.alt} fill sizes="(min-width: 1024px) 380px, 90vw" className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-display text-[26px] leading-tight">{a.title}</h3>
                    <p className="mt-3">{a.body}</p>
                    <Link href={a.href} className="mt-5 inline-flex items-center gap-2 font-display font-medium">
                      <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full bg-black text-[11px] text-white">
                        →
                      </span>
                      {a.cta}
                    </Link>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </section>

      <section className="bg-primary py-24 text-white" aria-labelledby="roles">
        <div className="container max-w-6xl px-4">
          <Reveal>
            <p className="eyebrow text-white" style={dot("blue")}>
              Jobs by role
            </p>
            <h2 id="roles" className="mt-5 font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
              Made for how the UK actually hires
            </h2>
            <p className="mt-4 max-w-3xl text-white/85">
              Sponsors hire across every field, from nursing to software to logistics. Pick a role family to see the licensed employers with live jobs in it.
            </p>
          </Reveal>
          <Carousel label="Role families" className="mt-12">
            {ROLE_FAMILIES.map((r, i) => (
              <Link
                key={r.id}
                href={rolePath(r.id)}
                className={`flex h-[340px] w-[280px] flex-col justify-between rounded-[20px] p-6 text-black transition-transform hover:-translate-y-1 ${ROLE_TONES[i % ROLE_TONES.length]}`}
              >
                <span className="font-display text-[32px] leading-[1.1] tracking-[-0.02em]">{r.label}</span>
                <span className="inline-flex items-center gap-2 font-display font-medium">
                  See jobs <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </Carousel>
        </div>
      </section>

      <section className="bg-accent py-24" aria-labelledby="tools">
        <div className="container max-w-5xl px-4">
          <Reveal className="text-center">
            <h2 id="tools" className="mx-auto max-w-3xl font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
              Everything for your visa job search, in one place
            </h2>
            <p className="mx-auto mt-4 max-w-2xl">
              One place to find sponsors, check salaries, tailor applications and keep track of them. Free, and nothing to install.
            </p>
          </Reveal>
          <div className="mt-12">
            <Accordion
              items={tools.map((t) => ({
                id: t.id,
                title: t.title,
                summary: t.summary,
                icon: t.icon,
                chip: t.chip,
                body: (
                  <>
                    <p>{t.body}</p>
                    <Link href={t.href} className="mt-4 inline-flex h-10 items-center rounded-[11px] bg-white px-4 font-display text-[15px] font-medium text-primary hover:bg-lime">
                      {t.cta} →
                    </Link>
                  </>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {latestJobs.length > 0 && (
        <section className="container max-w-6xl px-4 pt-24" aria-labelledby="latest">
          <Reveal className="text-center">
            <h2 id="latest" className="font-display text-[2.25rem] leading-[1.15] sm:text-[52px]">
              Latest jobs from licensed sponsors
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {latestJobs.map((job, i) => (
              <Reveal key={job.url} delay={(i % 2) * 100}>
                <JobCard job={job} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/jobs">
                See all {jobCount.toLocaleString("en-GB")} jobs <ArrowChip />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="container max-w-4xl px-4 py-24" aria-labelledby="stamp-rush">
        <Reveal className="mb-8 text-center">
          <p className="eyebrow mx-auto" style={dot("amber")}>
            A short break
          </p>
          <h2 id="stamp-rush" className="mt-5 font-display text-[2rem] leading-tight sm:text-[40px]">
            Bored of forms? Play Stamp Rush
          </h2>
          <p className="mx-auto mt-3 max-w-xl">Every stamp is a real A-rated sponsor. Catch a gold one and it might just be your next employer.</p>
        </Reveal>
        <StampRushLoader />
      </section>
    </main>
  );
}
