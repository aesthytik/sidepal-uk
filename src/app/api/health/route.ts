import { NextResponse } from "next/server";
import { directoryInfo } from "@/lib/directory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ status: "ok", ...(await directoryInfo()), serverTime: new Date().toISOString() });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
