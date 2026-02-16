import fixtures from "../../mock-data/youtube-fixtures.json";

export interface MockChannel {
  id: string;
  name: string;
  description?: string;
}

export interface MockVideo {
  id: string;
  title: string;
  description?: string;
  duration: number;
  publishDate: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  url: string;
}

export interface MockPlaylist {
  id: string;
  channelId: string;
  name: string;
  videoIds: string[];
}

const typedFixtures = fixtures as {
  channels: MockChannel[];
  playlists: MockPlaylist[];
  videos: MockVideo[];
};

export function getMockChannels(): MockChannel[] {
  return typedFixtures.channels;
}

export function getMockChannel(id: string): MockChannel | undefined {
  return typedFixtures.channels.find((c) => c.id === id);
}

export function getMockPlaylists(channelId?: string): MockPlaylist[] {
  if (channelId) {
    return typedFixtures.playlists.filter((p) => p.channelId === channelId);
  }
  return typedFixtures.playlists;
}

export function getMockPlaylist(id: string): MockPlaylist | undefined {
  return typedFixtures.playlists.find((p) => p.id === id);
}

export function getMockVideos(channelId?: string): MockVideo[] {
  const videos = typedFixtures.videos;
  if (!channelId) return videos;
  const channelPlaylists = typedFixtures.playlists.filter(
    (p) => p.channelId === channelId
  );
  const videoIds = new Set(
    channelPlaylists.flatMap((p) => p.videoIds)
  );
  return videos.filter((v) => videoIds.has(v.id));
}

export function getMockVideo(id: string): MockVideo | undefined {
  return typedFixtures.videos.find((v) => v.id === id);
}

export function getMockPlaylistVideos(playlistId: string): MockVideo[] {
  const playlist = getMockPlaylist(playlistId);
  if (!playlist) return [];
  const videoMap = new Map(typedFixtures.videos.map((v) => [v.id, v]));
  return playlist.videoIds
    .map((id) => videoMap.get(id))
    .filter((v): v is MockVideo => v != null);
}
