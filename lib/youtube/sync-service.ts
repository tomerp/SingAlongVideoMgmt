import { prisma } from "@/lib/db";
import { SourceType, PlaylistType } from "@prisma/client";
import {
  getMockChannels,
  getMockVideos,
  getMockPlaylists,
  getMockPlaylistVideos,
} from "./mock";
import {
  resolveChannelId,
  getYouTubeChannels,
  getChannelPlaylists,
  getChannelVideos,
  getPlaylistVideos,
} from "./real";
import { getValidOAuth2Client, getStoredConnection } from "./oauth";

export type SyncSource = "mock" | "real";

export function getSyncSource(): SyncSource {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const forceMock = process.env.USE_MOCK_YOUTUBE === "true";
  if (forceMock || !apiKey) return "mock";
  return "real";
}

export async function syncChannels(
  channelIds: string[],
  defaultGenreId: string,
  options?: { syncConnectedChannel?: boolean }
): Promise<{
  imported: { videos: number; playlists: number };
  channelsProcessed: number;
  channelDetails?: {
    name: string;
    totalVideos: number;
    newVideos: number;
    reportedVideoCount?: number;
  }[];
}> {
  const source = getSyncSource();
  const genre = defaultGenreId
    ? await prisma.genre.findUnique({ where: { id: defaultGenreId } })
    : await prisma.genre.findFirst();
  if (!genre) {
    throw new Error("No genre found. Create at least one genre in Setup first.");
  }

  const imported = { videos: 0, playlists: 0 };
  let channelsProcessed = 0;
  const channelDetails: {
    name: string;
    totalVideos: number;
    newVideos: number;
    reportedVideoCount?: number;
  }[] = [];

  const apiKey = process.env.YOUTUBE_API_KEY;
  const oauthClient = await getValidOAuth2Client();
  const oauthConn = await getStoredConnection();

  // Build list of channels to sync
  const channelsToSync: { channelId: string; channelName: string; useOAuth: boolean }[] = [];

  if (
    source === "real" &&
    options?.syncConnectedChannel &&
    oauthConn?.channelId &&
    oauthClient
  ) {
    channelsToSync.push({
      channelId: oauthConn.channelId,
      channelName: oauthConn.channelName ?? "Your channel",
      useOAuth: true,
    });
  }

  for (const input of channelIds) {
    const trimmed = input.trim();
    if (!trimmed) continue;
    if (source === "real" && apiKey) {
      const resolved = await resolveChannelId(trimmed, apiKey);
      if (!resolved) {
        throw new Error(
          `Could not find channel "${trimmed}". Use a channel ID (UC...) or @handle. Check it at https://www.youtube.com/account_advanced`
        );
      }
      // Use OAuth if this is the connected channel
      const isConnectedChannel = oauthConn?.channelId === resolved.channelId;
      channelsToSync.push({
        channelId: resolved.channelId,
        channelName: resolved.channelName ?? resolved.channelId,
        useOAuth: isConnectedChannel && !!oauthClient,
      });
    } else if (source === "mock") {
      channelsToSync.push({
        channelId: trimmed,
        channelName: trimmed,
        useOAuth: false,
      });
    }
  }

  for (const { channelId, channelName: name, useOAuth } of channelsToSync) {
    let channelName: string | undefined = name;
    let videos: { id: string; title: string; description?: string; duration: number; publishDate: Date; viewCount: number; likeCount: number; commentCount: number; url: string }[];
    let playlists: { id: string; channelId: string; name: string; videoIds: string[] }[];
    let reportedVideoCount: number | undefined;

    const auth = useOAuth && oauthClient ? oauthClient : apiKey!;

    if (source === "mock") {
      const mockChannels = getMockChannels();
      if (!mockChannels.some((c) => c.id === channelId)) continue;
      channelName = mockChannels.find((c) => c.id === channelId)?.name;
      const mockVids = getMockVideos(channelId);
      videos = mockVids.map((v) => ({
        ...v,
        publishDate: new Date(v.publishDate),
        likeCount: v.likeCount ?? 0,
        commentCount: v.commentCount ?? 0,
      }));
      playlists = getMockPlaylists(channelId);
      for (const pl of playlists) {
        const pvideos = getMockPlaylistVideos(pl.id);
        pl.videoIds = pvideos.map((v) => v.id);
      }
    } else {
      if (!apiKey) continue;
      if (!channelName) {
        const channels = await getYouTubeChannels([channelId], auth);
        if (channels.length === 0) continue;
        channelName = channels[0].name;
      }
      const channelVideosResult = await getChannelVideos(channelId, auth);
      videos = channelVideosResult.videos;
      reportedVideoCount = channelVideosResult.reportedVideoCount;
      playlists = await getChannelPlaylists(channelId, auth);
      for (const pl of playlists) {
        const pvideos = await getPlaylistVideos(pl.id, auth);
        pl.videoIds = pvideos.map((v) => v.id);
      }
    }

    channelsProcessed++;
    let newVideosThisChannel = 0;

    for (const v of videos) {
      const existing = await prisma.video.findUnique({
        where: { youtubeVideoId: v.id },
      });
      const descPreview = v.description ? v.description.slice(0, 150) : null;

      if (existing) {
        await prisma.video.update({
          where: { id: existing.id },
          data: {
            title: v.title,
            description: v.description || null,
            descriptionPreview: descPreview,
            duration: v.duration,
            publishDate: v.publishDate,
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            url: v.url,
          },
        });
      } else {
        await prisma.video.create({
          data: {
            title: v.title,
            description: v.description || null,
            descriptionPreview: descPreview,
            duration: v.duration,
            publishDate: v.publishDate,
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            url: v.url,
            sourceType: SourceType.YOUTUBE,
            youtubeVideoId: v.id,
            genreId: genre.id,
            active: true,
          },
        });
        imported.videos++;
        newVideosThisChannel++;
      }
    }

    channelDetails.push({
      name: channelName ?? channelId,
      totalVideos: videos.length,
      newVideos: newVideosThisChannel,
      reportedVideoCount,
    });

    for (const pl of playlists) {
      const existingPl = await prisma.playlist.findUnique({
        where: { youtubePlaylistId: pl.id },
      });

      let playlistId: string;
      if (existingPl) {
        playlistId = existingPl.id;
        await prisma.playlistVideo.deleteMany({ where: { playlistId } });
      } else {
        const created = await prisma.playlist.create({
          data: {
            name: pl.name,
            type: PlaylistType.YOUTUBE,
            youtubePlaylistId: pl.id,
          },
        });
        playlistId = created.id;
        imported.playlists++;
      }

      const videoRecords = await prisma.video.findMany({
        where: { youtubeVideoId: { in: pl.videoIds } },
      });
      const vidMap = new Map(
        videoRecords.map((vr) => [vr.youtubeVideoId!, vr.id])
      );

      let order = 0;
      for (const vid of pl.videoIds) {
        const videoId = vidMap.get(vid);
        if (videoId) {
          await prisma.playlistVideo.create({
            data: { playlistId, videoId, order: order++ },
          });
        }
      }
    }

    await prisma.youTubeChannel.upsert({
      where: { youtubeChannelId: channelId },
      update: {},
      create: {
        youtubeChannelId: channelId,
        name: channelName,
      },
    });
  }

  return { imported, channelsProcessed, channelDetails };
}
