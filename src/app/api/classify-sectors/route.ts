import { NextResponse } from "next/server";
import { classifySector, isClassificationEnabled } from "@/lib/classifySector";
import { getSector, setSectors } from "@/lib/enrichmentCache";
import type { Sector } from "@/lib/sponsorTypes";

const MAX_BATCH = 25;

export async function POST(req: Request) {
  try {
    const { sponsors } = await req.json();

    if (!Array.isArray(sponsors)) {
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }

    const batch = sponsors
      .filter((s) => typeof s?.name === "string")
      .slice(0, MAX_BATCH) as { name: string }[];

    const sectors: Record<string, Sector> = {};
    const newEntries: Record<string, Sector> = {};

    await Promise.all(
      batch.map(async ({ name }) => {
        const cached = getSector(name);
        if (cached) {
          sectors[name] = cached;
          return;
        }
        if (!isClassificationEnabled()) return;

        const sector = await classifySector(name);
        if (sector) {
          sectors[name] = sector;
          newEntries[name] = sector;
        }
      })
    );

    if (Object.keys(newEntries).length > 0) setSectors(newEntries);

    return NextResponse.json({
      success: true,
      enabled: isClassificationEnabled(),
      sectors,
    });
  } catch (error) {
    console.error("Error classifying sectors:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
