"use client";

import { useState } from "react";
import type { Enrichment, Sponsor } from "@/lib/sponsorTypes";
import { cn } from "@/lib/utils";
import { STATUSES, STATUS_LABELS, type Status, useShortlist } from "@/store/useShortlist";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  BookmarkIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MapPinIcon,
  SearchIcon,
} from "./ui/icons";

const MAX_VISA_BADGES = 2;

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function googleJobsUrl(sponsor: Sponsor) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${sponsor.name} ${sponsor.city} jobs`)}`;
}

function SaveControl({ id }: { id: string }) {
  const item = useShortlist((s) => s.items[id]);
  const toggle = useShortlist((s) => s.toggle);
  const update = useShortlist((s) => s.update);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {item && (
        <select
          aria-label="Application status"
          value={item.status}
          onChange={(e) => update(id, { status: e.target.value as Status })}
          className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      )}
      <Button
        variant={item ? "subtle" : "outline"}
        size="sm"
        onClick={() => toggle(id)}
        aria-pressed={Boolean(item)}
        aria-label={item ? "Remove from shortlist" : "Save to shortlist"}
      >
        <BookmarkIcon filled={Boolean(item)} />
        <span className="hidden sm:inline">{item ? "Saved" : "Save"}</span>
      </Button>
    </div>
  );
}

function JobsPanel({ jobs, careersUrl }: { jobs: NonNullable<Enrichment["jobs"]>; careersUrl?: string }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/40">
      <ul className="divide-y divide-border">
        {jobs.top.map((job) => (
          <li key={job.url}>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{job.title}</span>
                {job.location && <span className="block truncate text-xs text-muted-foreground">{job.location}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {job.uk && <Badge tone="success">UK</Badge>}
                <ExternalLinkIcon className="text-muted-foreground" />
              </span>
            </a>
          </li>
        ))}
      </ul>
      {careersUrl && jobs.total > jobs.top.length && (
        <a
          href={careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-t border-border px-3 py-2 text-sm font-medium text-primary hover:underline"
        >
          See all {jobs.total} roles →
        </a>
      )}
    </div>
  );
}

export function CompanyCard({
  sponsor,
  enrichment,
  pending,
  children,
}: {
  sponsor: Sponsor;
  enrichment?: Enrichment;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  const [showJobs, setShowJobs] = useState(false);
  const { website, careersUrl, jobs } = enrichment ?? {};
  const extraVisas = sponsor.visaTypes.length - MAX_VISA_BADGES;

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-snug">{sponsor.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon /> {sponsor.location}
            </span>
            {sponsor.rating && (
              <Badge
                tone={sponsor.rating.startsWith("A") ? "success" : "warning"}
                title={
                  sponsor.rating.startsWith("A")
                    ? "A-rated: fully trusted to sponsor"
                    : "B-rated: on an action plan with the Home Office"
                }
              >
                {sponsor.rating}-rated
              </Badge>
            )}
            {sponsor.visaTypes.slice(0, MAX_VISA_BADGES).map((v) => (
              <Badge key={v} tone="primary">
                {v}
              </Badge>
            ))}
            {extraVisas > 0 && <Badge title={sponsor.visaTypes.slice(MAX_VISA_BADGES).join(", ")}>+{extraVisas}</Badge>}
          </div>
        </div>
        <SaveControl id={sponsor.id} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {pending ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Looking for website and open roles…
          </span>
        ) : (
          <>
            {jobs && jobs.total > 0 && (
              <Button size="sm" onClick={() => setShowJobs((s) => !s)} aria-expanded={showJobs}>
                <BriefcaseIcon />
                {jobs.total} open role{jobs.total === 1 ? "" : "s"}
                {jobs.uk > 0 && jobs.uk < jobs.total && ` · ${jobs.uk} in UK`}
                <ChevronDownIcon className={cn("transition-transform", showJobs && "rotate-180")} />
              </Button>
            )}
            {careersUrl && (
              <Button asChild size="sm" variant={jobs?.total ? "outline" : "default"}>
                <a href={careersUrl} target="_blank" rel="noopener noreferrer">
                  <BriefcaseIcon /> Careers page
                </a>
              </Button>
            )}
            {website && (
              <Button asChild size="sm" variant="ghost">
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <GlobeIcon /> {hostname(website)}
                </a>
              </Button>
            )}
            {!careersUrl && (
              <Button asChild size="sm" variant="ghost">
                <a href={googleJobsUrl(sponsor)} target="_blank" rel="noopener noreferrer">
                  <SearchIcon /> Search jobs on Google
                </a>
              </Button>
            )}
          </>
        )}
      </div>

      {showJobs && jobs && <JobsPanel jobs={jobs} careersUrl={careersUrl} />}
      {children}
    </article>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="card animate-pulse p-5" aria-hidden="true">
      <div className="h-5 w-2/3 rounded bg-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-4 w-28 rounded bg-muted" />
      </div>
      <div className="mt-5 h-8 w-1/2 rounded bg-muted" />
    </div>
  );
}
