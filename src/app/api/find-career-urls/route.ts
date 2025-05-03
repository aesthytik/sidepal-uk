import { NextResponse } from "next/server";
import { findCareerUrl } from "@/lib/findCareerUrl";

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

    const careerUrls: Record<string, string> = {};

    // Process each sponsor in parallel
    const results = await Promise.all(
      sponsors.map(async ({ name, website }) => {
        if (!website || website === "unknown") {
          return { name, careerUrl: null };
        }
        const careerUrl = await findCareerUrl(name, website);
        return { name, careerUrl };
      })
    );

    // Collect results
    results.forEach(({ name, careerUrl }) => {
      if (careerUrl) {
        careerUrls[name] = careerUrl;
      }
    });

    return NextResponse.json({
      success: true,
      careerUrls,
    });
  } catch (error) {
    console.error("Error finding career URLs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
