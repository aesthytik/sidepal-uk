import { NextResponse } from "next/server";
import { getDatasetInfo } from "@/lib/processSponsorData";

export const dynamic = "force-dynamic";

/**
 * API route to check the health of the application
 * Returns the status, sponsor count and data source
 */
export async function GET() {
  try {
    const info = await getDatasetInfo();
    return NextResponse.json({
      status: "ok",
      ...info,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to check health",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
