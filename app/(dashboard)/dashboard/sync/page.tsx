"use client";

import { useState, useEffect } from "react";

interface Channel {
  id: string;
  name: string;
  description?: string;
}

export default function SyncPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(
    new Set()
  );
  const [customChannelId, setCustomChannelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    imported?: { videos: number; playlists: number };
    channelsProcessed?: number;
    channelDetails?: {
      name: string;
      totalVideos: number;
      newVideos: number;
      reportedVideoCount?: number;
    }[];
    source?: string;
    error?: string;
  } | null>(null);
  const [syncSource, setSyncSource] = useState<"mock" | "real">("mock");
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeChannelName, setYoutubeChannelName] = useState<string | null>(
    null
  );
  const [syncMyChannel, setSyncMyChannel] = useState(false);

  useEffect(() => {
    fetch("/api/youtube/sync-source")
      .then((r) => r.json())
      .then((d) => setSyncSource(d.source || "mock"));
    fetch("/api/auth/youtube/status")
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : { connected: false }))
      .then((d) => {
        setYoutubeConnected(d?.connected ?? false);
        setYoutubeChannelName(d?.channelName ?? null);
      })
      .catch(() => {
        setYoutubeConnected(false);
        setYoutubeChannelName(null);
      });
    fetch("/api/mock-youtube/channels")
      .then((r) => r.json())
      .then(setChannels);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube_connected") === "1") {
      fetch("/api/auth/youtube/status")
        .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : { connected: false }))
        .then((d) => {
          setYoutubeConnected(d?.connected ?? true);
          setYoutubeChannelName(d?.channelName ?? null);
          setSyncMyChannel(true);
        })
        .catch(() => {});
      window.history.replaceState({}, "", "/dashboard/sync");
    }
    const err = params.get("error");
    if (err) {
      setResult({ error: decodeURIComponent(err) });
      window.history.replaceState({}, "", "/dashboard/sync");
    }
  }, []);

  async function handleDisconnect() {
    try {
      await fetch("/api/auth/youtube/disconnect", { method: "POST" });
      setYoutubeConnected(false);
      setYoutubeChannelName(null);
      setSyncMyChannel(false);
    } catch {
      setResult({ error: "Failed to disconnect" });
    }
  }

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

  function canSync(): boolean {
    if (syncSource === "mock") return selectedChannelIds.size > 0;
    return syncMyChannel || getChannelIdsToSync().length > 0;
  }

  async function handleSync() {
    if (!canSync()) {
      setResult({
        error:
          syncSource === "real"
            ? "Connect your YouTube account or enter a channel ID"
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
          channelIds: getChannelIdsToSync(),
          syncConnectedChannel: syncMyChannel,
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
        channelDetails: data.channelDetails,
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
          ? "Connect your YouTube account to sync all videos (including unlisted). Or enter a channel ID to sync other channels."
          : "Using mock YouTube data. Set YOUTUBE_API_KEY in .env to sync from real YouTube."}
      </p>

      {syncSource === "real" && (
        <div className="mb-6 rounded border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-medium text-slate-800">
            Your YouTube account
          </h3>
          {youtubeConnected ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-700">
                Connected as <strong>{youtubeChannelName ?? "Your channel"}</strong>
              </span>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-sm text-slate-500 hover:text-red-600 hover:underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/youtube/connect"
              className="inline-flex items-center gap-2 rounded bg-[#ff0000] px-4 py-2 text-sm font-medium text-white hover:bg-[#cc0000]"
            >
              Connect YouTube
            </a>
          )}
        </div>
      )}

      <div className="mb-6 rounded border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-slate-800">
          {syncSource === "real"
            ? "Channel ID or @handle (comma-separated)"
            : "Select channels to sync"}
        </h3>
        {syncSource === "real" ? (
          <div className="space-y-3">
            {youtubeConnected && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={syncMyChannel}
                  onChange={(e) => setSyncMyChannel(e.target.checked)}
                />
                <span className="font-medium">
                  Sync my channel ({youtubeChannelName})
                </span>
                <span className="text-sm text-slate-500">
                  — includes unlisted videos
                </span>
              </label>
            )}
            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Or enter another channel ID or @handle
              </label>
              <input
                type="text"
                value={customChannelId}
                onChange={(e) => setCustomChannelId(e.target.value)}
                placeholder="@ChannelName or UC_x5XG1OV2P6uZZ5FSM9Ttw"
                className="mb-2 w-full rounded border border-slate-300 px-3 py-2"
              />
              <p className="text-sm text-slate-500">
                For other channels, the API only returns public videos.
              </p>
            </div>
          </div>
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
        disabled={syncing || !canSync()}
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
            <div className="space-y-2">
              <p>
                Sync complete. Imported {result.imported?.videos ?? 0} new
                videos and {result.imported?.playlists ?? 0} playlists.
              </p>
              {result.channelDetails && result.channelDetails.length > 0 && (
                <>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {result.channelDetails.map((ch, i) => (
                      <li key={i}>
                        <strong>{ch.name}</strong>: {ch.totalVideos} videos
                        ({ch.newVideos} new)
                        {ch.reportedVideoCount != null &&
                          ch.reportedVideoCount !== ch.totalVideos &&
                          ` — YouTube reports ${ch.reportedVideoCount} videos`}
                      </li>
                    ))}
                  </ul>
                  {result.channelDetails.some(
                    (ch) =>
                      ch.reportedVideoCount != null &&
                      ch.reportedVideoCount > ch.totalVideos + 5
                  ) && (
                    <p className="mt-2 text-sm text-amber-700">
                      Fewer videos than expected? If you use @handle, try your
                      channel ID from{" "}
                      <a
                        href="https://www.youtube.com/account_advanced"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        account settings
                      </a>{" "}
                      instead — @handle can resolve to a different channel for
                      artists.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
