import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { resolveChannelId } from "@/lib/youtube/real";

/**
 * GET /api/youtube/diagnose?channel=UCxxx or ?channel=@handle
 *
 * Returns what YouTube reports for this channel — useful when sync finds
 * fewer videos than expected.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not set" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("channel")?.trim();
  if (!input) {
    return NextResponse.json(
      { error: "Add ?channel=UCxxx or ?channel=@handle" },
      { status: 400 }
    );
  }

  const youtube = google.youtube({ version: "v3", auth: apiKey });

  // Resolve handle to channel ID if needed
  let channelId = input;
  let channelName = input;
  if (!/^UC[\w-]{22}$/.test(input)) {
    const resolved = await resolveChannelId(input, apiKey);
    if (!resolved) {
      return NextResponse.json(
        { error: `Could not resolve "${input}" to a channel` },
        { status: 400 }
      );
    }
    channelId = resolved.channelId;
    channelName = resolved.channelName;
  }

  // Channel details with statistics
  const channelRes = await youtube.channels.list({
    part: ["snippet", "contentDetails", "statistics"],
    id: [channelId],
  });
  const ch = channelRes.data.items?.[0];
  if (!ch) {
    return NextResponse.json(
      { error: `Channel ${channelId} not found` },
      { status: 404 }
    );
  }

  const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
  const reportedVideoCount = parseInt(
    ch.statistics?.videoCount || "0",
    10
  );

  // Count from uploads playlist
  let uploadsCount = 0;
  if (uploadsId) {
    let nextToken: string | undefined;
    do {
      const r = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: uploadsId,
        maxResults: 50,
        pageToken: nextToken,
      });
      uploadsCount += r.data.items?.length ?? 0;
      nextToken = r.data.nextPageToken || undefined;
    } while (nextToken);
  }

  // Count from search
  let searchCount = 0;
  let nextToken: string | undefined;
  do {
    const r = await youtube.search.list({
      part: ["id"],
      channelId,
      type: ["video"],
      order: "date",
      maxResults: 50,
      pageToken: nextToken,
    });
    searchCount += r.data.items?.filter((i) => i.id?.videoId).length ?? 0;
    nextToken = r.data.nextPageToken || undefined;
  } while (nextToken);

  // Playlists and their video counts
  const plRes = await youtube.playlists.list({
    part: ["snippet"],
    channelId,
    maxResults: 50,
  });
  const playlists: { id: string; name: string; videoCount: number }[] = [];
  for (const pl of plRes.data.items ?? []) {
    let count = 0;
    let nextToken: string | undefined;
    do {
      const r = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: pl.id!,
        maxResults: 50,
        pageToken: nextToken,
      });
      count += r.data.items?.length ?? 0;
      nextToken = r.data.nextPageToken || undefined;
    } while (nextToken);
    playlists.push({
      id: pl.id!,
      name: pl.snippet?.title || "(unnamed)",
      videoCount: count,
    });
  }
  const totalFromPlaylists = playlists.reduce(
    (sum, p) => sum + p.videoCount,
    0
  );

  return NextResponse.json({
    channelId,
    channelName: ch.snippet?.title || channelName,
    reportedVideoCount,
    uploadsPlaylistId: uploadsId,
    uploadsCount,
    searchCount,
    playlists,
    totalFromPlaylists,
    summary:
      reportedVideoCount > uploadsCount + 5
        ? "YouTube reports more videos than uploads playlist has. This may be a Topic/Artist channel, or videos could be on a different channel (e.g. Brand Account)."
        : uploadsCount === reportedVideoCount
          ? "Uploads count matches YouTube's reported count."
          : "Check if you have multiple channels (e.g. Brand Account) — your videos may be on a different channel.",
  });
}
