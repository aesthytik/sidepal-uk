import { NextRequest, NextResponse } from "next/server";
import { enrichDomain } from "@/lib/enrichDomain";
import { getDomain, hasDomainEntry, setDomains } from "@/lib/enrichmentCache";

const MAX_BATCH = 25;

/**
 * Looks up websites for the given sponsors. Results (including "unknown")
 * are cached so each company is only looked up once.
 */
export async function POST(request: NextRequest) {
  try {
    const { sponsors } = await request.json();

    if (!Array.isArray(sponsors)) {
      return NextResponse.json(
        { success: false, error: "Invalid sponsors data" },
        { status: 400 }
      );
    }

    const batch = sponsors
      .filter((s) => typeof s?.name === "string")
      .slice(0, MAX_BATCH) as { name: string; city?: string }[];

    const domains: Record<string, string> = {};
    const newEntries: Record<string, string> = {};

    await Promise.all(
      batch.map(async ({ name, city }) => {
        if (hasDomainEntry(name)) {
          const cached = getDomain(name);
          if (cached) domains[name] = cached;
          return;
        }
        const domain = await enrichDomain(name, city);
        newEntries[name] = domain;
        if (domain !== "unknown") domains[name] = domain;
      })
    );

    if (Object.keys(newEntries).length > 0) setDomains(newEntries);

    return NextResponse.json({ success: true, domains });
  } catch (error) {
    console.error("Error in domain enrichment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to enrich domains",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
