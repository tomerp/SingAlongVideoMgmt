import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SourceType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genreIds = searchParams.get("genreIds")?.split(",").filter(Boolean);
  const sort = searchParams.get("sort") || "title";
  const order = searchParams.get("order") || "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = (page - 1) * limit;
  const q = searchParams.get("q") || "";
  const language = searchParams.get("language");
  const tempo = searchParams.get("tempo");
  const qualityMin = searchParams.get("qualityMin");
  const qualityMax = searchParams.get("qualityMax");
  const durationMin = searchParams.get("durationMin");
  const durationMax = searchParams.get("durationMax");
  const usedCountMin = searchParams.get("usedCountMin");
  const usedCountMax = searchParams.get("usedCountMax");
  const active = searchParams.get("active");
  const singerIds = searchParams.get("singerIds")?.split(",").filter(Boolean);
  const holidayIds = searchParams.get("holidayIds")?.split(",").filter(Boolean);
  const tagIds = searchParams.get("tagIds")?.split(",").filter(Boolean);
  const publishDateFrom = searchParams.get("publishDateFrom");
  const publishDateTo = searchParams.get("publishDateTo");
  const lastUsedFrom = searchParams.get("lastUsedFrom");
  const lastUsedTo = searchParams.get("lastUsedTo");

  const andParts: Prisma.VideoWhereInput[] = [];
  const where: Prisma.VideoWhereInput = {};

  if (genreIds?.length)
    where.genreId = genreIds.length === 1 ? genreIds[0] : { in: genreIds };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (language) where.language = { contains: language, mode: "insensitive" };
  if (tempo) where.tempo = { contains: tempo, mode: "insensitive" };
  if (active === "true" || active === "false")
    where.active = active === "true";

  const qs: Prisma.IntNullableFilter | undefined = {};
  if (qualityMin != null && qualityMin !== "") qs.gte = parseInt(qualityMin, 10);
  if (qualityMax != null && qualityMax !== "") qs.lte = parseInt(qualityMax, 10);
  if (Object.keys(qs).length) where.qualityScore = qs;

  const dur: Prisma.IntNullableFilter | undefined = {};
  if (durationMin != null && durationMin !== "") dur.gte = parseInt(durationMin, 10);
  if (durationMax != null && durationMax !== "") dur.lte = parseInt(durationMax, 10);
  if (Object.keys(dur).length) where.duration = dur;

  const uc: Prisma.IntFilter | undefined = {};
  if (usedCountMin != null && usedCountMin !== "") uc.gte = parseInt(usedCountMin, 10);
  if (usedCountMax != null && usedCountMax !== "") uc.lte = parseInt(usedCountMax, 10);
  if (Object.keys(uc).length) where.usedCount = uc;

  const pd: Prisma.DateTimeNullableFilter | undefined = {};
  if (publishDateFrom) pd.gte = new Date(publishDateFrom);
  if (publishDateTo) pd.lte = new Date(publishDateTo);
  if (Object.keys(pd).length) where.publishDate = pd;

  const lud: Prisma.DateTimeNullableFilter | undefined = {};
  if (lastUsedFrom) lud.gte = new Date(lastUsedFrom);
  if (lastUsedTo) lud.lte = new Date(lastUsedTo);
  if (Object.keys(lud).length) where.lastUsedDate = lud;

  if (singerIds?.length)
    andParts.push(...singerIds.map((singerId) => ({ singers: { some: { singerId } } })));
  if (holidayIds?.length)
    andParts.push(...holidayIds.map((holidayId) => ({ holidays: { some: { holidayId } } })));
  if (tagIds?.length)
    andParts.push(...tagIds.map((tagId) => ({ tags: { some: { tagId } } })));

  if (andParts.length) where.AND = [...andParts];

  type Order = "asc" | "desc";
  let orderBy: Record<string, Order | { sort: Order; nulls: "first" | "last" }> = { title: (order as Order) || "asc" };
  if (sort === "title") orderBy = { title: (order as Order) || "asc" };
  else if (sort === "viewCount") orderBy = { viewCount: (order as Order) || "desc" };
  else if (sort === "lastUsedDate") orderBy = { lastUsedDate: { sort: (order as Order) || "desc", nulls: "last" } };
  else if (sort === "publishDate") orderBy = { publishDate: { sort: (order as Order) || "desc", nulls: "last" } };
  else if (sort === "qualityScore") orderBy = { qualityScore: { sort: (order as Order) || "desc", nulls: "last" } };
  else if (sort === "usedCount") orderBy = { usedCount: (order as Order) || "desc" };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        genre: true,
        singers: { include: { singer: true } },
        holidays: { include: { holiday: true } },
        tags: { include: { tag: { include: { tagCategory: true } } } },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    title,
    description,
    duration,
    url,
    filePath,
    language,
    tempo,
    qualityScore,
    genreId,
    copyright,
    notes,
    active,
    singerIds,
    holidayIds,
    tagIds,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }
  if (!genreId) {
    return NextResponse.json(
      { error: "Genre is required" },
      { status: 400 }
    );
  }

  const descPreview = description
    ? String(description).slice(0, 150)
    : null;

  try {
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        descriptionPreview: descPreview,
        duration: duration != null ? parseInt(String(duration), 10) : null,
        url: url?.trim() || null,
        filePath: filePath?.trim() || null,
        sourceType: SourceType.MANUAL,
        youtubeVideoId: null,
        language: language?.trim() || null,
        tempo: tempo?.trim() || null,
        qualityScore:
          qualityScore != null
            ? Math.max(1, Math.min(10, parseInt(String(qualityScore), 10)))
            : null,
        genreId,
        copyright: Boolean(copyright),
        notes: notes?.trim() || null,
        active: active !== false,
        singers: singerIds?.length
          ? { create: singerIds.map((singerId: string) => ({ singerId })) }
          : undefined,
        holidays: holidayIds?.length
          ? { create: holidayIds.map((holidayId: string) => ({ holidayId })) }
          : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
      include: {
        genre: true,
        singers: { include: { singer: true } },
        holidays: { include: { holiday: true } },
        tags: { include: { tag: { include: { tagCategory: true } } } },
      },
    });
    return NextResponse.json(video);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "Invalid genre or related entity" },
          { status: 400 }
        );
      }
    }
    throw e;
  }
}
