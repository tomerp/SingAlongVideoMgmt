import { notFound } from "next/navigation";
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
    },
  });
  if (!video) notFound();

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
    </div>
  );
}
