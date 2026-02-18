import { NextRequest, NextResponse } from "next/server";
import { syncChannels, getSyncSource } from "@/lib/youtube/sync-service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const channelIds = (body.channelIds as string[]) || [];
  const defaultGenreId = body.defaultGenreId as string | undefined;
  const syncConnectedChannel = body.syncConnectedChannel === true;

  if (channelIds.length === 0 && !syncConnectedChannel) {
    return NextResponse.json(
      { error: "Connect your YouTube account or enter a channel ID" },
      { status: 400 }
    );
  }

  const source = getSyncSource();

  try {
    const result = await syncChannels(channelIds, defaultGenreId || "", {
      syncConnectedChannel,
    });
    return NextResponse.json({
      success: true,
      imported: result.imported,
      channelsProcessed: result.channelsProcessed,
      channelDetails: result.channelDetails,
      source,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
