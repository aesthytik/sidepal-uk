"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Enrichment } from "./sponsorTypes";

const CHUNK = 10;

// Shared across pages and components so a sponsor is only enriched once per visit
const results = new Map<string, Enrichment>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((l) => l());
}

const keyOf = (id: string, role?: string) => `${id}|${role ?? ""}`;

async function requestChunk(ids: string[], role?: string) {
  ids.forEach((id) => pending.add(keyOf(id, role)));
  notify();
  try {
    const res = await fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, role }),
    });
    const data: Record<string, Enrichment> = res.ok ? await res.json() : {};
    ids.forEach((id) => results.set(keyOf(id, role), data[id] ?? {}));
  } catch {
    ids.forEach((id) => results.set(keyOf(id, role), {}));
  } finally {
    ids.forEach((id) => pending.delete(keyOf(id, role)));
    notify();
  }
}

/**
 * Looks up websites, careers pages and open roles for the given sponsors,
 * in small batches so the first cards fill in quickly.
 */
export function useEnrichment(ids: string[], role?: string) {
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => version,
    () => 0
  );

  const key = ids.join(",");
  useEffect(() => {
    const missing = key.split(",").filter((id) => id && !results.has(keyOf(id, role)) && !pending.has(keyOf(id, role)));
    for (let i = 0; i < missing.length; i += CHUNK) requestChunk(missing.slice(i, i + CHUNK), role);
  }, [key, role]);

  return {
    get: (id: string) => results.get(keyOf(id, role)),
    isPending: (id: string) => !results.has(keyOf(id, role)),
  };
}
