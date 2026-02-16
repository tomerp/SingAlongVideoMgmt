"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => {
        if (!r.ok) router.push("/dashboard/events");
        return r.json();
      })
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id, router]);

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

  const totalDuration = event.eventVideos.reduce(
    (sum, ev) => sum + (ev.video.duration || 0),
    0
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link href="/dashboard/events" className="text-blue-600 hover:underline">
          Back to events
        </Link>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{event.name}</h1>
          <p className="text-slate-500">
            {new Date(event.eventDate).toLocaleDateString()} ·{" "}
            {event.eventVideos.length} videos · {formatDuration(totalDuration)}
          </p>
          {event.notes && (
            <p className="mt-2 text-sm text-slate-600">{event.notes}</p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/export/events/${id}`}
            className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            Export Excel
          </a>
          <button
            onClick={handleDelete}
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                Singers
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {event.eventVideos.map((ev, idx) => (
              <tr key={ev.videoId} className="border-t border-slate-100">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{ev.video.title}</td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {ev.video.singers?.map((s) => s.singer?.name).join(", ")}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatDuration(ev.video.duration)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
