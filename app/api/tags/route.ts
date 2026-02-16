import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { name, tagCategoryId } = await request.json();
  if (!name?.trim() || !tagCategoryId) {
    return NextResponse.json(
      { error: "Name and tagCategoryId are required" },
      { status: 400 }
    );
  }
  try {
    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        tagCategoryId,
      },
    });
    return NextResponse.json(tag);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Tag with this name already exists in this category" },
          { status: 409 }
        );
      }
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "Tag category not found" },
          { status: 400 }
        );
      }
    }
    throw e;
  }
}
