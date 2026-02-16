import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sortByHebrew } from "@/lib/hebrew-sort";

export async function GET() {
  const holidays = await prisma.holiday.findMany();
  const sorted = sortByHebrew(holidays, (h) => h.name);
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
    const holiday = await prisma.holiday.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(holiday);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Holiday with this name already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
