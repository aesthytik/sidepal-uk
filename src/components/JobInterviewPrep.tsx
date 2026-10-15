"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { IndexedJob } from "@/lib/jobs/indexer";
import {
  formatInterviewPrep,
  interviewProfile,
  MAX_INTERVIEW_AD,
  MAX_INTERVIEW_CV,
  readInterviewPrepInput,
  STAR_HINTS,
  STAR_STEPS,
  type InterviewPrep,
} from "@/lib/ai/interviewPrep";
import { VISA_STATUS_LABELS } from "@/lib/profile/types";
import { useProfile } from "@/store/useProfile";
import { Button } from "./ui/button";
import { Drawer } from "./ui/drawer";

type JobRef = Pick<IndexedJob, "title" | "url" | "sponsor"> & Partial<Pick<IndexedJob, "snippet">>;

function PrepResult({ job, prep }: { job: JobRef; prep: InterviewPrep }) {
  const [copyState, setCopyState] = useState<{ prep: InterviewPrep; status: "done" | "error" } | null>(null);
  const text = formatInterviewPrep({ title: job.title, company: job.sponsor }, prep);
  const copyStatus = copyState?.prep === prep ? copyState.status : "idle";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({ prep, status: "done" });
    } catch {
      setCopyState({ prep, status: "error" });
    }
  }

  return (
    <section aria-label="Your interview prep" className="space-y-6 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Your interview prep</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy}>{copyStatus === "done" ? "Copied ✓" : "Copy all"}</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </div>
      {copyStatus === "error" && <p role="status" className="text-sm text-muted-foreground">Couldn&apos;t copy. Select the text below to copy it, or use Print.</p>}
      <p className="text-sm text-muted-foreground">These are practice questions, not a prediction. Check each outline against your actual experience and fill in the gaps before practising.</p>
      {prep.themes.map(({ theme, questions }, i) => (
        <section key={i} className="space-y-3">
          <h4 className="font-semibold">{theme}</h4>
          {questions.map((q, j) => (
            <article key={j} className="space-y-3 rounded-md border border-border p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{q.type}</p>
              <h5 className="font-semibold">{q.question}</h5>
              <p className="text-xs text-muted-foreground">CV evidence: {q.evidence ?? "No supporting example supplied."}</p>
              <dl className="space-y-2">
                {STAR_STEPS.map((step) => (
                  <div key={step}>
                    <dt className="font-medium capitalize">{step}</dt>
                    <dd className={`whitespace-pre-line ${q.star[step] ? "" : "text-muted-foreground"}`}>{q.star[step] ?? STAR_HINTS[step]}</dd>
                  </div>
                ))}
              </dl>
              {q.gaps.length > 0 && (
                <div className="rounded-md bg-clay/10 p-3">
                  <p className="font-medium text-clay">Gaps to fill honestly</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {q.gaps.map((gap, k) => <li key={k}>{gap}</li>)}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
      <section className="space-y-3 text-sm">
        <h4 className="font-semibold">Questions to ask the employer</h4>
        <ul className="list-disc space-y-2 pl-5">
          {prep.employerQuestions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </section>
      <section className="space-y-3 text-sm">
        <h4 className="font-semibold">Do you require visa sponsorship?</h4>
        <p className="rounded-md bg-muted/60 p-3">{prep.sponsorshipScript}</p>
        <p className="text-xs text-muted-foreground">A sponsor licence does not guarantee sponsorship for this role. Confirm the details with the employer.</p>
      </section>
      {createPortal(<div className="interview-prep-print hidden"><pre>{text}</pre></div>, document.body)}
    </section>
  );
}

/** Opening fetches only the ad; profile/CV leave the browser only on the AI button click. */
function InterviewPrepPanel({ job }: { job: JobRef }) {
  const profile = useProfile((s) => s.profile);
  const savedCv = useProfile((s) => s.cvText);
  const setCvText = useProfile((s) => s.setCvText);
  const [ad, setAd] = useState<{ text: string; full: boolean } | null>(null);
  const [adLoading, setAdLoading] = useState(true);
  const [pastedAd, setPastedAd] = useState<string | null>(null);
  const [cv, setCv] = useState(savedCv ?? "");
  const [keepCv, setKeepCv] = useState(savedCv !== undefined);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/jobs/description?url=${encodeURIComponent(job.url)}`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(String(res.status))))
      .then((data: { text: string; full: boolean }) => setAd(data))
      .catch(() => {
        if (!controller.signal.aborted) setAd(job.snippet ? { text: job.snippet, full: false } : null);
      })
      .finally(() => { if (!controller.signal.aborted) setAdLoading(false); });
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, [job.url, job.snippet]);

  const input = readInterviewPrepInput({
    title: job.title,
    company: job.sponsor,
    description: pastedAd?.trim() || ad?.text || "",
    cv,
    profile,
  });
  const summary = interviewProfile(profile);

  async function prepare() {
    if (!input || loading) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    setCvText(keepCv && cv.trim() ? cv : undefined);
    try {
      const res = await fetch("/api/ai/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 429 ? "Too many tries. Wait a minute and try again." : (data.error ?? "AI isn't available right now."));
      setPrep(data);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "AI isn't available right now.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 border-b border-border pb-6 text-sm">
        <h3 className="font-semibold">The job ad</h3>
        {adLoading ? (
          <p className="animate-pulse text-muted-foreground">Fetching the full job description…</p>
        ) : ad?.full && pastedAd === null ? (
          <>
            <details>
              <summary className="cursor-pointer text-muted-foreground">Got the full ad. <span className="underline">Show it</span></summary>
              <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line rounded-md bg-muted/50 p-3 text-xs">{ad.text}</p>
            </details>
            <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setPastedAd(ad.text.slice(0, MAX_INTERVIEW_AD))}>Edit job description</button>
          </>
        ) : (
          <p className="text-muted-foreground">Paste the full description for better prep. You can copy it from the <a href={job.url} target="_blank" rel="noopener noreferrer" className="underline">job ad</a>.</p>
        )}
        {!adLoading && (!ad?.full || pastedAd !== null) && (
          <textarea
            rows={5}
            maxLength={MAX_INTERVIEW_AD}
            value={pastedAd ?? ""}
            onChange={(e) => setPastedAd(e.target.value)}
            aria-label="Job description"
            placeholder="Paste the full job description here"
            className="w-full rounded-md border border-input bg-card p-3 text-sm"
          />
        )}
      </section>

      <section className="space-y-3 border-b border-border pb-6 text-sm">
        <h3 className="font-semibold">Your experience</h3>
        {profile ? (
          <div className="space-y-1 text-muted-foreground">
            {summary.headline && <p>{summary.headline}</p>}
            {summary.skills.length > 0 && <p>Skills: {summary.skills.join(", ")}</p>}
            {summary.roles.length > 0 && <p>Roles: {summary.roles.join(", ")}</p>}
            {summary.yearsExperience !== undefined && <p>Years of experience: {summary.yearsExperience}</p>}
          </div>
        ) : (
          <p className="text-muted-foreground"><Link href="/profile" className="font-medium text-primary hover:underline">Add your profile</Link> or paste your experience below.</p>
        )}
        <p className="text-muted-foreground">Visa situation: {VISA_STATUS_LABELS[summary.visaStatus]}. <Link href="/profile" className="font-medium text-primary hover:underline">Update profile</Link></p>
        <p className="text-muted-foreground">Add real examples of what you did and the outcomes. A skills list alone leaves gaps in a STAR answer.</p>
        <textarea
          rows={6}
          maxLength={MAX_INTERVIEW_CV}
          value={cv}
          onChange={(e) => setCv(e.target.value)}
          aria-label="Your CV or experience summary"
          placeholder="Paste your CV or an experience summary (optional if you have a profile)"
          className="w-full rounded-md border border-input bg-card p-3 text-sm"
        />
        {savedCv !== undefined && <p className="text-xs text-muted-foreground">Loaded your CV text saved on this device. You can edit it before sending.</p>}
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={keepCv} onChange={(e) => setKeepCv(e.target.checked)} />
          Keep this CV or summary on this device for next time
        </label>
      </section>

      <section className="space-y-3 text-sm" aria-busy={loading}>
        <h3 className="font-semibold">Prep with AI</h3>
        <p className="text-xs text-muted-foreground">Only when you click below, the job ad, profile summary (including visa situation) and CV text above are sent to an AI model through OpenRouter for this request. Horus does not store the request or result on the server. Always check the result: AI can get things wrong.</p>
        <p className="text-xs text-muted-foreground">Uses the first {MAX_INTERVIEW_AD.toLocaleString("en-GB")} characters of the ad and {MAX_INTERVIEW_CV.toLocaleString("en-GB")} of your CV/summary. Put your most relevant examples first.</p>
        <Button onClick={prepare} disabled={!input || loading || adLoading}>
          {loading ? "Preparing… (about 30 seconds)" : prep ? "✨ Try again" : "✨ Generate interview prep"}
        </Button>
        {!input && !adLoading && <p className="text-xs text-muted-foreground">Add a job description of at least 100 characters and a profile or CV/experience summary of at least 100 characters.</p>}
        {loading && <p role="status" className="text-muted-foreground">Preparing questions and checking your experience…</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </section>
      {prep && <PrepResult job={job} prep={prep} />}
    </div>
  );
}

/** The opt-in interview prep action, alongside Tailor on each job. */
export function JobInterviewPrepButton({ job, className }: { job: JobRef; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? "text-xs font-medium text-primary hover:underline"}>
        ✨ Prep for interview
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={job.title} subtitle={`${job.sponsor} · prep for interview`}>
        {open && <InterviewPrepPanel job={job} />}
      </Drawer>
    </>
  );
}
