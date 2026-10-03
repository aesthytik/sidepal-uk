"use client";

import { useState } from "react";
import { type Assessment, type Verdict, assess } from "@/lib/eligibility/assess";
import { SOURCE_URL } from "@/lib/eligibility/thresholds";
import type { Job } from "@/lib/sponsorTypes";
import { Badge } from "./ui/badge";

const LABEL: Record<Verdict, { text: string; tone: "success" | "warning" | "neutral" | "primary" }> = {
  likely: { text: "Likely sponsorable", tone: "success" },
  check: { text: "Check eligibility", tone: "warning" },
  unlikely: { text: "Unlikely", tone: "warning" },
  unknown: { text: "Unclear", tone: "neutral" },
};

interface AiCheck {
  summary: string;
  flags: string[];
}

/** A rule-based sponsorship verdict for one job, with the reasons and an optional AI second opinion. */
export function JobVerdict({ job, rating }: { job: Job; rating?: string }) {
  const result: Assessment = assess(job, rating);
  const { text, tone } = LABEL[result.verdict];
  const [ai, setAi] = useState<AiCheck | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function askAi() {
    setState("loading");
    try {
      const res = await fetch("/api/ai/job-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: job.url, title: job.title, location: job.location, snippet: job.snippet, salary: job.salary }),
      });
      if (!res.ok) throw new Error();
      setAi(await res.json());
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <details className="px-3 pb-2.5 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-muted-foreground hover:text-foreground">
        <Badge tone={tone}>{text}</Badge>
        <span className="underline underline-offset-2">Why?</span>
      </summary>
      <div className="mt-2 space-y-2 text-muted-foreground">
        <ul className="list-disc space-y-1 pl-4">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {ai ? (
          <div className="rounded-md bg-card p-2">
            <p className="font-medium text-foreground">AI: {ai.summary}</p>
            {ai.flags.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {ai.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={askAi}
            disabled={state === "loading"}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {state === "loading" ? "Asking AI…" : state === "error" ? "AI unavailable, retry" : "Get an AI second opinion"}
          </button>
        )}
        <p>
          A rough guide, not immigration advice.{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Check the rules on GOV.UK
          </a>
          .
        </p>
      </div>
    </details>
  );
}
