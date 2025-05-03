import { NextResponse } from "next/server";
import { classifySector, Sector } from "@/lib/classifySector";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sponsors } = body;

    if (!Array.isArray(sponsors)) {
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }

    const sectors: Record<string, Sector> = {};

    // Process each sponsor in parallel
    const results = await Promise.all(
      sponsors.map(async ({ name, website }) => {
        const sector = await classifySector(name, website);
        return { name, sector };
      })
    );

    // Collect results
    results.forEach(({ name, sector }) => {
      if (sector) {
        sectors[name] = sector;
      }
    });

    return NextResponse.json({
      success: true,
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
