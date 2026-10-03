import { NextResponse } from "next/server";
import { findCareerUrl } from "@/lib/findCareerUrl";
import {
  getCareerUrl,
  isUsableWebsite,
  setCareerUrls,
} from "@/lib/enrichmentCache";

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
      .slice(0, MAX_BATCH) as { name: string; website?: string }[];

    const careerUrls: Record<string, string> = {};
    const newEntries: Record<string, string | null> = {};

    await Promise.all(
      batch.map(async ({ name, website }) => {
        const cached = getCareerUrl(name);
        if (cached !== undefined) {
          if (cached) careerUrls[name] = cached;
          return;
        }
        if (!isUsableWebsite(website)) return;

        const careerUrl = await findCareerUrl(website);
        newEntries[name] = careerUrl;
        if (careerUrl) careerUrls[name] = careerUrl;
      })
    );

    if (Object.keys(newEntries).length > 0) setCareerUrls(newEntries);

    return NextResponse.json({ success: true, careerUrls });
  } catch (error) {
    console.error("Error finding career URLs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
