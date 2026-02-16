import { NextRequest, NextResponse } from "next/server";
import { getMockPlaylists } from "@/lib/youtube/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const playlists = getMockPlaylists(channelId || undefined);
  return NextResponse.json(playlists);
}
