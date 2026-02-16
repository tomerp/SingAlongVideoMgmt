import { NextRequest, NextResponse } from "next/server";
import { getMockPlaylistVideos } from "@/lib/youtube/mock";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const videos = getMockPlaylistVideos(id);
  return NextResponse.json(videos);
}
