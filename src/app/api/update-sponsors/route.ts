import { NextResponse } from "next/server";
import { refreshFromGovUk } from "@/lib/directory";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Downloads the latest sponsor register from GOV.UK.
 * Called daily by Vercel Cron (GET) or manually (POST).
 * When CRON_SECRET is set, requests must send `Authorization: Bearer <secret>`.
 */
async function handler(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await refreshFromGovUk();
    return NextResponse.json({
      success: true,
      message: "Sponsor data updated successfully",
      ...result,
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

export { handler as GET, handler as POST };
