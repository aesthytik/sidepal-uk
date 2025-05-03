import { NextResponse } from "next/server";
import { processSponsorData } from "@/lib/processSponsorData";

// Using Node.js runtime for file system operations

/**
 * API route to trigger the sponsor data update process
 * This is meant to be called by a cron job or manually for testing
 */
export async function POST() {
  try {
    // Process the sponsor data
    const sponsors = await processSponsorData();

    return NextResponse.json({
      success: true,
      message: "Sponsor data updated successfully",
      count: sponsors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating sponsors:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update sponsor data",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
