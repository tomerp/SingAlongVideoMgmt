import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      eventVideos: {
        orderBy: { order: "asc" },
        include: {
          video: {
            include: {
              genre: true,
              singers: { include: { singer: true } },
            },
          },
        },
      },
    },
  });
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, eventDate, notes, videoIds } = body;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const prevVideoIds = (
    await prisma.eventVideo.findMany({
      where: { eventId: id },
      select: { videoId: true },
    })
  ).map((ev) => ev.videoId);

  const updateData: { name?: string; eventDate?: Date; notes?: string | null } =
    {};
  if (name !== undefined) updateData.name = name.trim();
  if (eventDate !== undefined) {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) updateData.eventDate = d;
  }
  if (notes !== undefined) updateData.notes = notes?.trim() || null;

  if (videoIds !== undefined) {
    await prisma.eventVideo.deleteMany({ where: { eventId: id } });
    const creates = (videoIds as string[]).map((videoId: string, idx: number) => ({
      eventId: id,
      videoId,
      order: idx,
    }));
    await prisma.eventVideo.createMany({ data: creates });

    const newVideoIds = videoIds as string[];
    const added = newVideoIds.filter((vid) => !prevVideoIds.includes(vid));
    const date = updateData.eventDate || event.eventDate;

    if (added.length) {
      await prisma.$transaction(
        added.map((videoId: string) =>
          prisma.video.update({
            where: { id: videoId },
            data: {
              usedCount: { increment: 1 },
              lastUsedDate: date,
            },
          })
        )
      );
    }
  }

  const updated = await prisma.event.update({
    where: { id },
    data: updateData,
    include: {
      eventVideos: {
        orderBy: { order: "asc" },
        include: {
          video: {
            include: {
              genre: true,
              singers: { include: { singer: true } },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
