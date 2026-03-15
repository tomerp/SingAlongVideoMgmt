import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
  return NextResponse.json(video);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.video.findUnique({
    where: { id },
    select: { sourceType: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    title,
    description,
    duration,
    url,
    filePath,
    language,
    tempo,
    qualityScore,
    genreId,
    copyright,
    notes,
    active,
    singerIds,
    holidayIds,
    tagIds,
  } = body;

  const updateData: Record<string, unknown> = {};
  const isFromYouTube = existing.sourceType === "YOUTUBE";

  if (!isFromYouTube) {
    if (title !== undefined) updateData.title = title?.trim() || "";
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (duration !== undefined)
      updateData.duration = duration != null ? parseInt(String(duration), 10) : null;
    if (url !== undefined) updateData.url = url?.trim() || null;
  }
  if (filePath !== undefined) updateData.filePath = filePath?.trim() || null;
  if (language !== undefined) updateData.language = language?.trim() || null;
  if (tempo !== undefined) updateData.tempo = tempo?.trim() || null;
  if (qualityScore !== undefined)
    updateData.qualityScore =
      qualityScore != null
        ? Math.max(1, Math.min(10, parseInt(String(qualityScore), 10)))
        : null;
  if (genreId !== undefined) updateData.genreId = genreId;
  if (copyright !== undefined && !isFromYouTube)
    updateData.copyright = Boolean(copyright);
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (active !== undefined) updateData.active = Boolean(active);

  if (description !== undefined) {
    updateData.descriptionPreview = description
      ? String(description).slice(0, 150)
      : null;
  }

  try {
    const video = await prisma.video.update({
      where: { id },
      data: {
        ...updateData,
        ...(singerIds !== undefined && {
          singers: {
            deleteMany: {},
            create: (singerIds as string[]).map((singerId: string) => ({
              singerId,
            })),
          },
        }),
        ...(holidayIds !== undefined && {
          holidays: {
            deleteMany: {},
            create: (holidayIds as string[]).map((holidayId: string) => ({
              holidayId,
            })),
          },
        }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: (tagIds as string[]).map((tagId: string) => ({ tagId })),
          },
        }),
      } as never,
      include: {
        genre: true,
        singers: { include: { singer: true } },
        holidays: { include: { holiday: true } },
        tags: { include: { tag: { include: { tagCategory: true } } } },
      },
    });
    return NextResponse.json(video);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "Invalid genre or related entity" },
          { status: 400 }
        );
      }
    }
    throw e;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    select: { sourceType: true },
  });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
  if (video.sourceType !== "MANUAL") {
    return NextResponse.json(
      { error: "Only manually added videos can be deleted" },
      { status: 400 }
    );
  }
  try {
    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    throw e;
  }
}
