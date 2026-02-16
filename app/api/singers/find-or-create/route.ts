import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  const trimmed = name?.trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.singer.findFirst({
    where: {
      name: { equals: trimmed, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  try {
    const singer = await prisma.singer.create({
      data: { name: trimmed },
    });
    return NextResponse.json(singer);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      const race = await prisma.singer.findFirst({
        where: { name: { equals: trimmed, mode: "insensitive" } },
      });
      if (race) return NextResponse.json(race);
    }
    throw e;
  }
}
