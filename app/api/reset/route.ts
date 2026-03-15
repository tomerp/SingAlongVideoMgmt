import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_GENRES = [
  "Oldies",
  "Hebrew",
  "Oriental",
  "Comedy",
  "Love",
  "War",
];

/**
 * POST /api/reset
 * Deletes all application data and restores default genres. Use with caution.
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

      for (const name of DEFAULT_GENRES) {
        await tx.genre.create({ data: { name } });
      }
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
