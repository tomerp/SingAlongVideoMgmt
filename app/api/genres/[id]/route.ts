import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name } = await _request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  try {
    const genre = await prisma.genre.update({
      where: { id },
      data: { name: name.trim() },
    });
    return NextResponse.json(genre);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Genre with this name already exists" },
          { status: 409 }
        );
      }
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Genre not found" }, { status: 404 });
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
  const count = await prisma.video.count({ where: { genreId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} video(s) use this genre. Remove or reassign them first.` },
      { status: 400 }
    );
  }
  try {
    await prisma.genre.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }
    throw e;
  }
}
