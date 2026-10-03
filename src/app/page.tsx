import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BookmarkIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { directoryInfo } from "@/lib/directory";
import { POPULAR_LOCATIONS } from "@/lib/sponsorTypes";

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

async function getStats() {
  try {
    const info = await directoryInfo();
    return {
      count: info.count,
      date: info.registerDate
        ? new Date(info.registerDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null,
    };
  } catch {
    return { count: null, date: null };
  }
}

export default async function Home() {
  const { count, date } = await getStats();
  const countLabel = count ? count.toLocaleString("en-GB") : "120,000+";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Sidepal",
            url: "https://sidepal.club",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://sidepal.club/sponsors?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
        <div className="container max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheckIcon className="text-emerald-600" />
            Official Home Office data{date && ` · updated ${date}`}
          </p>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Find UK jobs that can sponsor your visa
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Search all {countLabel} licensed sponsors, see who&apos;s hiring, and keep track of where you&apos;ve applied.
          </p>

          <form action="/sponsors" className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Company name</span>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
              <input
                name="q"
                type="search"
                placeholder="Company name, e.g. Deliveroo"
                className="h-12 w-full rounded-lg border border-input bg-card pl-11 pr-4 text-base shadow-sm focus:border-primary"
              />
            </label>
            <Button type="submit" size="lg">
              Search sponsors
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            <span className="py-1.5 text-muted-foreground">Popular:</span>
            {POPULAR_LOCATIONS.slice(0, 6).map((place) => (
              <Link
                key={place}
                href={`/sponsors?location=${encodeURIComponent(place)}&visa=Skilled+Worker`}
                className="rounded-full border border-border bg-card px-3 py-1.5 hover:border-primary/50 hover:bg-muted"
              >
                {place}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-16 sm:py-20">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon width={20} height={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">
                <span className="text-muted-foreground">{i + 1}.</span> {title}
              </h3>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container max-w-3xl px-4 pb-20">
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Good to know</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">A licence isn&apos;t a promise.</strong> Being on the register means
              an employer <em>can</em> sponsor, not that every role will. Look for &quot;visa sponsorship&quot; in the job
              ad or ask the recruiter.
            </li>
            <li>
              <strong className="text-foreground">Prefer A-rated sponsors.</strong> B-rated sponsors are on a Home
              Office action plan and can&apos;t assign new certificates of sponsorship until it&apos;s resolved.
            </li>
            <li>
              <strong className="text-foreground">Search the legal name.</strong> The register lists registered company
              names, which can differ from the brand you know. If a brand doesn&apos;t show up, look up its legal name
              on Companies House.
            </li>
          </ul>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link href="/guide/visa-basics">Read the visa basics guide →</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
