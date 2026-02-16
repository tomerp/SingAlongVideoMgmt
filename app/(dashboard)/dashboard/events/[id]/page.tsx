"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface EventVideo {
  videoId: string;
  order: number;
  video: {
    id: string;
    title: string;
    duration: number | null;
    genre: { name: string };
    singers: { singer: { name: string } }[];
    lastUsedDate: string | null;
  };
}

interface Event {
  id: string;
  name: string;
  eventDate: string;
  notes: string | null;
  eventVideos: EventVideo[];
}

interface VideoOption {
  id: string;
  title: string;
  duration: number | null;
  genre: { name: string };
  singers: { singer: { name: string } }[];
  lastUsedDate: string | null;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [eventVideos, setEventVideos] = useState<EventVideo[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [addResults, setAddResults] = useState<VideoOption[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`);
    if (!res.ok) {
      router.push("/dashboard/events");
      return;
    }
    const data = await res.json();
    setEvent(data);
    setName(data.name);
    setEventDate(data.eventDate?.slice(0, 10) || "");
    setNotes(data.notes || "");
    setEventVideos(data.eventVideos || []);
  }, [id, router]);

  useEffect(() => {
    fetchEvent().finally(() => setLoading(false));
  }, [fetchEvent]);

  useEffect(() => {
    if (!addSearch.trim()) {
      setAddResults([]);
      return;
    }
    setAddSearching(true);
    fetch(`/api/videos?q=${encodeURIComponent(addSearch)}&limit=50`)
      .then((r) => r.json())
      .then((d) => setAddResults(d.videos || []))
      .catch(() => setAddResults([]))
      .finally(() => setAddSearching(false));
  }, [addSearch]);

  async function checkUsage(videoId: string): Promise<boolean> {
    const res = await fetch(`/api/videos/usage-check?videoId=${videoId}`);
    const data = await res.json();
    return data.usedRecently === true;
  }

  function addVideo(v: VideoOption) {
    const currentIds = eventVideos.map((ev) => ev.videoId);
    if (currentIds.includes(v.id)) return;
    checkUsage(v.id).then((recent) => {
      if (recent) {
        const lastUsed = v.lastUsedDate
          ? new Date(v.lastUsedDate).toLocaleDateString()
          : "unknown";
        setUsageWarning(
          `"${v.title}" was used recently (last: ${lastUsed}). Consider varying your setlist.`
        );
        setTimeout(() => setUsageWarning(null), 5000);
      }
      setEventVideos((prev) => [
        ...prev,
        {
          videoId: v.id,
          order: prev.length,
          video: v,
        },
      ]);
    });
  }

  function removeVideo(videoId: string) {
    setEventVideos((prev) => prev.filter((ev) => ev.videoId !== videoId));
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex == null) return;
    if (draggedIndex === index) return;
    const newVideos = [...eventVideos];
    const [removed] = newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, removed);
    setEventVideos(newVideos);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          eventDate: new Date(eventDate).toISOString(),
          notes: notes.trim() || null,
          videoIds: eventVideos.map((ev) => ev.videoId),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Failed to save");
        return;
      }
      await fetchEvent();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/events");
      router.refresh();
    }
  }

  if (loading || !event) {
    return <p className="py-8 text-slate-500">Loading...</p>;
  }

  const totalDuration = eventVideos.reduce(
    (sum, ev) => sum + (ev.video?.duration || 0),
    0
  );

  const currentIds = new Set(eventVideos.map((ev) => ev.videoId));
  const availableToAdd = addResults.filter((v) => !currentIds.has(v.id));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link href="/dashboard/events" className="text-blue-600 hover:underline">
          Back to events
        </Link>
      </div>

      {usageWarning && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
          {usageWarning}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Event name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full max-w-md rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Event date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full max-w-md rounded border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/export/events/${id}`}
              className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            >
              Export Excel
            </a>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">
              Setlist ({eventVideos.length} videos ·{" "}
              {formatDuration(totalDuration)})
            </h3>
            <p className="mb-2 text-xs text-slate-500">
              Drag to reorder. Remove or add videos below.
            </p>
            <ul className="space-y-1 rounded border border-slate-200 bg-white p-2">
              {eventVideos.map((ev, idx) => (
                <li
                  key={ev.videoId}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex cursor-grab items-center justify-between rounded px-2 py-1.5 ${
                    draggedIndex === idx
                      ? "bg-blue-100 opacity-50"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">
                    {idx + 1}. {ev.video?.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVideo(ev.videoId)}
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
              placeholder="Search by title..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-slate-200 bg-white p-2">
              {addSearching && (
                <li className="py-2 text-center text-sm text-slate-500">
                  Searching...
                </li>
              )}
              {!addSearching && addSearch && availableToAdd.length === 0 && (
                <li className="py-2 text-center text-sm text-slate-500">
                  No videos found or all already in setlist.
                </li>
              )}
              {!addSearching &&
                availableToAdd.slice(0, 30).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-slate-50"
                  >
                    <span className="text-sm">{v.title}</span>
                    <button
                      type="button"
                      onClick={() => addVideo(v)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Add
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
