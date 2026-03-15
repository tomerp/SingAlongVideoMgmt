import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/reset
 * Deletes all application data. Use with caution.
 * Order respects foreign key constraints and cascades.
 */
export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.video.deleteMany({});
      await tx.playlist.deleteMany({});
      await tx.event.deleteMany({});
      await tx.genre.deleteMany({});
      await tx.singer.deleteMany({});
      await tx.holiday.deleteMany({});
      await tx.tag.deleteMany({});
      await tx.tagCategory.deleteMany({});
      await tx.setting.deleteMany({});
      await tx.youTubeConnection.deleteMany({});
      await tx.youTubeChannel.deleteMany({});
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset failed:", err);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
