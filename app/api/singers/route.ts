import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const singers = await prisma.singer.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(singers);
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
