import { NextResponse } from "next/server";
import { getSyncSource } from "@/lib/youtube/sync-service";

export async function GET() {
  const source = getSyncSource();
  return NextResponse.json({ source });
}
