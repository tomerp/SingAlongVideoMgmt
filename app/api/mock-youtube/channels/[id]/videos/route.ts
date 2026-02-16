import { NextRequest, NextResponse } from "next/server";
import { getMockVideos } from "@/lib/youtube/mock";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const videos = getMockVideos(id);
  return NextResponse.json(videos);
}
