import Link from "next/link";
import { AskAi } from "@/components/AskAi";
import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, BookmarkIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { directoryInfo } from "@/lib/directory";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
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

      <section className="reveal container max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-24">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
          <ShieldCheckIcon className="text-emerald-600" />
          Official Home Office data{date && ` · updated ${date}`}
        </p>
        <h1 className="mt-8 text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          Stop searching blind.{" "}
          <span className="text-muted-foreground">Find UK jobs that can sponsor your visa.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Search all {countLabel} licensed sponsors, see who&apos;s hiring, and keep track of where you&apos;ve applied.
        </p>

        <form action="/sponsors" className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm">
          <label className="relative flex-1">
            <span className="sr-only">Company name</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" width={18} height={18} />
            <input
              name="q"
              type="search"
              placeholder="Company name, e.g. Deliveroo"
              className="h-11 w-full rounded-full bg-transparent pl-11 pr-4 text-base outline-none"
            />
          </label>
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>

        <AskAi className="mx-auto mt-4 max-w-xl text-left" />

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

        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <span className="py-1.5 text-muted-foreground">Roles:</span>
          {ROLE_FAMILIES.slice(0, 6).map(({ id, label }) => (
            <Link
              key={id}
              href={`/sponsors?role=${id}&visa=Skilled+Worker`}
              className="rounded-full border border-border bg-card px-3 py-1.5 hover:border-primary/50 hover:bg-muted"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-4 text-left sm:grid-cols-2">
          <Link href="/sponsors" className="card group p-8 transition-colors hover:bg-accent/60">
            <p className="eyebrow">Looking for a sponsor</p>
            <h2 className="mt-3 font-display text-2xl font-bold">Browse licensed employers</h2>
            <p className="mt-2 text-muted-foreground">Filter by town, visa route and rating.</p>
            <p className="mt-6 font-medium text-primary group-hover:underline">Find sponsors →</p>
          </Link>
          <Link href="/saved" className="card group p-8 transition-colors hover:bg-accent/60">
            <p className="eyebrow">Already applying</p>
            <h2 className="mt-3 font-display text-2xl font-bold">Track your applications</h2>
            <p className="mt-2 text-muted-foreground">Move sponsors from Interested to Offer.</p>
            <p className="mt-6 font-medium text-primary group-hover:underline">Open shortlist →</p>
          </Link>
        </div>
      </section>

      <section className="section-band py-20 text-center">
        <p className="font-display text-6xl font-bold tracking-tight text-primary sm:text-8xl">{countLabel}</p>
        <p className="mt-3 text-lg text-muted-foreground">licensed sponsors on the register</p>
        <div className="mt-10">
          <Marquee items={POPULAR_LOCATIONS} />
        </div>
      </section>

      <section className="container max-w-4xl px-4 py-24">
        <h2 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
          From register to <span className="text-muted-foreground">application in three steps.</span>
        </h2>
        <ol className="mt-14 divide-y divide-border">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="grid gap-4 py-8 sm:grid-cols-[6rem_1fr]">
              <span className="font-display text-5xl font-bold text-primary/30">0{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <Icon width={22} height={22} className="text-primary" /> {title}
                </h3>
                <p className="mt-2 max-w-xl text-lg text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-band py-20">
        <div className="container max-w-4xl px-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Good to know</h2>
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
        <div className="rounded-[2rem] bg-foreground px-6 py-16 text-center text-background">
          <h2 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to find your sponsor?
          </h2>
          <Button asChild size="lg" className="mt-8">
            <Link href="/sponsors">Search sponsors</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
