import { type AtsBoard, detectAts, fetchJobDescription } from "../enrichment/ats";
import { supabaseAdmin } from "../supabase/client";
import type { IndexedJob } from "./indexer";

const CACHE_MS = 60 * 60_000;
const cache = new Map<string, { text: string; full: boolean; at: number }>();

/** The board a job came from: from its URL, or the board recorded for its sponsor (custom career domains). */
async function boardFor(url: string, sponsor: string, provider: string): Promise<AtsBoard | null> {
  const fromUrl = detectAts(url);
  if (fromUrl) return fromUrl;
  try {
    const { data } = await supabaseAdmin().from("sponsor_enrichment").select("data").eq("name", sponsor).maybeSingle();
    const ats = (data?.data as { ats?: AtsBoard } | null)?.ats;
    return ats?.slug && ats.provider === provider ? ats : null;
  } catch {
    return null;
  }
}

/** The full ad text from the job board, or the stored snippet (full: false) when it can't be fetched. */
export async function jobDescription(job: IndexedJob): Promise<{ text: string; full: boolean }> {
  const hit = cache.get(job.url);
  if (hit && Date.now() - hit.at < CACHE_MS) return { text: hit.text, full: hit.full };
  const board = await boardFor(job.url, job.sponsor, job.provider);
  const full = board ? await fetchJobDescription(job.url, board, fetch).catch(() => null) : null;
  const result = full?.trim() ? { text: full.trim(), full: true } : { text: job.snippet ?? "", full: false };
  if (result.full) {
    if (cache.size > 300) cache.clear();
    cache.set(job.url, { ...result, at: Date.now() });
  }
  return result;
}
