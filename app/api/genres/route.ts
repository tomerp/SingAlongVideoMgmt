import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sortByHebrew } from "@/lib/hebrew-sort";

export async function GET() {
  const genres = await prisma.genre.findMany();
  const sorted = sortByHebrew(genres, (g) => g.name);
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }
  try {
    const genre = await prisma.genre.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(genre);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Genre with this name already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
