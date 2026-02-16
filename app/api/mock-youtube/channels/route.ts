import { NextResponse } from "next/server";
import { getMockChannels } from "@/lib/youtube/mock";

export async function GET() {
  const channels = getMockChannels();
  return NextResponse.json(channels);
}
