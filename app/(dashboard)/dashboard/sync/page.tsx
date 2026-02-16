"use client";

import { useState, useEffect } from "react";

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface Genre {
  id: string;
  name: string;
}

export default function SyncPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(
    new Set()
  );
  const [customChannelId, setCustomChannelId] = useState("");
  const [defaultGenreId, setDefaultGenreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    imported?: { videos: number; playlists: number };
    channelsProcessed?: number;
    source?: string;
    error?: string;
  } | null>(null);
  const [syncSource, setSyncSource] = useState<"mock" | "real">("mock");

  useEffect(() => {
    fetch("/api/youtube/sync-source")
      .then((r) => r.json())
      .then((d) => setSyncSource(d.source || "mock"));
    fetch("/api/mock-youtube/channels")
      .then((r) => r.json())
      .then(setChannels);
    fetch("/api/genres")
      .then((r) => r.json())
      .then((data) => {
        setGenres(data);
        if (data[0] && !defaultGenreId) setDefaultGenreId(data[0].id);
      });
  }, [defaultGenreId]);

  function toggleChannel(id: string) {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getChannelIdsToSync(): string[] {
    if (syncSource === "real" && customChannelId.trim()) {
      return customChannelId.trim().split(/[\s,]+/).filter(Boolean);
    }
    return Array.from(selectedChannelIds);
  }

  async function handleSync() {
    const ids = getChannelIdsToSync();
    if (ids.length === 0) {
      setResult({
        error:
          syncSource === "real"
            ? "Enter at least one YouTube channel ID (e.g. UC...)"
            : "Select at least one channel",
      });
      return;
    }
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelIds: ids,
          defaultGenreId: defaultGenreId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "Sync failed" });
        return;
      }
      setResult({
        success: true,
        imported: data.imported,
        channelsProcessed: data.channelsProcessed,
        source: data.source,
      });
    } catch {
      setResult({ error: "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        YouTube Sync {syncSource === "real" ? "" : "(Mock)"}
      </h1>
      <p className="mb-4 text-slate-600">
        {syncSource === "real"
          ? "Sync from real YouTube channels. Add YOUTUBE_API_KEY to use real API."
          : "Using mock YouTube data. Set YOUTUBE_API_KEY in .env to sync from real YouTube."}
      </p>

      <div className="mb-6 rounded border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-slate-800">Default genre for new videos</h3>
        <select
          value={defaultGenreId}
          onChange={(e) => setDefaultGenreId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
          disabled={genres.length === 0}
        >
          <option value="" disabled>
            {genres.length === 0 ? "Loading genres..." : "Select genre"}
          </option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 rounded border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-slate-800">
          {syncSource === "real"
            ? "YouTube channel IDs (comma-separated)"
            : "Select channels to sync"}
        </h3>
        {syncSource === "real" ? (
          <input
            type="text"
            value={customChannelId}
            onChange={(e) => setCustomChannelId(e.target.value)}
            placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw, UC..."
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        ) : (
          <div className="space-y-2">
            {channels.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedChannelIds.has(c.id)}
                  onChange={() => toggleChannel(c.id)}
                />
                <span>{c.name}</span>
                <span className="text-slate-500">({c.id})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSync}
        disabled={syncing || getChannelIdsToSync().length === 0}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>

      {result && (
        <div
          className={`mt-4 rounded border p-4 ${
            result.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <p>
              Sync complete. Imported {result.imported?.videos ?? 0} new videos
              and {result.imported?.playlists ?? 0} playlists from{" "}
              {result.channelsProcessed} channel(s).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
