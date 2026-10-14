import type { Metadata } from "next";
import Link from "next/link";
import { getOverview, getRecordings, RANGES, type Overview, type Range, type Recording } from "@/lib/posthog-api";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-GB");

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days);
  const days: Range = RANGES.find((r) => r === requested) ?? 7;

  let overview: Overview;
  let recordings: Recording[];
  try {
    [overview, recordings] = await Promise.all([getOverview(days), getRecordings()]);
  } catch (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
        <p className="mt-4 rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live site only, from PostHog. Refreshes every 5 minutes.</p>
        </div>
        <nav aria-label="Date range" className="flex rounded-md border border-border bg-card p-0.5 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`rounded px-3 py-1 ${r === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r}d
            </Link>
          ))}
        </nav>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Visitors" value={overview.visitors} />
        <Stat label="Pageviews" value={overview.pageviews} />
        <Stat label="Sessions" value={overview.sessions} />
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Daily visitors</h2>
        <DailyChart daily={overview.daily} />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Table
          title="Top pages"
          head={["Page", "Views", "Visitors"]}
          rows={overview.topPages.map((p) => [p.path, number.format(p.views), number.format(p.visitors)])}
        />
        <Table
          title="Referrers"
          head={["Source", "Visitors"]}
          rows={overview.referrers.map((r) => [r.domain, number.format(r.visitors)])}
        />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-medium">Recent session replays</h2>
        {recordings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No recordings yet. Check that session replay is on in PostHog (Settings → Session replay).
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recordings.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-muted"
                >
                  <span aria-hidden className="text-primary">▶</span>
                  <span className="w-16 tabular-nums">{duration(r.durationSeconds)}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{pathOf(r.startUrl)}</span>
                  <span className="text-muted-foreground">
                    {[r.country, r.browser, r.device].filter(Boolean).join(" · ") || "Unknown visitor"}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{r.clicks} clicks</span>
                  <time dateTime={r.startTime} className="w-28 text-right text-muted-foreground">
                    {new Date(r.startTime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/London" })}
                  </time>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{number.format(value)}</p>
    </div>
  );
}

/** Single-series bar chart. CSS-only hover tooltip per day, plus a table view for screen readers. */
function DailyChart({ daily }: { daily: Overview["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const label = (date: string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <>
      <div className="relative mt-4 flex h-40 items-end gap-[2px] border-b border-border" aria-hidden>
        <span className="absolute left-0 top-0 text-xs text-muted-foreground tabular-nums">{number.format(max)}</span>
        {daily.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-primary/80 group-hover:bg-primary"
              style={{ height: `${(d.visitors / max) * 100}%`, minHeight: d.visitors ? 2 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-xs shadow group-hover:block">
              <p className="font-medium">{label(d.date)}</p>
              <p className="text-muted-foreground">{number.format(d.visitors)} visitors · {number.format(d.pageviews)} views</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden>
        <span>{label(daily[0].date)}</span>
        <span>{label(daily[daily.length - 1].date)}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted-foreground">
            <tr><th className="py-1 font-normal">Day</th><th className="font-normal">Visitors</th><th className="font-normal">Pageviews</th></tr>
          </thead>
          <tbody className="tabular-nums">
            {daily.map((d) => (
              <tr key={d.date}><td className="py-0.5">{label(d.date)}</td><td>{number.format(d.visitors)}</td><td>{number.format(d.pageviews)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No data for this range.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              {head.map((h, i) => (
                <th key={h} className={`px-4 py-2 font-normal ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-border">
                {row.map((cell, i) => (
                  <td key={i} className={`px-4 py-2 ${i === 0 ? "max-w-0 truncate text-left" : "text-right tabular-nums"}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function duration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

function pathOf(url: string | null) {
  if (!url) return "—";
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
