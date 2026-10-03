"use client";

import { useEffect, useMemo, useState } from "react";
import type { Sector, Sponsor } from "./sponsorTypes";

interface Enrichment {
  website?: string;
  careerUrl?: string;
  sector?: Sector;
}

async function postJson<T>(url: string, body: unknown, signal: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

// Whether the server has an OpenAI key; learned from the first response
let classificationEnabled = true;

/**
 * Looks up missing websites, careers pages and sectors for the sponsors
 * currently on screen, and returns the list with results merged in.
 */
export function useEnrichment(sponsors: Sponsor[]) {
  const [updates, setUpdates] = useState<Record<string, Enrichment>>({});
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (sponsors.length === 0) return;
    const controller = new AbortController();
    const { signal } = controller;

    const merge = (field: keyof Enrichment, values: Record<string, string>) =>
      setUpdates((prev) => {
        const next = { ...prev };
        for (const [name, value] of Object.entries(values)) {
          next[name] = { ...next[name], [field]: value };
        }
        return next;
      });

    async function run() {
      setEnriching(true);
      try {
        // 1. Websites
        const websites: Record<string, string> = {};
        sponsors.forEach((s) => s.website && (websites[s.name] = s.website));
        const needWebsite = sponsors.filter((s) => !s.website);
        if (needWebsite.length > 0) {
          const data = await postJson<{ domains: Record<string, string> }>(
            "/api/enrich-domains",
            { sponsors: needWebsite.map(({ name, city }) => ({ name, city })) },
            signal
          );
          Object.assign(websites, data.domains);
          merge("website", data.domains);
        }

        // 2. Careers pages (needs a website) and sectors, in parallel
        const needCareers = sponsors.filter(
          (s) => !s.careerUrl && websites[s.name]
        );
        const needSector = sponsors.filter((s) => !s.sector);

        await Promise.all([
          needCareers.length > 0 &&
            postJson<{ careerUrls: Record<string, string> }>(
              "/api/find-career-urls",
              {
                sponsors: needCareers.map((s) => ({
                  name: s.name,
                  website: websites[s.name],
                })),
              },
              signal
            ).then((data) => merge("careerUrl", data.careerUrls)),
          classificationEnabled &&
            needSector.length > 0 &&
            postJson<{ enabled: boolean; sectors: Record<string, string> }>(
              "/api/classify-sectors",
              { sponsors: needSector.map((s) => ({ name: s.name })) },
              signal
            ).then((data) => {
              classificationEnabled = data.enabled;
              merge("sector", data.sectors);
            }),
        ]);
      } catch (error) {
        if (!signal.aborted) console.error("Enrichment failed:", error);
      } finally {
        if (!signal.aborted) setEnriching(false);
      }
    }

    run();
    return () => controller.abort();
  }, [sponsors]);

  const enriched = useMemo(
    () =>
      sponsors.map((s) => {
        const u = updates[s.name];
        return u ? { ...s, ...u } : s;
      }),
    [sponsors, updates]
  );

  return { sponsors: enriched, enriching };
}
