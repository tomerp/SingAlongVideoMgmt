import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exportVideosToExcel } from "@/lib/excel-export";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get("genreId");
  const q = searchParams.get("q");
  const language = searchParams.get("language");
  const qualityMin = searchParams.get("qualityMin");
  const qualityMax = searchParams.get("qualityMax");
  const active = searchParams.get("active");
  const singerIds = searchParams.get("singerIds")?.split(",").filter(Boolean);
  const holidayIds = searchParams.get("holidayIds")?.split(",").filter(Boolean);
  const tagIds = searchParams.get("tagIds")?.split(",").filter(Boolean);
  const limit = 5000;

  const where: Prisma.VideoWhereInput = {};
  const andParts: Prisma.VideoWhereInput[] = [];

  if (genreId) where.genreId = genreId;
  if (q?.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } },
    ];
  }
  if (language) where.language = { contains: language, mode: "insensitive" };
  if (active === "true" || active === "false")
    where.active = active === "true";
  const qs: Prisma.IntNullableFilter = {};
  if (qualityMin != null && qualityMin !== "") qs.gte = parseInt(qualityMin, 10);
  if (qualityMax != null && qualityMax !== "") qs.lte = parseInt(qualityMax, 10);
  if (Object.keys(qs).length) where.qualityScore = qs;
  if (singerIds?.length) andParts.push(...singerIds.map((sid) => ({ singers: { some: { singerId: sid } } })));
  if (holidayIds?.length) andParts.push(...holidayIds.map((hid) => ({ holidays: { some: { holidayId: hid } } })));
  if (tagIds?.length) andParts.push(...tagIds.map((tid) => ({ tags: { some: { tagId: tid } } })));
  if (andParts.length) where.AND = andParts;

  const videos = await prisma.video.findMany({
    where,
    take: limit,
    orderBy: { title: "asc" },
    include: {
      genre: true,
      singers: { include: { singer: true } },
      holidays: { include: { holiday: true } },
      tags: { include: { tag: true } },
    },
  });

  const buffer = await exportVideosToExcel(videos);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="videos-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
