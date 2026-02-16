"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sortByHebrew } from "@/lib/hebrew-sort";

interface Singer {
  singer: { id: string; name: string };
}

interface Video {
  id: string;
  title: string;
  duration: number | null;
  genre: { id: string; name: string };
  singers: Singer[];
  sourceType: string;
  url: string | null;
  qualityScore: number | null;
  usedCount: number;
  lastUsedDate: string | null;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n: number | undefined): string {
  if (n == null || n === 0) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [genreId, setGenreId] = useState("");
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [singers, setSingers] = useState<{ id: string; name: string }[]>([]);
  const [holidays, setHolidays] = useState<{ id: string; name: string }[]>([]);
  const [tagCategories, setTagCategories] = useState<
    { id: string; name: string; tags: { id: string; name: string }[] }[]
  >([]);
  const [sort, setSort] = useState("title");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState("");
  const [qualityMin, setQualityMin] = useState("");
  const [qualityMax, setQualityMax] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [singerIds, setSingerIds] = useState<string[]>([]);
  const [holidayIds, setHolidayIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [createEventName, setCreateEventName] = useState("");
  const [createEventDate, setCreateEventDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [createEventNotes, setCreateEventNotes] = useState("");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genreId) params.set("genreId", genreId);
    if (language) params.set("language", language);
    if (qualityMin) params.set("qualityMin", qualityMin);
    if (qualityMax) params.set("qualityMax", qualityMax);
    if (activeFilter) params.set("active", activeFilter);
    if (singerIds.length) params.set("singerIds", singerIds.join(","));
    if (holidayIds.length) params.set("holidayIds", holidayIds.join(","));
    if (tagIds.length) params.set("tagIds", tagIds.join(","));
    params.set("sort", sort);
    params.set("order", order);
    params.set("page", String(page));
    const res = await fetch(`/api/videos?${params}`);
    const data = await res.json();
    let vids: Video[] = data.videos || [];
    if (sort === "title" && vids.length) {
      vids = sortByHebrew(vids, (v: Video) => v.title);
      if (order === "desc") vids = vids.reverse();
    }
    setVideos(vids);
    setTotal(data.total);
    setLoading(false);
  }, [
    q,
    genreId,
    language,
    qualityMin,
    qualityMax,
    activeFilter,
    singerIds,
    holidayIds,
    tagIds,
    sort,
    order,
    page,
  ]);

  useEffect(() => {
    fetch("/api/genres").then((r) => r.json()).then(setGenres);
    fetch("/api/singers").then((r) => r.json()).then(setSingers);
    fetch("/api/holidays").then((r) => r.json()).then(setHolidays);
    fetch("/api/tag-categories").then((r) => r.json()).then(setTagCategories);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const singerNames = (v: Video) =>
    v.singers?.map((s) => s.singer?.name).filter(Boolean).join(", ") || "";

  function toggleMulti(
    id: string,
    arr: string[],
    setArr: (a: string[]) => void
  ) {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id));
    else setArr([...arr, id]);
  }

  const allTags = tagCategories.flatMap((c) =>
    c.tags.map((t) => ({ ...t, categoryName: c.name }))
  );

  const selectedCount = selectedVideoIds.size;
  const selectedVideosOrdered = videos.filter((v) =>
    selectedVideoIds.has(v.id)
  );

  function toggleVideoSelection(id: string) {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    if (selectedCount === videos.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(videos.map((v) => v.id)));
    }
  }

  function openCreateEventModal() {
    setCreateEventName("");
    setCreateEventDate(new Date().toISOString().slice(0, 10));
    setCreateEventNotes("");
    setCreateEventModalOpen(true);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!createEventName.trim()) return;
    setCreateEventLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createEventName.trim(),
          eventDate: new Date(createEventDate).toISOString(),
          notes: createEventNotes.trim() || null,
          videoIds: selectedVideosOrdered.map((v) => v.id),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Failed to create event");
        return;
      }
      const event = await res.json();
      setCreateEventModalOpen(false);
      setSelectedVideoIds(new Set());
      router.push(`/dashboard/events/${event.id}`);
      router.refresh();
    } finally {
      setCreateEventLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Video Library</h1>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-slate-600">
                {selectedCount} selected
              </span>
              <button
                onClick={openCreateEventModal}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Create Event from Selection
              </button>
              <button
                onClick={() => setSelectedVideoIds(new Set())}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Clear
              </button>
            </>
          )}
          <a
            href={`/api/export/videos?${new URLSearchParams({
              ...(q && { q }),
              ...(genreId && { genreId }),
              ...(language && { language }),
              ...(qualityMin && { qualityMin }),
              ...(qualityMax && { qualityMax }),
              ...(activeFilter && { active: activeFilter }),
              ...(singerIds.length && { singerIds: singerIds.join(",") }),
              ...(holidayIds.length && { holidayIds: holidayIds.join(",") }),
              ...(tagIds.length && { tagIds: tagIds.join(",") }),
            }).toString()}`}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Export Excel
          </a>
          <Link
            href="/dashboard/videos/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Video
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 rounded border border-slate-200 bg-white p-4">
        <input
          type="text"
          placeholder="Search..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === "Enter" && fetchVideos()}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={genreId}
          onChange={(e) => {
            setGenreId(e.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={`${sort}-${order}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split("-") as [string, "asc" | "desc"];
            setSort(s);
            setOrder(o);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="title-asc">Title A-Z (Hebrew-aware)</option>
          <option value="title-desc">Title Z-A (Hebrew-aware)</option>
          <option value="viewCount-desc">Most Viewed</option>
          <option value="usedCount-desc">Most Used</option>
          <option value="lastUsedDate-desc">Recently Used</option>
          <option value="publishDate-desc">Recently Published</option>
          <option value="qualityScore-desc">Quality Score</option>
        </select>
        <button
          onClick={() => {
            setShowAdvanced(!showAdvanced);
            if (!showAdvanced) setPage(1);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAdvanced ? "Hide" : "Show"} advanced filters
        </button>
        <button
          onClick={() => fetchVideos()}
          className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
        >
          Apply
        </button>
      </div>

      {showAdvanced && (
        <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-2 text-sm font-medium">Advanced filters (AND)</h4>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mr-1 text-xs">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(1);
                }}
                className="rounded border px-2 py-0.5 text-sm"
              />
            </div>
            <div>
              <label className="mr-1 text-xs">Quality min</label>
              <input
                type="number"
                min={1}
                max={10}
                value={qualityMin}
                onChange={(e) => {
                  setQualityMin(e.target.value);
                  setPage(1);
                }}
                className="w-16 rounded border px-2 py-0.5 text-sm"
              />
            </div>
            <div>
              <label className="mr-1 text-xs">Quality max</label>
              <input
                type="number"
                min={1}
                max={10}
                value={qualityMax}
                onChange={(e) => {
                  setQualityMax(e.target.value);
                  setPage(1);
                }}
                className="w-16 rounded border px-2 py-0.5 text-sm"
              />
            </div>
            <div>
              <label className="mr-1 text-xs">Active</label>
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded border px-2 py-0.5 text-sm"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs">Singers (all)</label>
              <div className="max-h-24 overflow-y-auto">
                {singers.map((s) => (
                  <label key={s.id} className="mr-2 block text-xs">
                    <input
                      type="checkbox"
                      checked={singerIds.includes(s.id)}
                      onChange={() =>
                        toggleMulti(s.id, singerIds, setSingerIds)
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs">Holidays (all)</label>
              <div className="max-h-24 overflow-y-auto">
                {holidays.map((h) => (
                  <label key={h.id} className="mr-2 block text-xs">
                    <input
                      type="checkbox"
                      checked={holidayIds.includes(h.id)}
                      onChange={() =>
                        toggleMulti(h.id, holidayIds, setHolidayIds)
                      }
                    />
                    {h.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs">Tags (all)</label>
              <div className="max-h-24 overflow-y-auto">
                {allTags.map((t) => (
                  <label key={t.id} className="mr-2 block text-xs">
                    <input
                      type="checkbox"
                      checked={tagIds.includes(t.id)}
                      onChange={() => toggleMulti(t.id, tagIds, setTagIds)}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="rounded border border-slate-200 bg-white py-12 text-center text-slate-500">
          No videos found. Add your first video or sync from YouTube (mock).
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="w-10 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={
                        videos.length > 0 && selectedCount === videos.length
                      }
                      onChange={toggleSelectAllOnPage}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                    Title
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                    Views
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                    Singers
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                    Genre
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                    Quality
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                    Used
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                    Source
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="w-10 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.has(v.id)}
                        onChange={() => toggleVideoSelection(v.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/videos/${v.id}/edit`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {v.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-600">
                      {formatCount(v.viewCount)}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {singerNames(v)}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {v.genre?.name}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-600">
                      {formatDuration(v.duration)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-600">
                      {v.qualityScore ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-slate-600">
                      {v.usedCount}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {v.sourceType}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/videos/${v.id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing page {page} of {Math.ceil(total / 50)} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 50)}
                  className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {createEventModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !createEventLoading && setCreateEventModalOpen(false)}
        >
          <form
            onSubmit={handleCreateEvent}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Create Event from Selection
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              {selectedCount} video(s) will be added to the event.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Event name *
                </label>
                <input
                  type="text"
                  value={createEventName}
                  onChange={(e) => setCreateEventName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Event date *
                </label>
                <input
                  type="date"
                  value={createEventDate}
                  onChange={(e) => setCreateEventDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  value={createEventNotes}
                  onChange={(e) => setCreateEventNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateEventModalOpen(false)}
                disabled={createEventLoading}
                className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEventLoading}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {createEventLoading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
