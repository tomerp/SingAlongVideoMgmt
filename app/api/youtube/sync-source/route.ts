import { NextResponse } from "next/server";
import { getSyncSource } from "@/lib/youtube/sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const source = getSyncSource();
  return NextResponse.json({ source });
}
