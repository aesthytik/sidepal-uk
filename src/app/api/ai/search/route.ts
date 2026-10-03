import { NextRequest, NextResponse } from "next/server";
import { suggestLocations } from "@/lib/directory";
import { aiEnabled } from "@/lib/ai/openrouter";
import { MAX_TEXT, parseQuery } from "@/lib/ai/parseQuery";
import { allow } from "@/lib/ai/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const cache = new Map<string, unknown>();

/**
 * Turns a plain-English request into search filters.
 * Body: { text: string }  ->  { filters, ai: boolean }
 * Falls back to a company-name search when the model is unavailable.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const fallback = { filters: { q: text }, ai: false };
  if (!aiEnabled()) return NextResponse.json(fallback, { status: 503 });

  const key = text.toLowerCase();
  if (cache.has(key)) return NextResponse.json(cache.get(key));

  try {
    const filters = await parseQuery(text, (name) => name);
    // Validate the location against the register so a made-up town can't reach the URL
    if (filters.location) {
      const [match] = await suggestLocations(filters.location);
      if (match?.toLowerCase() === filters.location.toLowerCase()) filters.location = match;
      else delete filters.location;
    }
    if (Object.keys(filters).length === 0) return NextResponse.json(fallback);
    const result = { filters, ai: true };
    if (cache.size > 500) cache.clear();
    cache.set(key, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI search failed:", error);
    return NextResponse.json(fallback, { status: 503 });
  }
}
