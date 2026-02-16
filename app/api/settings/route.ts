import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RECENTLY_PUBLISHED_KEY = "recentlyPublishedDays";
const DEFAULT_DAYS = 60;

export async function GET() {
  let setting = await prisma.setting.findUnique({
    where: { key: RECENTLY_PUBLISHED_KEY },
  });
  if (!setting) {
    setting = await prisma.setting.create({
      data: { key: RECENTLY_PUBLISHED_KEY, value: String(DEFAULT_DAYS) },
    });
  }
  const days = parseInt(setting.value, 10);
  return NextResponse.json({
    recentlyPublishedDays: Number.isNaN(days) || days < 1 ? DEFAULT_DAYS : days,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const days = body?.recentlyPublishedDays;
  if (days == null || typeof days !== "number") {
    return NextResponse.json(
      { error: "recentlyPublishedDays (number) is required" },
      { status: 400 }
    );
  }
  const clamped = Math.max(1, Math.min(365, Math.round(days)));
  await prisma.setting.upsert({
    where: { key: RECENTLY_PUBLISHED_KEY },
    update: { value: String(clamped) },
    create: { key: RECENTLY_PUBLISHED_KEY, value: String(clamped) },
  });
  return NextResponse.json({ recentlyPublishedDays: clamped });
}
