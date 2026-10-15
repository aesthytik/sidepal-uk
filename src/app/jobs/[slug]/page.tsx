import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JobActions } from "@/components/JobActions";
import { JobCard } from "@/components/JobCard";
import { JobMatch } from "@/components/JobMatch";
import { JobTailorButton } from "@/components/JobTailor";
import { JobVerdict } from "@/components/JobVerdict";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { MapPinIcon } from "@/components/ui/icons";
import { jobById, jobsForSponsor } from "@/lib/jobs";
import { jobDescription } from "@/lib/jobs/description";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { postedAgo } from "@/lib/postedAgo";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { breadcrumbs, jobIdFromSlug, jobPath, jobPostingLd, pageMetadata, rolePath, sponsorPath } from "@/lib/seo";
import type { Salary } from "@/lib/sponsorTypes";

// Job pages are rendered on first visit and cached for an hour; roles that leave the daily index 404
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

const PER: Record<Salary["period"], string> = { year: "a year", month: "a month", week: "a week", day: "a day", hour: "an hour" };

function salaryText(s?: Salary): string | null {
  if (!s || (s.min === undefined && s.max === undefined)) return null;
  const money = (v: number) => v.toLocaleString("en-GB", { style: "currency", currency: s.currency, maximumFractionDigits: 0 });
  const range = s.min !== undefined && s.max !== undefined && s.min !== s.max ? `${money(s.min)} to ${money(s.max)}` : money((s.min ?? s.max)!);
  return `${range} ${PER[s.period]}`;
}

const roleOf = (job: IndexedJob) => ROLE_FAMILIES.find((r) => r.titles.test(job.title));

async function jobFor(slug: string) {
  return jobById(jobIdFromSlug(slug)).catch(() => null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const job = await jobFor((await params).slug);
  if (!job) return { title: "Job no longer listed", robots: { index: false } };
  const where = job.location || "UK";
  const title = `${job.title} at ${job.sponsor} | ${where}`;
  const pay = salaryText(job.salary);
  const description = [
    `${job.sponsor} is a ${job.rating ? `${job.rating}-rated ` : ""}licensed UK visa sponsor hiring a ${job.title} in ${where}.`,
    pay && `Pay: ${pay}.`,
    job.snippet?.slice(0, 160),
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
  const path = jobPath(job);
  return pageMetadata({ title, description, path, noIndex: !job.uk });
}

export default async function JobPage({ params }: Params) {
  const { slug } = await params;
  const job = await jobFor(slug);
  if (!job) notFound();
  const path = jobPath(job);
  if (`/jobs/${slug}` !== path) permanentRedirect(path);

  const [description, sponsorJobs] = await Promise.all([
    jobDescription(job).catch(() => ({ text: job.snippet ?? "", full: false })),
    jobsForSponsor(job.sponsorId).catch(() => []),
  ]);
  const others = sponsorJobs.filter((j) => j.url !== job.url && j.uk).slice(0, 4);
  const role = roleOf(job);
  const pay = salaryText(job.salary);
  const posted = postedAgo(job.postedAt);
  const posting = description.full ? jobPostingLd(job, description.text) : null;

  const crumbs = [
    { name: "Home", path: "/" },
    role ? { name: `${role.label} jobs`, path: rolePath(role.id) } : { name: "Jobs", path: "/jobs" },
    { name: job.title, path },
  ];

  return (
    <main className="container max-w-4xl px-4 py-8 sm:py-12">
      <JsonLd data={[...(posting ? [posting] : []), breadcrumbs(crumbs)]} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Job at a licensed UK visa sponsor</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{job.title}</h1>
          <p className="mt-2 text-lg">
            <Link href={sponsorPath(job.sponsorId)} className="font-medium hover:underline">
              {job.sponsor}
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPinIcon width={14} height={14} />
              {job.location || "UK"}
            </span>
            {pay && <span>{pay}</span>}
            {job.department && <span>{job.department}</span>}
            {posted && <span>Posted {posted}</span>}
            <Badge tone={job.rating.startsWith("A") ? "success" : "warning"}>Verified sponsor ✓ · {job.rating || "?"}-rated</Badge>
          </div>
        </div>
        <JobActions job={job} />
      </header>

      <div className="mt-6 flex flex-wrap items-start gap-x-4 gap-y-2">
        <JobMatch job={job} />
        <JobTailorButton job={job} className="py-0.5 text-sm font-medium text-primary hover:underline" />
      </div>
      <div className="card mt-4 p-4">
        <JobVerdict job={job} rating={job.rating} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">About the role</h2>
        {description.text ? (
          <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{description.text}</div>
        ) : (
          <p className="mt-4 text-muted-foreground">The full description is on {job.sponsor}&apos;s job board.</p>
        )}
        {!description.full && (
          <p className="mt-4 text-sm text-muted-foreground">This is the start of the ad. Read the rest on {job.sponsor}&apos;s site.</p>
        )}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply on {job.sponsor}&apos;s site
        </a>
        <p className="mt-3 text-sm text-muted-foreground">
          A sponsor licence means {job.sponsor} can sponsor visas, not that every role is open to sponsorship. Check the ad, and ask
          before applying if it doesn&apos;t say.
        </p>
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl">More roles at {job.sponsor}</h2>
          <div className="mt-4 grid gap-4">
            {others.map((j) => (
              <JobCard key={j.url} job={j} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-sm">
        {role && (
          <>
            <Link href={rolePath(role.id)} className="font-medium text-primary hover:underline">
              More {role.label.toLowerCase()} jobs with visa sponsorship
            </Link>
            {" · "}
          </>
        )}
        <Link href={sponsorPath(job.sponsorId)} className="font-medium text-primary hover:underline">
          Does {job.sponsor} sponsor visas?
        </Link>
        {" · "}
        <Link href="/jobs" className="font-medium text-primary hover:underline">
          All jobs
        </Link>
      </p>
    </main>
  );
}
