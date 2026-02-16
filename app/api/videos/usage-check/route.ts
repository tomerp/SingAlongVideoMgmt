import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function twelveMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d;
}

/**
 * Check if a video was used in the last 12 months.
 * Returns { usedRecently: boolean, lastUsedDate: string | null }.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json(
      { error: "videoId required" },
      { status: 400 }
    );
  }
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { lastUsedDate: true, usedCount: true },
  });
  if (!video)
    return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const cutoff = twelveMonthsAgo();
  const usedRecently =
    video.lastUsedDate != null && video.lastUsedDate >= cutoff;

  return NextResponse.json({
    usedRecently,
    lastUsedDate: video.lastUsedDate?.toISOString() ?? null,
    usedCount: video.usedCount,
  });
}
