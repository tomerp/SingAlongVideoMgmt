# Implementation Plan: Item 8 – Sorting Enhancements

*Source: Round1ReviewResults.md, P1 Item 8*

---

## Requirements

1. **Add sorting by Singer** in the videos table
2. **Ensure Hebrew-aware, case-insensitive sorting everywhere**
3. **Alphabetical ordering for:** Tags within categories, Holidays, Singers, Genres

---

## Current State

| Area | Current Behavior |
|------|------------------|
| Videos list | `sortByHebrew` used for title only (client-side). Other sorts (viewCount, usedCount, etc.) via API/Prisma. |
| Genres API | `orderBy: { name: "asc" }` – DB collation, not Hebrew-aware |
| Singers API | `orderBy: { name: "asc" }` – same |
| Holidays API | `orderBy: { name: "asc" }` – same |
| Tag-categories API | Categories `orderBy: { name: "asc" }`, tags `orderBy: { name: "asc" }` – same |
| Excel export | `orderBy: { title: "asc" }` – DB collation |

---

## Implementation Plan

### 1. Add Sort by Singer (Videos)

**Approach:** Client-side sort (like title) – Prisma cannot easily `orderBy` on a relation's field.

**Files:** `app/(dashboard)/dashboard/videos/page.tsx`, `app/api/videos/route.ts`

- When `sort=singer`: API returns with default orderBy (title); client applies `sortByHebrew` using primary singer name (alphabetically-first singer, or "\uFFFF" for no singers).
- Add "By Singer A-Z" and "By Singer Z-A" options to sort dropdown.
- Sort key: names sorted by Hebrew, joined – or use first singer when sorted. Use `"\uFFFF"` for videos with no singers (puts them last).

### 2. Hebrew-Aware Sort in APIs

**Approach:** Fetch from Prisma, then apply `sortByHebrew` before returning.

**Files:**
- `app/api/genres/route.ts` – sort genres by name
- `app/api/singers/route.ts` – sort singers by name (both search and list)
- `app/api/holidays/route.ts` – sort holidays by name
- `app/api/tag-categories/route.ts` – sort categories by name, and tags within each category by name

### 3. Excel Export

**File:** `app/api/export/videos/route.ts` – after fetching, apply `sortByHebrew` to videos by title before passing to `exportVideosToExcel`.

### 4. Other Consumers

- VideoForm, Setup, Events page – all consume these APIs, so they get Hebrew-sorted data automatically.
- SingerAutocomplete – uses `/api/singers?q=`, will get Hebrew-sorted results.

---

## File Change Summary

| File | Changes |
|------|---------|
| `app/(dashboard)/dashboard/videos/page.tsx` | Add singer sort options; client-side sort when `sort=singer` using Hebrew-aware key |
| `app/api/videos/route.ts` | When `sort=singer`, use default orderBy (API returns unsorted-by-singer; client sorts) – or skip, client handles |
| `app/api/genres/route.ts` | Apply `sortByHebrew` to results |
| `app/api/singers/route.ts` | Apply `sortByHebrew` to results |
| `app/api/holidays/route.ts` | Apply `sortByHebrew` to results |
| `app/api/tag-categories/route.ts` | Apply `sortByHebrew` to categories and to tags within each |
| `app/api/export/videos/route.ts` | Apply `sortByHebrew` to videos by title before export |
| `lib/hebrew-sort.ts` | No changes (already case-insensitive via `sensitivity: "base"`) |

---

## Singer Sort Key Logic

For a video with singers A, B, C: use the alphabetically-first name (by Hebrew order) as the sort key. For no singers: use `"\uFFFF"` to place at end.

```ts
const getSingerSortKey = (v: Video) => {
  const names = v.singers?.map((s) => s.singer?.name).filter(Boolean) ?? [];
  if (!names.length) return "\uFFFF";
  const sorted = [...names].sort((a, b) => sortHebrew(a, b));
  return sorted[0];
};
```
