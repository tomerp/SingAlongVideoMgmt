import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sortByHebrew } from "@/lib/hebrew-sort";

export async function GET() {
  const categories = await prisma.tagCategory.findMany({
    include: { tags: true },
  });
  const sortedCategories = sortByHebrew(categories, (c) => c.name);
  const result = sortedCategories.map((c) => ({
    ...c,
    tags: sortByHebrew(c.tags, (t) => t.name),
  }));
  return NextResponse.json(result);
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
    const category = await prisma.tagCategory.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(category);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
