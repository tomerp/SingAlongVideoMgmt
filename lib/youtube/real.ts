import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export type YouTubeAuth = string | OAuth2Client;

export interface YouTubeChannel {
  id: string;
  name: string;
  description?: string | null;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  publishDate: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  url: string;
}

export interface YouTubePlaylist {
  id: string;
  channelId: string;
  name: string;
  videoIds: string[];
}

/** Channel ID format: UC + 22 alphanumeric chars (e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw) */
function looksLikeChannelId(input: string): boolean {
  const trimmed = input.trim();
  return /^UC[\w-]{22}$/.test(trimmed);
}

/**
 * Resolve an input (channel ID or @handle) to a channel ID.
 * Use this so users can paste either "UCxxx" or "@TheirHandle".
 */
export async function resolveChannelId(
  input: string,
  apiKey: string
): Promise<{ channelId: string; channelName: string } | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const youtube = google.youtube({ version: "v3", auth: apiKey });

  if (looksLikeChannelId(trimmed)) {
    const res = await youtube.channels.list({
      part: ["snippet"],
      id: [trimmed],
    });
    const ch = res.data.items?.[0];
    if (!ch?.id) return null;
    return {
      channelId: ch.id,
      channelName: ch.snippet?.title || ch.id,
    };
  }

  // Try forHandle (handles: @Name or Name — API accepts both)
  const handle = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  const res = await youtube.channels.list({
    part: ["snippet"],
    forHandle: handle,
  });
  const ch = res.data.items?.[0];
  if (!ch?.id) return null;
  return {
    channelId: ch.id,
    channelName: ch.snippet?.title || ch.id,
  };
}

function parseYouTubeDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return h * 3600 + m * 60 + s;
}

export async function getYouTubeChannels(
  channelIds: string[],
  auth: YouTubeAuth
): Promise<YouTubeChannel[]> {
  const youtube = google.youtube({ version: "v3", auth });
  const res = await youtube.channels.list({
    part: ["snippet"],
    id: channelIds,
  });
  return (
    res.data.items?.map((item) => ({
      id: item.id!,
      name: item.snippet?.title || "",
      description: item.snippet?.description,
    })) ?? []
  );
}

export async function getChannelPlaylists(
  channelId: string,
  auth: YouTubeAuth
): Promise<YouTubePlaylist[]> {
  const youtube = google.youtube({ version: "v3", auth });
  const res = await youtube.playlists.list({
    part: ["snippet"],
    channelId,
    maxResults: 50,
  });
  const playlists =
    res.data.items?.map((item) => ({
      id: item.id!,
      channelId: item.snippet?.channelId || channelId,
      name: item.snippet?.title || "",
      videoIds: [] as string[],
    })) ?? [];

  for (const pl of playlists) {
    let nextPageToken: string | undefined;
    do {
      const itemsRes = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: pl.id,
        maxResults: 50,
        pageToken: nextPageToken,
      });
      const ids =
        itemsRes.data.items?.map(
          (i) => i.contentDetails?.videoId
        ).filter(Boolean) ?? [];
      pl.videoIds.push(...(ids as string[]));
      nextPageToken = itemsRes.data.nextPageToken || undefined;
    } while (nextPageToken);
  }

  return playlists;
}

/**
 * Fetch video IDs via search.list as fallback when uploads playlist is incomplete
 * (e.g. Topic/Artist channels have limited uploads). Uses more quota (100/call).
 */
async function getChannelVideoIdsViaSearch(
  youtube: ReturnType<typeof google.youtube>,
  channelId: string
): Promise<string[]> {
  const videoIds: string[] = [];
  let nextPageToken: string | undefined;
  do {
    const res = await youtube.search.list({
      part: ["id"],
      channelId,
      type: ["video"],
      order: "date",
      maxResults: 50,
      pageToken: nextPageToken,
    });
    for (const item of res.data.items ?? []) {
      if (item.id?.videoId) videoIds.push(item.id.videoId);
    }
    nextPageToken = res.data.nextPageToken || undefined;
  } while (nextPageToken);
  return videoIds;
}

export type GetChannelVideosResult = {
  videos: YouTubeVideo[];
  reportedVideoCount: number;
};

export async function getChannelVideos(
  channelId: string,
  auth: YouTubeAuth
): Promise<GetChannelVideosResult> {
  const youtube = google.youtube({ version: "v3", auth });
  const channelRes = await youtube.channels.list({
    part: ["contentDetails", "statistics"],
    id: [channelId],
  });
  const channelItem = channelRes.data.items?.[0];
  const uploadsId = channelItem?.contentDetails?.relatedPlaylists?.uploads;
  const reportedVideoCount = parseInt(
    channelItem?.statistics?.videoCount || "0",
    10
  );

  let videoIds: string[] = [];

  if (uploadsId) {
    let nextPageToken: string | undefined;
    do {
      const listRes = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: uploadsId,
        maxResults: 50,
        pageToken: nextPageToken,
      });
      const ids =
        listRes.data.items
          ?.map((i) => i.contentDetails?.videoId)
          .filter(Boolean) ?? [];
      videoIds.push(...(ids as string[]));
      nextPageToken = listRes.data.nextPageToken || undefined;
    } while (nextPageToken);
  }

  // Fallback 1: if uploads has few videos, try search
  const shouldTrySearch =
    videoIds.length < 10 ||
    (reportedVideoCount > 0 && videoIds.length < reportedVideoCount * 0.5);
  if (shouldTrySearch) {
    const searchIds = await getChannelVideoIdsViaSearch(youtube, channelId);
    if (searchIds.length > videoIds.length) {
      videoIds = searchIds;
    }
  }

  // Fallback 2: Topic channels store videos in playlists, not uploads. Collect
  // from all channel playlists.
  if (videoIds.length < 10) {
    const plRes = await youtube.playlists.list({
      part: ["id"],
      channelId,
      maxResults: 50,
    });
    const playlistIds =
      plRes.data.items?.map((p) => p.id!).filter(Boolean) ?? [];
    const allIds = new Set(videoIds);
    for (const plId of playlistIds) {
      let nextPageToken: string | undefined;
      do {
        const itemsRes = await youtube.playlistItems.list({
          part: ["contentDetails"],
          playlistId: plId,
          maxResults: 50,
          pageToken: nextPageToken,
        });
        for (const i of itemsRes.data.items ?? []) {
          const vid = i.contentDetails?.videoId;
          if (vid) allIds.add(vid);
        }
        nextPageToken = itemsRes.data.nextPageToken || undefined;
      } while (nextPageToken);
    }
    if (allIds.size > videoIds.length) {
      videoIds = Array.from(allIds);
    }
  }

  const videos: YouTubeVideo[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videoRes = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: batch,
    });
    for (const item of videoRes.data.items ?? []) {
      const duration = parseYouTubeDuration(
        item.contentDetails?.duration || "PT0S"
      );
      const publishDate = item.snippet?.publishedAt
        ? new Date(item.snippet.publishedAt)
        : new Date();
      videos.push({
        id: item.id!,
        title: item.snippet?.title || "",
        description: item.snippet?.description ?? "",
        duration,
        publishDate,
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        likeCount: parseInt(item.statistics?.likeCount || "0", 10),
        commentCount: parseInt(item.statistics?.commentCount || "0", 10),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      });
    }
  }
  return { videos, reportedVideoCount };
}

export async function getPlaylistVideos(
  playlistId: string,
  auth: YouTubeAuth
): Promise<YouTubeVideo[]> {
  const youtube = google.youtube({ version: "v3", auth });
  const videoIds: string[] = [];
  let nextPageToken: string | undefined;
  do {
    const listRes = await youtube.playlistItems.list({
      part: ["contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });
    const ids =
      listRes.data.items
        ?.map((i) => i.contentDetails?.videoId)
        .filter(Boolean) ?? [];
    videoIds.push(...(ids as string[]));
    nextPageToken = listRes.data.nextPageToken || undefined;
  } while (nextPageToken);

  const videos: YouTubeVideo[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videoRes = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: batch,
    });
    for (const item of videoRes.data.items ?? []) {
      const duration = parseYouTubeDuration(
        item.contentDetails?.duration || "PT0S"
      );
      const publishDate = item.snippet?.publishedAt
        ? new Date(item.snippet.publishedAt)
        : new Date();
      videos.push({
        id: item.id!,
        title: item.snippet?.title || "",
        description: item.snippet?.description ?? "",
        duration,
        publishDate,
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        likeCount: parseInt(item.statistics?.likeCount || "0", 10),
        commentCount: parseInt(item.statistics?.commentCount || "0", 10),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      });
    }
  }
  return videos;
}
