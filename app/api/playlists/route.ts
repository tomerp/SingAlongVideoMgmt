import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PlaylistType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // YOUTUBE | LOCAL | omit for all

  const where: { type?: PlaylistType } = {};
  if (type === "YOUTUBE" || type === "LOCAL") where.type = type as PlaylistType;

  const playlists = await prisma.playlist.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      videos: {
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
  return NextResponse.json(playlists);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }
  const playlist = await prisma.playlist.create({
    data: {
      name: name.trim(),
      type: PlaylistType.LOCAL,
      youtubePlaylistId: null,
    },
    include: {
      videos: {
        orderBy: { order: "asc" },
        include: { video: true },
      },
    },
  });
  return NextResponse.json(playlist);
}
