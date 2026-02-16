import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
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
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, eventDate, notes, videoIds } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }
    const date = eventDate ? new Date(eventDate) : new Date();
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid event date" },
        { status: 400 }
      );
    }

    const videoList = (videoIds as string[]) || [];
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        eventDate: date,
        notes: notes?.trim() || null,
        eventVideos: {
          create: videoList.map((videoId: string, idx: number) => ({
            videoId,
            order: idx,
          })),
        },
      },
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

    if (videoList.length) {
      await prisma.$transaction(
        videoList.map((videoId: string) =>
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

    const withUpdated = await prisma.event.findUnique({
      where: { id: event.id },
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

    return NextResponse.json(withUpdated || event);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
