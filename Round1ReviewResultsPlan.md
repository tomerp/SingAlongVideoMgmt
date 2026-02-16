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

---

---

# Implementation Plan: Item 3 – Improve Event Creation Workflow

*Source: Round1ReviewResults.md, P0 Item 3*

---

## Problem Summary

- Event Builder (`/dashboard/events/new`) fetches up to 500 videos with no filter params.
- It offers only a simple title search – no genre, singers, holidays, tags, quality, etc.
- Filtering logic would need to be duplicated if we added advanced filters to Event Builder.
- Users want to filter in Videos tab (which has full filters) and create an event from the filtered selection.

---

## Current State

| Location | Behavior |
|----------|----------|
| **Videos page** (`dashboard/videos/page.tsx`) | Full advanced filters (q, genre, language, quality, active, singers, holidays, tags). Fetches via `/api/videos` with params. No row selection. |
| **Event Builder** (`dashboard/events/new/page.tsx`) | Fetches `/api/videos?limit=500` with no filters. Simple title search for "Add videos". Supports add, remove, reorder via drag. |
| **Event detail** (`dashboard/events/[id]/page.tsx`) | Read-only. No add/remove/reorder. |
| **Event PATCH API** | Already supports `name`, `eventDate`, `notes`, `videoIds`. Backend ready for full editing. |

---

## Required Behavior

1. User filters videos in Videos tab.
2. User selects multiple videos (checkboxes).
3. User clicks "Create Event from Selection".
4. Event is created and editable afterward.

Event screen must support: adding songs, removing songs, reordering songs.

**Acceptance Criteria:**
- Advanced filters do not need duplication in Event screen.
- Event editing fully supported after creation.

---

## Dependency: Item 4

"Event is created and editable afterward" and "Event screen must support add/remove/reorder" require Item 4 (Enable Editing Existing Events). The Event detail page must become an edit page. This plan assumes Item 4 will be implemented (or done in parallel). The "Create Event from Selection" flow will redirect to the event page; if Item 4 is done, that page will support editing.

---

## Implementation Plan

### 1. Add Row Selection to Videos Page

**File:** `app/(dashboard)/dashboard/videos/page.tsx`

- Add state: `selectedVideoIds: string[]` (or `Set<string>`).
- Add checkbox column (or row checkbox) to the video table.
- "Select all on page" / "Clear selection" helpers.
- Consider: selection persists across pagination? Options:
  - **A:** Selection is page-local only (simpler). User selects on current page.
  - **B:** Selection accumulates across pages (select on page 1, go to page 2, select more). More complex.
- **Recommendation:** Start with page-local selection. User can filter to get desired set on one page, then select. If result set is large, they can adjust filters.

---

### 2. "Create Event from Selection" Button

**File:** `app/(dashboard)/dashboard/videos/page.tsx`

- Show button when `selectedVideoIds.length > 0`.
- Placement: near "Add Video" / "Export Excel" in the header, or a floating action bar when selection is non-empty.
- On click: open modal or navigate.

---

### 3. Create Event Flow

**Option A – Modal then redirect**
- Modal: "Create Event" with fields: Name (required), Date (default today), Notes (optional).
- User fills and clicks "Create".
- `POST /api/events` with `name`, `eventDate`, `notes`, `videoIds: selectedVideoIds` (respecting current order from table).
- On success: redirect to `/dashboard/events/[id]` (event detail/edit).
- Clear selection.

**Option B – Quick create then edit**
- "Create Event" with default name (e.g. "Event [date]") and today's date.
- POST immediately, redirect to event edit.
- User refines name/date/notes there.

**Recommendation:** Option A – gives user control over name/date up front.

---

### 4. Preserve Video Order

- Videos page table has a sort order (title, quality, etc.). Use that order for `videoIds` when creating the event.
- Pass `videos.filter(v => selectedVideoIds.includes(v.id))` in table order to preserve order.

---

### 5. Event Edit Screen – Add Videos (No Filter Duplication)

Per "Advanced filters do not need duplication in Event screen":

- Event edit screen (Item 4) will have an "Add videos" section.
- Use a **simple search input** only: `q` (title/description search) via `/api/videos?q=...&limit=50`.
- No genre, singers, holidays, tags, quality filters in the Event screen.
- Full advanced filters stay only in Videos tab.
- When user wants to add videos that match complex criteria, they use: Videos tab → filter → select → add to event via "Create Event from Selection", or (for existing event) could add a "Add from Videos" link that opens Videos tab with a callback? Simpler: just use search for add-videos in event edit.

---

## File Change Summary

| File | Changes |
|------|---------|
| `app/(dashboard)/dashboard/videos/page.tsx` | Add `selectedVideoIds` state, checkbox column, "Create Event from Selection" button, modal for name/date/notes, POST create, redirect |
| `app/(dashboard)/dashboard/events/[id]/page.tsx` | (Item 4) Convert to edit page: add/remove/reorder, edit name/date/notes. Add simple "Add videos" search. |

---

## Acceptance Criteria Checklist

- [ ] User can filter videos in Videos tab (existing).
- [ ] User can select multiple videos (new checkboxes).
- [ ] User can click "Create Event from Selection" (new button).
- [ ] Event is created with selected videos and redirects to event page.
- [ ] Event page supports add/remove/reorder (Item 4).
- [ ] Advanced filters are not duplicated in Event screen (only simple search when adding).

---

## Edge Cases

- **Empty selection:** Button disabled or hidden when no videos selected.
- **Pagination:** Selection is page-local. User filters to narrow results if needed.
- **Order:** Use table display order for initial event setlist.
