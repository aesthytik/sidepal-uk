"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toSearchParams } from "@/lib/searchParams";
import { Button } from "./ui/button";

/** Plain-English search: the API turns the sentence into filters, then we open /sponsors with them. */
export function AskAi({ className }: { className?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setNotice("");
    let filters: Record<string, string> = { q: text.trim() };
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data?.filters) filters = data.filters;
      if (!data?.ai) setNotice("AI is unavailable, searching by company name instead.");
    } catch {
      setNotice("AI is unavailable, searching by company name instead.");
    }
    router.push(`/sponsors?${toSearchParams(filters)}`);
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          aria-label="Describe the sponsor you want"
          placeholder="e.g. A-rated skilled worker sponsors in Manchester"
          className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-base outline-none"
        />
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Thinking…" : "Ask AI"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        AI-assisted. Your sentence is sent to a third-party model (OpenRouter) to pick filters.
      </p>
      {notice && <p role="status" className="mt-1 text-xs text-muted-foreground">{notice}</p>}
    </form>
  );
}
