import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.tagCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      tags: { orderBy: { name: "asc" } },
    },
  });
  return NextResponse.json(categories);
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
