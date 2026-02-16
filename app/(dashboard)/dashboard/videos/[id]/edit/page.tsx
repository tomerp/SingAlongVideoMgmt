import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { VideoForm } from "@/components/VideoForm";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      genre: true,
      singers: { include: { singer: true } },
      holidays: { include: { holiday: true } },
      tags: { include: { tag: { include: { tagCategory: true } } } },
      eventVideos: { include: { event: true } },
    },
  });
  if (!video) notFound();

  const associatedEvents = video.eventVideos.map((ev) => ev.event);

  const formVideo = {
    ...video,
    singers: video.singers.map((s) => ({
      singerId: s.singerId,
      singer: s.singer ? { id: s.singer.id, name: s.singer.name } : undefined,
    })),
    holidays: video.holidays.map((h) => ({ holidayId: h.holidayId })),
    tags: video.tags.map((t) => ({ tagId: t.tagId })),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Edit Video
      </h1>
      <VideoForm video={formVideo} />

      <section className="mt-8 rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Used in Events
        </h2>
        {associatedEvents.length === 0 ? (
          <p className="text-sm text-slate-500">
            This video is not used in any events.
          </p>
        ) : (
          <ul className="space-y-2">
            {associatedEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {event.name}
                </Link>
                <span className="ml-2 text-sm text-slate-500">
                  {new Date(event.eventDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
