# Implementation Plan: Item 1 – Visual Separation: YouTube vs Local Fields

*Source: Round1ReviewResults.md, P0 Item 1*

---

## Problem Summary

Users cannot distinguish between fields imported from YouTube (read-only, overwritten on sync) and fields managed locally (editable). All fields are currently presented as editable inputs with no visual differentiation.

---

## Field Classification (from sync-service.ts)

| Category | Fields | Behavior |
|----------|--------|----------|
| **YouTube-synced** | `title`, `description`, `duration`, `url` | Overwritten on each YouTube sync. Must be read-only in UI. |
| **Local** | `filePath`, `language`, `tempo`, `qualityScore`, `genreId`, `copyright`, `notes`, `active`, `singers`, `holidays`, `tags` | Never synced from YouTube. Remain editable. |

A video is from YouTube when `sourceType === 'YOUTUBE'` (or `youtubeVideoId` is set). For MANUAL videos, all fields are editable.

---

## Implementation Plan

### 1. Data Layer – Pass YouTube Context to Form

**Files:** `app/(dashboard)/dashboard/videos/[id]/edit/page.tsx`, `components/VideoForm.tsx`

- The edit page already fetches the full video from Prisma (including `sourceType`, `youtubeVideoId`).
- Add `sourceType` (and optionally `youtubeVideoId`) to `VideoFormProps`.
- Compute `isFromYouTube = video?.sourceType === 'YOUTUBE'` (or `!!video?.youtubeVideoId`) for conditional UI.

---

### 2. UI – Visual Separation

**File:** `components/VideoForm.tsx`

**Approach:** Use **separate sections** with clear headings and distinct styling.

| Section | Heading | Fields | Styling |
|---------|---------|--------|---------|
| YouTube Data | "Data from YouTube" | title, description, duration, url | Light background (e.g. `bg-slate-50`), `readOnly` inputs, muted text, small helper text: "Synced from YouTube. Changes will be overwritten on next sync." |
| Local Data | "Local Data" | All other fields | Normal editable inputs. |

**Implementation details:**

- Wrap YouTube fields in a container when `isFromYouTube`:
  - Section heading with optional icon/badge
  - Render Title, Description, Duration, URL as `readOnly` (or disabled) with `className` to indicate read-only (e.g. `bg-slate-100 cursor-not-allowed`).
- When `!isFromYouTube` (MANUAL video): show all fields in a single flow; no section split; all editable.
- For create flow: no YouTube section (new videos are always local).

---

### 3. Backend – Block Edits to YouTube Fields

**File:** `app/api/videos/[id]/route.ts`

- Before applying updates, fetch the existing video and check `sourceType`.
- If `sourceType === 'YOUTUBE'`, **strip** `title`, `description`, `duration`, `url` from `updateData`.
- Only apply local fields when the video is from YouTube.
- Return clear error if the client mistakenly tries to update YouTube fields (optional; filtering is sufficient for UX).

---

### 4. Submit Handler – Don’t Send YouTube Field Changes

**File:** `components/VideoForm.tsx`

- When `isFromYouTube`, omit `title`, `description`, `duration`, `url` from the PATCH body.
- Alternatively, keep sending them; the API will ignore them. Prefer API enforcement as the source of truth, but omitting from the client is a nice safeguard.

---

## File Change Summary

| File | Changes |
|------|---------|
| `components/VideoForm.tsx` | Add `sourceType` to props; add `isFromYouTube`; split UI into YouTube vs Local sections; render YouTube fields read-only when `isFromYouTube`; optionally omit YouTube fields from PATCH body. |
| `app/(dashboard)/dashboard/videos/[id]/edit/page.tsx` | Ensure `sourceType` is passed to `VideoForm` (likely already via spread of `formVideo`). |
| `app/api/videos/[id]/route.ts` | Fetch existing video; if `sourceType === 'YOUTUBE'`, remove title, description, duration, url from `updateData` before `prisma.video.update`. |

---

## Acceptance Criteria Checklist

- [ ] User can immediately identify which fields are synced from YouTube (via section heading and/or styling).
- [ ] Attempting to edit a YouTube field is blocked (inputs are `readOnly` / disabled).
- [ ] Backend rejects or ignores updates to YouTube fields for YOUTUBE-sourced videos.
- [ ] Local fields remain fully editable.
- [ ] MANUAL videos (new or non-YouTube) show all fields as editable with no section split.

---

## Edge Cases

- **Create flow:** No YouTube section; all fields editable.
- **Video created via sync then edited:** YouTube section visible; only local fields editable.
- **Future: Re-sync overwrites:** Sync service already overwrites YouTube fields on re-sync; no change needed.

---

## Optional Enhancements (Post-MVP)

- Display `publishDate` and `viewCount` in the YouTube section when available (view count is planned in Item 7).
- Add a subtle “Synced from YouTube” badge near the section title.

---

---

# Implementation Plan: Item 2 – Simplify Singer Assignment UX

*Source: Round1ReviewResults.md, P0 Item 2*

---

## Problem Summary

Current model requires pre-creating singers and selecting from a potentially very large list (e.g., 2,000+ entries). Checkbox selection does not scale and is cumbersome.

---

## Current State

| Location | Behavior |
|----------|----------|
| **VideoForm** (`components/VideoForm.tsx`) | Fetches ALL singers via `GET /api/singers`, renders checkbox for each. `singerIds` state tracks selection; sent in PATCH/POST body. |
| **Videos list filter** (`dashboard/videos/page.tsx`) | Same: loads all singers, checkbox filter. |
| **Singer model** | `name` is unique – duplicate prevention at DB level (P2002 on create). |
| **API** | `POST /api/singers` creates singer; `GET /api/singers` returns all (no search). |

---

## Required Behavior

- Autocomplete input field (replace checkbox list).
- Free typing allowed.
- If typed value does not exist → automatically create new Singer.
- Preserve many-to-many structure internally (no schema change).

---

## Implementation Plan

### 1. API – Singer Search

**File:** `app/api/singers/route.ts`

- Add optional query param `q` to `GET`: `?q=...`
- When `q` is present, filter: `where: { name: { contains: q, mode: 'insensitive' } }`
- Limit results (e.g., 20) for performance: `take: 20`
- Keep full list when `q` is absent (for backward compatibility if needed).

---

### 2. API – Find-or-Create Singer

**Option A:** New route `POST /api/singers/find-or-create`

- Accepts `{ name: string }`.
- Trims and validates name.
- Looks up existing singer by exact name (case-insensitive).
- If found → return existing singer.
- If not found → create via `prisma.singer.create`, return new singer.

**Option B:** Client calls GET search for exact match, then POST if not found. More round-trips but no new endpoint.

**Recommendation:** Option A for simpler client logic.

---

### 3. UI – Singer Autocomplete Component

**File:** `components/SingerAutocomplete.tsx` (new)

**Behavior:**

- Display selected singers as removable chips/tags.
- Single text input for adding singers.
- On input (debounced ~200–300ms): `GET /api/singers?q={value}` → show dropdown with matches.
- Exclude already-selected singers from suggestions.
- On suggestion click or Enter with match: add singer to selection (by id).
- On Enter with no match (or "Create [name]"): call find-or-create API → add result to selection.
- Prevent duplicate in selection: don't add if already included.

**UX flow:**
1. User types "Avi" → dropdown shows matches.
2. User clicks one → chip added.
3. Or user types "Brand New Singer" → no match → Enter → find-or-create creates it → chip added.
4. User clicks × on chip → remove from selection.

---

### 4. Integrate into VideoForm

**File:** `components/VideoForm.tsx`

- Replace singer checkbox block with `<SingerAutocomplete value={singerIds} onChange={setSingerIds} />`.
- For initial display: need singer names for chips. Video from edit includes `singers: [{ singerId, singer?: { id, name } }]` – ensure edit page passes singer details. Or SingerAutocomplete accepts `initialSingers: { id, name }[]` for pre-selected chips.
- SingerAutocomplete manages internal `selectedSingers: { id, name }[]`; parent receives `singerIds` via `onChange`.

---

### 5. Videos List Filter (Optional)

Same checkbox problem on videos list. Can reuse SingerAutocomplete later. Out of scope for this plan.

---

## File Change Summary

| File | Changes |
|------|---------|
| `app/api/singers/route.ts` | Add `q` query param to GET (search); optionally add find-or-create to POST or new route |
| `app/api/singers/find-or-create/route.ts` | (Option A) New POST: find by name or create |
| `components/SingerAutocomplete.tsx` | New: chips + input + dropdown + debounced search + find-or-create |
| `components/VideoForm.tsx` | Replace singer checkboxes with SingerAutocomplete |
| `app/(dashboard)/dashboard/videos/[id]/edit/page.tsx` | Ensure singer names passed to form for initial chips |

---

## Acceptance Criteria Checklist

- [ ] User can type singer name directly inside Video screen.
- [ ] Existing singers appear as suggestions (dropdown).
- [ ] New names auto-create entries (find-or-create on Enter/add).
- [ ] Duplicate prevention remains intact (unique name in DB; no duplicate in selection).

---

## Edge Cases

- **Empty input:** Don't create singer with empty/whitespace name.
- **Case sensitivity:** Search and find-or-create use case-insensitive matching to avoid "John" vs "john" duplicates.
- **Hebrew/RTL:** Ensure input and dropdown work with RTL if needed.
