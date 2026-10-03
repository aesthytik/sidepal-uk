import Link from "next/link";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { postedAgo } from "@/lib/postedAgo";
import { Badge } from "./ui/badge";
import { JobVerdict } from "./JobVerdict";
import { ExternalLinkIcon, MapPinIcon } from "./ui/icons";

export function JobCard({ job }: { job: IndexedJob }) {
  const posted = postedAgo(job.postedAt);
  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-snug">
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {job.title}
            </a>
          </h2>
          <p className="mt-1 text-sm">
            <Link href={`/sponsors?q=${encodeURIComponent(job.sponsor)}`} className="font-medium hover:underline">
              {job.sponsor}
            </Link>
          </p>
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply <ExternalLinkIcon />
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPinIcon width={14} height={14} />
          {job.location || "UK"}
        </span>
        {job.department && <span>{job.department}</span>}
        {posted && <span>Posted {posted}</span>}
        <Badge tone={job.rating.startsWith("A") ? "success" : "warning"}>Verified sponsor ✓ · {job.rating || "?"}-rated</Badge>
      </div>

      <div className="-mx-3 mt-2 border-t border-border pt-2">
        <JobVerdict job={job} rating={job.rating} />
      </div>
    </article>
  );
}
