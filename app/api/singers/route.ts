import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sortByHebrew } from "@/lib/hebrew-sort";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (q) {
    const singers = await prisma.singer.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 20,
    });
    const sorted = sortByHebrew(singers, (s) => s.name);
    return NextResponse.json(sorted);
  }

  const singers = await prisma.singer.findMany();
  const sorted = sortByHebrew(singers, (s) => s.name);
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
    const singer = await prisma.singer.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(singer);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Singer with this name already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
