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
    const holiday = await prisma.holiday.update({
      where: { id },
      data: { name: name.trim() },
    });
    return NextResponse.json(holiday);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Holiday with this name already exists" },
          { status: 409 }
        );
      }
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
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
  try {
    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }
    throw e;
  }
}
