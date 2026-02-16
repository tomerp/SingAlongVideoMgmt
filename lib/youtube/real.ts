import { google } from "googleapis";

export interface YouTubeChannel {
  id: string;
  name: string;
  description?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  publishDate: Date;
  viewCount: number;
  url: string;
}

export interface YouTubePlaylist {
  id: string;
  channelId: string;
  name: string;
  videoIds: string[];
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
  apiKey: string
): Promise<YouTubeChannel[]> {
  const youtube = google.youtube({ version: "v3", auth: apiKey });
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
  apiKey: string
): Promise<YouTubePlaylist[]> {
  const youtube = google.youtube({ version: "v3", auth: apiKey });
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

export async function getChannelVideos(
  channelId: string,
  apiKey: string
): Promise<YouTubeVideo[]> {
  const youtube = google.youtube({ version: "v3", auth: apiKey });
  const channelRes = await youtube.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });
  const uploadsId =
    channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const videoIds: string[] = [];
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
        description: item.snippet?.description,
        duration,
        publishDate,
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      });
    }
  }
  return videos;
}

export async function getPlaylistVideos(
  playlistId: string,
  apiKey: string
): Promise<YouTubeVideo[]> {
  const youtube = google.youtube({ version: "v3", auth: apiKey });
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
        description: item.snippet?.description,
        duration,
        publishDate,
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        url: `https://www.youtube.com/watch?v=${item.id}`,
      });
    }
  }
  return videos;
}
