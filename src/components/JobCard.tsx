import Link from "next/link";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { postedAgo } from "@/lib/postedAgo";
import { Badge } from "./ui/badge";
import { JobActions } from "./JobActions";
import { JobMatch } from "./JobMatch";
import { JobTailorButton } from "./JobTailor";
import { JobVerdict } from "./JobVerdict";
import { MapPinIcon } from "./ui/icons";
import { sponsorPath } from "@/lib/seo";

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
            <Link href={sponsorPath(job.sponsorId)} className="font-medium hover:underline">
              {job.sponsor}
            </Link>
          </p>
        </div>
        <JobActions job={job} />
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
      <div className="mt-2 flex flex-wrap items-start gap-x-4 gap-y-2">
        <JobMatch job={job} />
        <JobTailorButton job={job} className="py-0.5 text-xs font-medium text-primary hover:underline" />
      </div>

      <div className="-mx-3 mt-2 border-t border-border pt-2">
        <JobVerdict job={job} rating={job.rating} />
      </div>
    </article>
  );
}
