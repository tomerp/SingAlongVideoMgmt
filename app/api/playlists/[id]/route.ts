import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { id },
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
  if (!playlist)
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  return NextResponse.json(playlist);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, videoIds } = body;

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist)
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.youtubePlaylistId) {
    return NextResponse.json(
      { error: "YouTube playlists are read-only" },
      { status: 400 }
    );
  }

  const updateData: { name?: string } = {};
  if (name !== undefined) updateData.name = name.trim();

  if (videoIds !== undefined) {
    await prisma.playlistVideo.deleteMany({ where: { playlistId: id } });
    const creates = (videoIds as string[]).map((videoId: string, idx: number) => ({
      playlistId: id,
      videoId,
      order: idx,
    }));
    await prisma.playlistVideo.createMany({ data: creates });
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: updateData,
    include: {
      videos: {
        orderBy: { order: "asc" },
        include: { video: true },
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
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist)
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.type === "YOUTUBE") {
    return NextResponse.json(
      { error: "YouTube playlists cannot be deleted" },
      { status: 400 }
    );
  }
  await prisma.playlist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
