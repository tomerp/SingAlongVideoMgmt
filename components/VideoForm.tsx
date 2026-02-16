"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SingerAutocomplete } from "./SingerAutocomplete";

interface Genre {
  id: string;
  name: string;
}

interface Holiday {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  tagCategoryId: string;
  tagCategory?: { name: string };
}

interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

interface VideoFormProps {
  video?: {
    id: string;
    sourceType?: string;
    title: string;
    description?: string | null;
    duration?: number | null;
    url?: string | null;
    filePath?: string | null;
    language?: string | null;
    tempo?: string | null;
    qualityScore?: number | null;
    genreId: string;
    copyright?: boolean;
    notes?: string | null;
    active?: boolean;
    singers?: { singerId: string; singer?: { id: string; name: string } }[];
    holidays?: { holidayId: string }[];
    tags?: { tagId: string }[];
  };
}

export function VideoForm({ video }: VideoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);

  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [duration, setDuration] = useState(
    video?.duration != null ? String(video.duration) : ""
  );
  const [url, setUrl] = useState(video?.url || "");
  const [filePath, setFilePath] = useState(video?.filePath || "");
  const [language, setLanguage] = useState(video?.language || "");
  const [tempo, setTempo] = useState(video?.tempo || "");
  const [qualityScore, setQualityScore] = useState(
    video?.qualityScore != null ? String(video.qualityScore) : ""
  );
  const [genreId, setGenreId] = useState(video?.genreId || "");
  const [copyright, setCopyright] = useState(video?.copyright ?? false);
  const [notes, setNotes] = useState(video?.notes || "");
  const [active, setActive] = useState(video?.active ?? true);
  const [singerIds, setSingerIds] = useState<string[]>(
    video?.singers?.map((s) => s.singerId) || []
  );
  const [holidayIds, setHolidayIds] = useState<string[]>(
    video?.holidays?.map((h) => h.holidayId) || []
  );
  const [tagIds, setTagIds] = useState<string[]>(
    video?.tags?.map((t) => t.tagId) || []
  );

  useEffect(() => {
    fetch("/api/genres").then((r) => r.json()).then(setGenres);
    fetch("/api/holidays").then((r) => r.json()).then(setHolidays);
    fetch("/api/tag-categories").then((r) => r.json()).then(setTagCategories);
  }, []);

  useEffect(() => {
    if (genres.length && !genreId && video?.genreId) setGenreId(video.genreId);
    else if (genres.length && !genreId) setGenreId(genres[0]?.id || "");
  }, [genres, genreId, video?.genreId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const baseBody = {
        filePath: filePath.trim() || null,
        language: language.trim() || null,
        tempo: tempo.trim() || null,
        qualityScore: qualityScore ? parseInt(qualityScore, 10) : null,
        genreId,
        copyright,
        notes: notes.trim() || null,
        active,
        singerIds,
        holidayIds,
        tagIds,
      };
      const body = isFromYouTube
        ? baseBody
        : {
            ...baseBody,
            title: title.trim(),
            description: description.trim() || null,
            duration: duration ? parseInt(duration, 10) : null,
            url: url.trim() || null,
          };
      const url_ = video
        ? `/api/videos/${video.id}`
        : "/api/videos";
      const method = video ? "PATCH" : "POST";
      const res = await fetch(url_, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      router.push("/dashboard/videos");
      router.refresh();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  function toggleMulti(id: string, arr: string[], setArr: (a: string[]) => void) {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id));
    else setArr([...arr, id]);
  }

  const allTags = tagCategories.flatMap((c) => c.tags);
  const isFromYouTube = video?.sourceType === "YOUTUBE";

  const readOnlyInputClass =
    "w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 cursor-not-allowed";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <p className="text-red-600">{error}</p>}

      {isFromYouTube ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-600">
            Data from YouTube
          </h2>
          <p className="text-xs text-slate-500">
            Synced from YouTube. Changes will be overwritten on next sync.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Title *
            </label>
            <input
              type="text"
              value={title}
              readOnly
              required
              className={readOnlyInputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Description
            </label>
            <textarea
              value={description}
              readOnly
              rows={3}
              className={readOnlyInputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                readOnly
                min={0}
                className={readOnlyInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                URL
              </label>
              <input type="text" value={url || ""} readOnly className={readOnlyInputClass} />
            </div>
          </div>
        </section>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={0}
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Genre *</label>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                required
                className="w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="">Select...</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
        </>
      )}

      <section className={isFromYouTube ? "space-y-4 rounded-lg border border-slate-200 p-4" : "space-y-4"}>
        {isFromYouTube && (
          <>
            <h2 className="text-sm font-semibold text-slate-800">Local Data</h2>
            <p className="text-xs text-slate-500">
              These fields are managed locally and can be edited.
            </p>
          </>
        )}
        {isFromYouTube ? (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Genre *</label>
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                required
                className="w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="">Select...</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium">File path (for local)</label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tempo</label>
          <input
            type="text"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Quality (1-10)</label>
        <input
          type="number"
          value={qualityScore}
          onChange={(e) => setQualityScore(e.target.value)}
          min={1}
          max={10}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Singers</label>
        <SingerAutocomplete
          value={singerIds}
          onChange={setSingerIds}
          initialSingers={video?.singers
            ?.filter((s) => s.singer)
            .map((s) => ({ id: s.singerId, name: s.singer!.name })) ?? []}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Holidays</label>
        <div className="flex flex-wrap gap-2">
          {holidays.map((h) => (
            <label key={h.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={holidayIds.includes(h.id)}
                onChange={() => toggleMulti(h.id, holidayIds, setHolidayIds)}
              />
              <span className="text-sm">{h.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <label key={t.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tagIds.includes(t.id)}
                onChange={() => toggleMulti(t.id, tagIds, setTagIds)}
              />
              <span className="text-sm">
                {t.name}
                {t.tagCategory ? ` (${t.tagCategory.name})` : ""}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={copyright}
            onChange={(e) => setCopyright(e.target.checked)}
          />
          <span className="text-sm">Copyright</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="text-sm">Active</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      </section>
    </form>
  );
}
