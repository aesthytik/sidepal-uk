"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IndexedJob } from "@/lib/jobs/indexer";
import { keywordGap } from "@/lib/match/gap";
import { isNewEntrant } from "@/lib/profile/types";
import { emit } from "@/store/useGame";
import { useProfile } from "@/store/useProfile";
import { Button } from "./ui/button";
import { Drawer } from "./ui/drawer";

type JobRef = Pick<IndexedJob, "title" | "url" | "sponsor"> & Partial<Pick<IndexedJob, "snippet">>;

interface Tailored {
  fit: string;
  missing: string[];
  bullets: string[];
  coverLetter: string;
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border pb-6 last:border-0">
      <h3 className="flex items-center gap-2 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs tabular-nums">{step}</span>
        {title}
      </h3>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-xs font-medium text-primary hover:underline"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** The tailoring panel for one job: full ad, instant keyword check, and opt-in AI rewrites. */
function TailorPanel({ job }: { job: JobRef }) {
  const profile = useProfile((s) => s.profile);
  const savedCv = useProfile((s) => s.cvText);
  const setCvText = useProfile((s) => s.setCvText);

  const [ad, setAd] = useState<{ text: string; full: boolean } | null>(null);
  const [adState, setAdState] = useState<"loading" | "ready" | "error">("loading");
  const [pastedAd, setPastedAd] = useState<string | null>(null);
  const [cv, setCv] = useState(savedCv ?? "");
  const [keepCv, setKeepCv] = useState(savedCv !== undefined);
  const [ai, setAi] = useState<Tailored | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [letter, setLetter] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/jobs/description?url=${encodeURIComponent(job.url)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { text: string; full: boolean }) => {
        setAd(data);
        setAdState("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setAd(job.snippet ? { text: job.snippet, full: false } : null);
        setAdState("error");
      });
    return () => controller.abort();
  }, [job.url, job.snippet]);

  const description = pastedAd?.trim() || ad?.text || "";
  const gap = useMemo(() => (profile && description ? keywordGap(description, profile.skills, cv) : null), [profile, description, cv]);

  async function tailor() {
    setAiState("loading");
    setAiError("");
    if (keepCv) setCvText(cv);
    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: job.title, company: job.sponsor, description, cv, newEntrant: profile ? isNewEntrant(profile) : false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 429 ? "Too many tries. Wait a minute and try again." : (data.error ?? "AI isn't available right now."));
      setAi(data);
      setLetter(data.coverLetter ?? "");
      setAiState("idle");
      emit({ type: "tailor", id: job.url });
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI isn't available right now.");
      setAiState("error");
    }
  }

  const tooShort = description.length < 100 || cv.trim().length < 100;

  return (
    <div className="space-y-6">
      <Section step={1} title="The job ad">
        {adState === "loading" ? (
          <p className="animate-pulse text-muted-foreground">Fetching the full job description…</p>
        ) : ad?.full && !pastedAd ? (
          <details>
            <summary className="cursor-pointer text-muted-foreground">
              Got the full ad ({Math.round(ad.text.length / 100) / 10}k characters). <span className="underline">Show it</span>
            </summary>
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line rounded-md bg-muted/50 p-3 text-xs">{ad.text}</p>
          </details>
        ) : (
          <p className="text-muted-foreground">
            We could only read the start of this ad. Paste the full description for a better result (open the{" "}
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="underline">
              job ad
            </a>
            , select all, copy).
          </p>
        )}
        {(!ad?.full || pastedAd !== null) && adState !== "loading" && (
          <textarea
            rows={5}
            value={pastedAd ?? ""}
            onChange={(e) => setPastedAd(e.target.value)}
            placeholder="Paste the full job description here"
            aria-label="Job description"
            className="w-full rounded-md border border-input bg-card p-3 text-sm"
          />
        )}
      </Section>

      <Section step={2} title="Keyword check">
        {!profile ? (
          <p className="text-muted-foreground">
            <Link href="/profile" className="font-medium text-primary hover:underline">
              Add your skills or CV
            </Link>{" "}
            to see which of this job&apos;s keywords you already cover.
          </p>
        ) : gap && gap.have.length + gap.missing.length > 0 ? (
          <>
            {gap.have.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">You have ({gap.have.length})</p>
                <ul className="flex flex-wrap gap-1.5">
                  {gap.have.map((s) => (
                    <li key={s} className="rounded-md bg-sage/10 px-2 py-0.5 text-sage">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {gap.missing.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Not in your profile ({gap.missing.length})</p>
                <ul className="flex flex-wrap gap-1.5">
                  {gap.missing.map((s) => (
                    <li key={s} className="rounded-md bg-clay/10 px-2 py-0.5 text-clay">
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">If you genuinely have any of these, make sure your CV says so in the ad&apos;s words.</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No skills we recognise in this ad yet{pastedAd === null && !ad?.full ? ". Paste the full ad above." : "."}</p>
        )}
      </Section>

      <Section step={3} title="Tailor with AI">
        {!savedCv && (
          <>
            <textarea
              rows={5}
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder="Paste your CV text"
              aria-label="Your CV"
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={keepCv} onChange={(e) => setKeepCv(e.target.checked)} />
              Keep my CV text on this device for next time
            </label>
          </>
        )}
        {savedCv && <p className="text-muted-foreground">Using the CV saved on this device.</p>}
        <Button onClick={tailor} disabled={tooShort || aiState === "loading"}>
          {aiState === "loading" ? "Tailoring… (about 20 seconds)" : ai ? "✨ Try again" : "✨ Tailor my CV and write a cover letter"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sends the job ad and your CV text to an AI model through OpenRouter for this request only. Nothing is stored. Always check the result:
          AI can get things wrong.
        </p>
        {aiState === "error" && <p className="text-destructive">{aiError}</p>}

        {ai && (
          <div className="space-y-5 pt-2">
            {ai.fit && <p className="rounded-md bg-muted/60 p-3 text-foreground">{ai.fit}</p>}
            {ai.missing.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Gaps the ad cares about</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {ai.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {ai.bullets.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CV bullets for this job</p>
                  <CopyButton text={ai.bullets.map((b) => `• ${b}`).join("\n")} label="Copy all" />
                </div>
                <ul className="space-y-2">
                  {ai.bullets.map((b) => (
                    <li key={b} className="flex items-start justify-between gap-3 rounded-md border border-border p-2.5">
                      <span>{b}</span>
                      <CopyButton text={b} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {letter && (
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover letter (edit freely)</p>
                  <span className="flex gap-3">
                    <CopyButton text={letter} />
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => download(`cover-letter-${job.sponsor.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`, letter)}
                    >
                      Download
                    </button>
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  aria-label="Cover letter"
                  className="w-full rounded-md border border-input bg-card p-3 text-sm leading-relaxed"
                />
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

/** "Tailor" button that opens the panel for one job. */
export function JobTailorButton({ job, className }: { job: JobRef; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? "text-xs font-medium text-primary hover:underline"}>
        ✨ Tailor my application
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={job.title} subtitle={`${job.sponsor} · tailor your application`}>
        {open && <TailorPanel job={job} />}
      </Drawer>
    </>
  );
}
