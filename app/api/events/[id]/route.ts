import type { Prisma } from "@prisma/client";
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
    const removed = prevVideoIds.filter((vid) => !newVideoIds.includes(vid));
    const date = updateData.eventDate || event.eventDate;

    const updates: Prisma.PrismaPromise<unknown>[] = [];
    if (added.length) {
      updates.push(
        ...added.map((videoId: string) =>
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
    if (removed.length) {
      updates.push(
        ...removed.map((videoId: string) =>
          prisma.video.update({
            where: { id: videoId },
            data: { usedCount: { decrement: 1 } },
          })
        )
      );
    }
    if (updates.length) {
      await prisma.$transaction(updates);
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
  const eventVideos = await prisma.eventVideo.findMany({
    where: { eventId: id },
    select: { videoId: true },
  });
  const videoIds = eventVideos.map((ev) => ev.videoId);

  await prisma.event.delete({ where: { id } });

  if (videoIds.length) {
    await prisma.$transaction(
      videoIds.map((videoId: string) =>
        prisma.video.update({
          where: { id: videoId },
          data: { usedCount: { decrement: 1 } },
        })
      )
    );
  }
  return NextResponse.json({ success: true });
}
