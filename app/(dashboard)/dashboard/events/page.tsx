"use client";

import { useState, useEffect } from "react";
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

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString();
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-8 text-slate-500">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Events (Setlists)</h1>
        <Link
          href="/dashboard/events/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Event
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((ev) => {
          const totalDur = ev.eventVideos.reduce(
            (sum, evv) => sum + (evv.video.duration || 0),
            0
          );
          return (
            <div
              key={ev.id}
              className="rounded border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/dashboard/events/${ev.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {ev.name}
                  </Link>
                  <span className="ml-2 text-sm text-slate-500">
                    {formatDate(ev.eventDate)}
                  </span>
                </div>
                <span className="text-sm text-slate-500">
                  {ev.eventVideos.length} videos · {formatDuration(totalDur)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="rounded border border-slate-200 bg-white py-12 text-center text-slate-500">
          No events yet. Create your first setlist.
        </p>
      )}
    </div>
  );
}
