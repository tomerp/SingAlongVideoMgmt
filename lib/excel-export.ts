import ExcelJS from "exceljs";

type VideoWithRelations = {
  title: string;
  duration: number | null;
  genre: { name: string };
  singers: { singer: { name: string } }[];
  holidays: { holiday: { name: string } }[];
  tags: { tag: { name: string; tagCategory?: { name: string } } }[];
  language: string | null;
  tempo: string | null;
  qualityScore: number | null;
  viewCount: number;
  usedCount: number;
  lastUsedDate: Date | null;
  publishDate: Date | null;
  url: string | null;
  sourceType: string;
  copyright: boolean;
  active: boolean;
  notes: string | null;
};

type EventWithVideos = {
  notes: string | null;
  eventVideos: {
    video: VideoWithRelations;
  }[];
};

export async function exportVideosToExcel(
  videos: VideoWithRelations[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Videos", { headerRow: 1 });

  sheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Duration", key: "duration", width: 10 },
    { header: "Genre", key: "genre", width: 15 },
    { header: "Singers", key: "singers", width: 25 },
    { header: "Holidays", key: "holidays", width: 20 },
    { header: "Tags", key: "tags", width: 20 },
    { header: "Language", key: "language", width: 10 },
    { header: "Tempo", key: "tempo", width: 10 },
    { header: "Quality", key: "qualityScore", width: 10 },
    { header: "View Count", key: "viewCount", width: 12 },
    { header: "Used Count", key: "usedCount", width: 10 },
    { header: "Last Used", key: "lastUsedDate", width: 12 },
    { header: "Publish Date", key: "publishDate", width: 12 },
    { header: "URL", key: "url", width: 40 },
    { header: "Source", key: "sourceType", width: 10 },
    { header: "Copyright", key: "copyright", width: 10 },
    { header: "Active", key: "active", width: 8 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  for (const v of videos) {
    sheet.addRow({
      title: v.title,
      duration: v.duration,
      genre: v.genre?.name,
      singers: v.singers?.map((s) => s.singer?.name).join(", "),
      holidays: v.holidays?.map((h) => h.holiday?.name).join(", "),
      tags: v.tags
        ?.map((t) =>
          t.tag
            ? t.tag.tagCategory
              ? `${t.tag.tagCategory.name}: ${t.tag.name}`
              : t.tag.name
            : ""
        )
        .filter(Boolean)
        .join(", "),
      language: v.language,
      tempo: v.tempo,
      qualityScore: v.qualityScore,
      viewCount: v.viewCount,
      usedCount: v.usedCount,
      lastUsedDate: v.lastUsedDate
        ? new Date(v.lastUsedDate).toLocaleDateString()
        : "",
      publishDate: v.publishDate
        ? new Date(v.publishDate).toLocaleDateString()
        : "",
      url: v.url,
      sourceType: v.sourceType,
      copyright: v.copyright ? "Yes" : "No",
      active: v.active ? "Yes" : "No",
      notes: v.notes,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportEventSetlistToExcel(
  event: EventWithVideos,
  eventNotes?: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Setlist", { headerRow: 1 });

  // PRD column order: Order, Title, Singers, Tempo, Quality, Duration, Event Notes, URL
  sheet.columns = [
    { header: "Order", key: "order", width: 8 },
    { header: "Title", key: "title", width: 35 },
    { header: "Singers", key: "singers", width: 25 },
    { header: "Tempo", key: "tempo", width: 10 },
    { header: "Quality", key: "quality", width: 10 },
    { header: "Duration", key: "duration", width: 10 },
    { header: "Event Notes", key: "eventNotes", width: 30 },
    { header: "URL", key: "url", width: 45 },
  ];

  const notes = eventNotes ?? event.notes ?? "";

  for (let i = 0; i < event.eventVideos.length; i++) {
    const ev = event.eventVideos[i];
    const v = ev.video;
    sheet.addRow({
      order: i + 1,
      title: v.title,
      singers: v.singers?.map((s) => s.singer?.name).join(", "),
      tempo: v.tempo ?? "",
      quality: v.qualityScore ?? "",
      duration: v.duration ?? "",
      eventNotes: notes,
      url: v.url ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
