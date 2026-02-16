"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  duration: number | null;
  genre: { name: string };
  singers: { singer: { name: string } }[];
}

interface PlaylistVideo {
  videoId: string;
  order: number;
  video: Video;
}

interface Playlist {
  id: string;
  name: string;
  type: string;
  videos: PlaylistVideo[];
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function EditPlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVideos, setSearchVideos] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchPlaylist = useCallback(async () => {
    const res = await fetch(`/api/playlists/${id}`);
    if (!res.ok) {
      router.push("/dashboard/playlists");
      return;
    }
    const data = await res.json();
    setPlaylist(data);
  }, [id, router]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    fetch("/api/videos?limit=500")
      .then((r) => r.json())
      .then((d) => setAllVideos(d.videos));
  }, []);

  useEffect(() => {
    setLoading(playlist === null);
  }, [playlist]);

  async function addVideo(videoId: string) {
    if (!playlist) return;
    const currentIds = playlist.videos.map((pv) => pv.videoId);
    if (currentIds.includes(videoId)) return;
    const videoIds = [...currentIds, videoId];
    const res = await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaylist(data);
    }
  }

  async function removeVideo(videoId: string) {
    if (!playlist) return;
    const videoIds = playlist.videos
      .map((pv) => pv.videoId)
      .filter((vid) => vid !== videoId);
    const res = await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaylist(data);
    }
  }

  async function handleReorder(newVideos: PlaylistVideo[]) {
    const videoIds = newVideos.map((pv) => pv.videoId);
    const res = await fetch(`/api/playlists/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaylist(data);
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(
    e: React.DragEvent,
    index: number,
    videos: PlaylistVideo[]
  ) {
    e.preventDefault();
    if (draggedIndex == null) return;
    if (draggedIndex === index) return;
    const newVideos = [...videos];
    const [removed] = newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, removed);
    setPlaylist((p) => (p ? { ...p, videos: newVideos } : null));
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    if (playlist && draggedIndex != null) {
      handleReorder(playlist.videos);
    }
    setDraggedIndex(null);
  }

  if (loading || !playlist) {
    return <p className="py-8 text-slate-500">Loading...</p>;
  }

  if (playlist.type === "YOUTUBE") {
    return (
      <div>
        <p className="text-slate-600">
          YouTube playlists are read-only. Cannot edit.
        </p>
        <Link
          href="/dashboard/playlists"
          className="mt-2 inline-block text-blue-600 hover:underline"
        >
          Back to playlists
        </Link>
      </div>
    );
  }

  const inPlaylistIds = new Set(playlist.videos.map((pv) => pv.videoId));
  const filteredVideos = allVideos.filter(
    (v) =>
      !inPlaylistIds.has(v.id) &&
      (!searchVideos ||
        v.title.toLowerCase().includes(searchVideos.toLowerCase()))
  );

  const totalDuration = playlist.videos.reduce(
    (sum, pv) => sum + (pv.video.duration || 0),
    0
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/dashboard/playlists"
          className="text-blue-600 hover:underline"
        >
          Back
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Edit: {playlist.name}
      </h1>
      <p className="mb-4 text-sm text-slate-600">
        {playlist.videos.length} videos · Total: {formatDuration(totalDuration)}
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium">Playlist order (drag to reorder)</h3>
          <ul className="space-y-1 rounded border border-slate-200 bg-white p-2">
            {playlist.videos.map((pv, idx) => (
              <li
                key={pv.videoId}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx, playlist.videos)}
                onDragEnd={handleDragEnd}
                className={`flex cursor-grab items-center justify-between rounded px-2 py-1.5 ${
                  draggedIndex === idx ? "bg-blue-100 opacity-50" : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <span className="text-sm">
                  {idx + 1}. {pv.video.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeVideo(pv.videoId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-medium">Add videos</h3>
          <input
            type="text"
            placeholder="Search videos..."
            value={searchVideos}
            onChange={(e) => setSearchVideos(e.target.value)}
            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <ul className="max-h-96 space-y-1 overflow-y-auto rounded border border-slate-200 bg-white p-2">
            {filteredVideos.slice(0, 50).map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="text-sm">{v.title}</span>
                <button
                  type="button"
                  onClick={() => addVideo(v.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Add
                </button>
              </li>
            ))}
            {filteredVideos.length > 50 && (
              <li className="py-2 text-xs text-slate-500">
                Showing 50 of {filteredVideos.length}. Refine search.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
