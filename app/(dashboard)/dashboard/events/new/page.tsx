"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Video {
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

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/videos?limit=500")
      .then((r) => r.json())
      .then((d) => setAllVideos(d.videos));
  }, []);

  const totalDuration = videos.reduce(
    (sum, v) => sum + (v.duration || 0),
    0
  );

  async function checkUsage(videoId: string): Promise<boolean> {
    const res = await fetch(`/api/videos/usage-check?videoId=${videoId}`);
    const data = await res.json();
    return data.usedRecently === true;
  }

  function addVideo(v: Video) {
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
      setVideos((prev) => [...prev, v]);
    });
  }

  function removeVideo(videoId: string) {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  }

  function handleReorder(newVideos: Video[]) {
    setVideos(newVideos);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(
    e: React.DragEvent,
    index: number
  ) {
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
    setDraggedIndex(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          eventDate: new Date(eventDate).toISOString(),
          notes: notes.trim() || null,
          videoIds: videos.map((v) => v.id),
        }),
      });
      if (!res.ok) {
        let message = "Failed to save";
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data?.error) message = data.error;
          } catch {
            if (text) message = text.slice(0, 200);
          }
        } catch {
          /* use default message */
        }
        alert(message);
        return;
      }
      router.push("/dashboard/events");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const filteredAll = allVideos.filter(
    (v) =>
      !videos.some((ev) => ev.id === v.id) &&
      (!search || v.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        New Event (Setlist)
      </h1>

      {usageWarning && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
          {usageWarning}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Event name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Event date *</label>
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
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">
              Setlist ({videos.length} videos · {formatDuration(totalDuration)})
            </h3>
            <p className="mb-2 text-xs text-slate-500">
              Drag to reorder. Add videos from the right.
            </p>
            <ul className="space-y-1 rounded border border-slate-200 bg-white p-2">
              {videos.map((v, idx) => (
                <li
                  key={v.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex cursor-grab items-center justify-between rounded px-2 py-1.5 ${
                    draggedIndex === idx ? "bg-blue-100 opacity-50" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">
                    {idx + 1}. {v.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVideo(v.id)}
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-slate-200 bg-white p-2">
              {filteredAll.slice(0, 50).map((v) => (
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Event"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
