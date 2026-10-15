"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Horus } from "@/components/game/Horus";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { XIcon } from "@/components/ui/icons";
import { THRESHOLDS } from "@/lib/eligibility/thresholds";
import { PLACES, PLACE_BY_ID } from "@/lib/geo/places";
import { extractProfile } from "@/lib/profile/extract";
import { CV_ACCEPT, readCv } from "@/lib/profile/readCv";
import { SKILLS, canonicalSkill } from "@/lib/profile/skills";
import {
  EMPTY_PROFILE,
  type Profile,
  VISA_STATUSES,
  VISA_STATUS_LABELS,
  type VisaStatus,
  hasMatchable,
  isNewEntrant,
} from "@/lib/profile/types";
import { ROLE_FAMILIES } from "@/lib/sectors/taxonomy";
import { cn } from "@/lib/utils";
import { useProfile, useProfileHydrated } from "@/store/useProfile";

const PLACES_BY_NAME = [...PLACES].sort((a, b) => a.name.localeCompare(b.name));
const INPUT = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`;

/** Adds what a CV reading found without throwing away what the user already chose. */
function merge(current: Profile, found: Profile, prefer: "current" | "found"): Partial<Profile> {
  const pick = <T,>(a: T | undefined, b: T | undefined) => (prefer === "found" ? (b ?? a) : (a ?? b));
  return {
    headline: pick(current.headline, found.headline),
    skills: [...new Set([...current.skills, ...found.skills])],
    roles: current.roles.length && prefer === "current" ? current.roles : [...new Set([...found.roles, ...current.roles])].slice(0, 5),
    places: [...new Set([...current.places, ...found.places])],
    yearsExperience: pick(current.yearsExperience, found.yearsExperience),
    visaStatus: current.visaStatus !== "unknown" && prefer === "current" ? current.visaStatus : found.visaStatus !== "unknown" ? found.visaStatus : current.visaStatus,
  };
}

/** How filled-in the profile is, for the strength meter. */
function strength(p: Profile): { percent: number; next?: string } {
  const steps: [boolean, string][] = [
    [p.skills.length >= 3, "Add at least 3 skills"],
    [p.roles.length > 0, "Pick the kinds of role you want"],
    [p.visaStatus !== "unknown", "Tell us your visa situation"],
    [p.places.length > 0 || p.remoteOk, "Choose where you'd work"],
    [Boolean(p.headline), "Add a headline"],
    [p.minSalary !== undefined, "Set your salary floor"],
  ];
  const done = steps.filter(([ok]) => ok).length;
  return { percent: Math.round((100 * done) / steps.length), next: steps.find(([ok]) => !ok)?.[1] };
}

export function ProfileEditor() {
  const hydrated = useProfileHydrated();
  const stored = useProfile((s) => s.profile);
  const savedCv = useProfile((s) => s.cvText);
  const { update, setCvText, clear } = useProfile.getState();
  const profile = stored ?? EMPTY_PROFILE;

  const [cv, setCv] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [busy, setBusy] = useState<"reading" | "ai" | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cvText = cv ?? savedCv ?? "";
  const keepCv = savedCv !== undefined;

  function applyText(text: string, source: string) {
    const found = extractProfile(text);
    update(merge(profile, found, "current"));
    setCv(text);
    if (keepCv) setCvText(text);
    const bits = [
      `${found.skills.length} skill${found.skills.length === 1 ? "" : "s"}`,
      found.roles.length && `${found.roles.length} role type${found.roles.length === 1 ? "" : "s"}`,
      found.yearsExperience !== undefined && `${found.yearsExperience} years' experience`,
      found.places.length && `${found.places.length} place${found.places.length === 1 ? "" : "s"}`,
    ].filter(Boolean);
    setMessage({ text: `Read ${source}: found ${bits.join(", ")}. Check and edit below.` });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy("reading");
    setMessage(null);
    try {
      applyText(await readCv(file), file.name);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Couldn't read that file. Try pasting the text instead.", error: true });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function improveWithAi() {
    setBusy("ai");
    setMessage(null);
    try {
      const res = await fetch("/api/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cvText }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many tries. Wait a minute and try again." : "AI isn't available right now.");
      update(merge(profile, (await res.json()) as Profile, "found"));
      setMessage({ text: "AI read your CV and updated your profile. Check it below." });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "AI isn't available right now.", error: true });
    } finally {
      setBusy(null);
    }
  }

  function addSkill(raw: string) {
    const skill = canonicalSkill(raw);
    if (skill && !profile.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) update({ skills: [...profile.skills, skill] });
    setSkillInput("");
  }

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const { percent, next } = strength(profile);
  const floor = isNewEntrant(profile) ? THRESHOLDS.newEntrant : THRESHOLDS.general;

  if (!hydrated) {
    return (
      <main className="container max-w-3xl px-4 py-6 sm:py-10" aria-busy="true">
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </main>
    );
  }

  return (
    <main className="container max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start gap-4">
        <Horus size={64} mood={percent === 100 ? "party" : percent >= 50 ? "delighted" : "curious"} className="hidden shrink-0 sm:block" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl sm:text-4xl">My profile</h1>
          <p className="mt-1 text-muted-foreground">
            Tell Horus what you do and it&apos;ll score every job for you and check sponsorship against the right salary rules.
            Everything stays in this browser.
          </p>
        </div>
      </header>

      {/* Strength meter */}
      <div className="card mb-6 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">Profile strength</span>
          <span className="tabular-nums text-muted-foreground">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{next ? `Next: ${next}.` : "All set. Horus knows you well."}</span>
          {hasMatchable(profile) && (
            <Link href="/jobs?sort=match" className="font-medium text-primary hover:underline">
              See my best matches →
            </Link>
          )}
        </div>
      </div>

      {/* CV import */}
      <section className="card mb-6 p-5" aria-labelledby="cv-heading">
        <h2 id="cv-heading" className="font-display text-xl">
          Start from your CV
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, Word (.docx) or text. It&apos;s read on your device and never uploaded.
        </p>
        <div
          className={cn(
            "mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm transition-colors",
            busy === "reading" && "opacity-60"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
        >
          <p className="text-muted-foreground">{busy === "reading" ? "Reading your CV…" : "Drop your CV here, or"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
              Choose a file
            </Button>
            <Button variant="ghost" onClick={() => setPasting((p) => !p)} disabled={busy !== null}>
              {pasting ? "Hide paste box" : "Paste text instead"}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept={CV_ACCEPT} className="sr-only" aria-label="CV file" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>

        {pasting && (
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = new FormData(e.currentTarget).get("cv");
              if (typeof text === "string" && text.trim()) applyText(text, "your text");
            }}
          >
            <textarea name="cv" rows={8} aria-label="CV text" placeholder="Paste your CV here" defaultValue={cv ?? ""} className="w-full rounded-md border border-input bg-card p-3 text-sm" />
            <Button type="submit" size="sm">
              Read it
            </Button>
          </form>
        )}

        {message && (
          <p role="status" className={cn("mt-3 text-sm", message.error ? "text-destructive" : "text-foreground")}>
            {message.text}
          </p>
        )}

        {cvText && (
          <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={keepCv}
                onChange={(e) => setCvText(e.target.checked ? cvText : undefined)}
              />
              <span>
                Keep my CV text on this device <span className="text-muted-foreground">(so you don&apos;t need to upload it again)</span>
              </span>
            </label>
            <div className="rounded-md bg-muted/60 p-3">
              <Button size="sm" variant="subtle" onClick={improveWithAi} disabled={busy !== null}>
                {busy === "ai" ? "Reading with AI…" : "✨ Improve with AI"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Optional. Sends your CV text (first 6,000 characters) to an AI model through OpenRouter to pick out skills more accurately.
                We don&apos;t store it. Remove personal details first if you prefer.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Editor */}
      <section className="card space-y-6 p-5" aria-labelledby="about-heading">
        <h2 id="about-heading" className="font-display text-xl">
          About you
        </h2>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Headline</span>
          <input
            className={INPUT}
            value={profile.headline ?? ""}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="e.g. Backend engineer, Registered nurse"
            maxLength={120}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Roles you want</legend>
          <div className="flex flex-wrap gap-2">
            {ROLE_FAMILIES.map((r) => (
              <Chip key={r.id} selected={profile.roles.includes(r.id)} onClick={() => update({ roles: toggle(profile.roles, r.id) })}>
                {r.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Skills <span className="font-normal text-muted-foreground">({profile.skills.length})</span>
          </legend>
          {profile.skills.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <li key={s}>
                  <span className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card pl-3 pr-1 text-sm">
                    {s}
                    <button
                      type="button"
                      aria-label={`Remove ${s}`}
                      onClick={() => update({ skills: profile.skills.filter((x) => x !== s) })}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <XIcon width={12} height={12} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (skillInput.trim()) addSkill(skillInput);
            }}
          >
            <input
              className={INPUT}
              list="skill-options"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill, e.g. Python, NMC registration, AutoCAD"
              aria-label="Add a skill"
              maxLength={40}
            />
            <datalist id="skill-options">
              {SKILLS.map((s) => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
            <Button type="submit" variant="outline" disabled={!skillInput.trim()}>
              Add
            </Button>
          </form>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Where you&apos;d work</legend>
          <div className="flex flex-wrap gap-2">
            {profile.places.map((id) => (
              <Chip key={id} selected onClick={() => update({ places: profile.places.filter((p) => p !== id) })} aria-label={`Remove ${PLACE_BY_ID.get(id)?.name ?? id}`}>
                {PLACE_BY_ID.get(id)?.name ?? id} <XIcon width={12} height={12} />
              </Chip>
            ))}
            <Chip selected={profile.remoteOk} onClick={() => update({ remoteOk: !profile.remoteOk })}>
              Open to remote
            </Chip>
          </div>
          <select
            className={cn(INPUT, "sm:w-64")}
            value=""
            aria-label="Add a town or city"
            onChange={(e) => e.target.value && update({ places: [...profile.places, e.target.value] })}
          >
            <option value="">+ Add a town or city</option>
            {PLACES_BY_NAME.filter((p) => !profile.places.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Years of experience</span>
            <input
              className={INPUT}
              type="number"
              min={0}
              max={50}
              inputMode="numeric"
              value={profile.yearsExperience ?? ""}
              onChange={(e) => update({ yearsExperience: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Lowest salary you&apos;d accept (£ a year)</span>
            <input
              className={INPUT}
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder={floor.toLocaleString("en-GB")}
              value={profile.minSalary ?? ""}
              onChange={(e) => update({ minSalary: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Your visa situation</legend>
          <div className="grid gap-1.5">
            {VISA_STATUSES.map((v: VisaStatus) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input type="radio" name="visa-status" checked={profile.visaStatus === v} onChange={() => update({ visaStatus: v })} />
                {VISA_STATUS_LABELS[v]}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Jobs are checked against the {isNewEntrant(profile) ? "new-entrant" : "general"} Skilled Worker minimum of {fmt(floor)}
            {isNewEntrant(profile) ? "" : ` (new entrants: ${fmt(THRESHOLDS.newEntrant)})`}, or the job&apos;s going rate if higher.{" "}
            <Link href="/visa-salary-checker" className="font-medium text-primary hover:underline">
              Check a job&apos;s going rate →
            </Link>
          </p>
        </fieldset>
      </section>

      {/* Privacy */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          🔒 Saved only in this browser. Ranking jobs sends your skills, roles and places to Horus, never your CV.
        </p>
        {(stored || savedCv) && (
          <Button
            variant={confirmDelete ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 4000);
                return;
              }
              clear();
              setCv(null);
              setMessage(null);
              setConfirmDelete(false);
            }}
          >
            {confirmDelete ? "Tap again to delete" : "Delete my data"}
          </Button>
        )}
      </section>
    </main>
  );
}
