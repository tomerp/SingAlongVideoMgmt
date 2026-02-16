import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { videoIds } = await request.json(); // array of videoIds in new order

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist)
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.youtubePlaylistId) {
    return NextResponse.json(
      { error: "YouTube playlists are read-only" },
      { status: 400 }
    );
  }

  await prisma.playlistVideo.deleteMany({ where: { playlistId: id } });
  const creates = (videoIds as string[]).map((videoId: string, idx: number) => ({
    playlistId: id,
    videoId,
    order: idx,
  }));
  await prisma.playlistVideo.createMany({ data: creates });

  const updated = await prisma.playlist.findUnique({
    where: { id },
    include: {
      videos: {
        orderBy: { order: "asc" },
        include: { video: true },
      },
    },
  });
  return NextResponse.json(updated);
}
