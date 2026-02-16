import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exportEventSetlistToExcel } from "@/lib/excel-export";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      eventVideos: {
        orderBy: { order: "asc" },
        include: {
          video: {
            include: {
              genre: true,
              singers: { include: { singer: true } },
              holidays: { include: { holiday: true } },
              tags: { include: { tag: true } },
            },
          },
        },
      },
    },
  });

  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const buffer = await exportEventSetlistToExcel(event);
  const safeName = event.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="setlist-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
