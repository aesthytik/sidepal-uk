import { NextRequest, NextResponse } from "next/server";
import { type AtsBoard, detectAts, fetchJobDescription } from "@/lib/enrichment/ats";
import { jobByUrl } from "@/lib/jobs";
import { allow } from "@/lib/ai/rateLimit";
import { supabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const MAX_CHARS = 12_000;
const cache = new Map<string, { text: string; full: boolean }>();

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

/**
 * GET ?url=<job url> -> { text, full }. Only jobs in today's index are looked up, so this can't
 * be used to fetch arbitrary pages. Falls back to the stored snippet (full: false).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(`desc:${ip}`)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const job = url ? await jobByUrl(url) : null;
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const hit = cache.get(url);
  if (hit) return NextResponse.json(hit);

  const board = await boardFor(job.url, job.sponsor, job.provider);
  const full = board ? await fetchJobDescription(job.url, board, fetch).catch(() => null) : null;
  const result = full && full.length > (job.snippet?.length ?? 0) ? { text: full.slice(0, MAX_CHARS), full: true } : { text: job.snippet ?? "", full: false };
  if (result.full) {
    if (cache.size > 300) cache.clear();
    cache.set(url, result);
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=3600" } });
}
