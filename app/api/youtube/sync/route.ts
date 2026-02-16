import { NextRequest, NextResponse } from "next/server";
import { syncChannels, getSyncSource } from "@/lib/youtube/sync-service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const channelIds = (body.channelIds as string[]) || [];
  const defaultGenreId = body.defaultGenreId as string | undefined;

  if (channelIds.length === 0) {
    return NextResponse.json(
      { error: "At least one channel ID is required" },
      { status: 400 }
    );
  }

  const source = getSyncSource();

  try {
    const result = await syncChannels(channelIds, defaultGenreId || "");
    return NextResponse.json({
      success: true,
      imported: result.imported,
      channelsProcessed: result.channelsProcessed,
      source,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
