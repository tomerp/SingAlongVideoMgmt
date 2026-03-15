"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface PlaylistVideo {
  videoId: string;
  order: number;
  video: {
    id: string;
    title: string;
    duration: number | null;
    genre: { name: string };
    singers: { singer: { name: string } }[];
  };
}

interface Playlist {
  id: string;
  name: string;
  type: string;
  youtubePlaylistId: string | null;
  youtubeChannelName: string | null;
  videos: PlaylistVideo[];
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    const res = await fetch("/api/playlists");
    const data = await res.json();
    setPlaylists(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPlaylists().finally(() => setLoading(false));
  }, [fetchPlaylists]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await fetchPlaylists();
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-slate-500">Loading...</p>;
  }

  const localPlaylists = playlists.filter((p) => p.type === "LOCAL");
  const youtubePlaylists = playlists.filter((p) => p.type === "YOUTUBE");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Playlists</h1>

      <div className="mb-8">
        <h2 className="mb-3 font-medium text-slate-700">Create Local Playlist</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {localPlaylists.length > 0 && (
          <section>
            <h2 className="mb-3 font-medium text-slate-700">Local Playlists</h2>
            <div className="space-y-4">
              {localPlaylists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onUpdate={fetchPlaylists}
                  editable
                />
              ))}
            </div>
          </section>
        )}

        {youtubePlaylists.length > 0 && (
          <section>
            <h2 className="mb-3 font-medium text-slate-700">
              YouTube Playlists (read-only)
            </h2>
            <div className="space-y-4">
              {youtubePlaylists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onUpdate={fetchPlaylists}
                  editable={false}
                />
              ))}
            </div>
          </section>
        )}

        {playlists.length === 0 && (
          <p className="text-slate-500">
            No playlists yet. Create a local playlist above or sync from YouTube
            (mock) to import playlists.
          </p>
        )}
      </div>
    </div>
  );
}

function PlaylistCard({
  playlist,
  onUpdate,
  editable,
}: {
  playlist: Playlist;
  onUpdate: () => void;
  editable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [videos, setVideos] = useState(playlist.videos);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setVideos(playlist.videos);
  }, [playlist.videos]);

  async function handleReorder(newOrder: PlaylistVideo[]) {
    const videoIds = newOrder.map((pv) => pv.videoId);
    const res = await fetch(`/api/playlists/${playlist.id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds }),
    });
    if (res.ok) {
      const data = await res.json();
      setVideos(data.videos);
      onUpdate();
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex == null) return;
    if (draggedIndex === index) return;
    const newVideos = [...videos];
    const [removed] = newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, removed);
    setVideos(newVideos);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    if (draggedIndex != null) {
      handleReorder(videos);
    }
    setDraggedIndex(null);
  }

  const totalDuration = videos.reduce(
    (sum, pv) => sum + (pv.video.duration || 0),
    0
  );

  async function handleDelete() {
    if (!confirm("Delete this playlist? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      });
      if (res.ok) onUpdate();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-medium text-slate-800">{playlist.name}</h3>
          {playlist.youtubeChannelName && (
            <p className="text-xs text-slate-500">
              {playlist.youtubeChannelName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {videos.length} videos
            {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
          </span>
          {playlist.type === "LOCAL" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deleting}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-4">
          {editable && (
            <Link
              href={`/dashboard/playlists/${playlist.id}/edit`}
              className="mb-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Edit playlist (add/remove videos, drag to reorder)
            </Link>
          )}
          <ul className="space-y-1">
            {videos.map((pv, idx) => (
              <li
                key={pv.videoId}
                draggable={editable}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between rounded px-2 py-1 ${
                  editable ? "cursor-grab bg-slate-50 hover:bg-slate-100" : ""
                } ${draggedIndex === idx ? "opacity-50" : ""}`}
              >
                <span className="text-sm">
                  {idx + 1}. {pv.video.title}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDuration(pv.video.duration)} · {pv.video.genre?.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
