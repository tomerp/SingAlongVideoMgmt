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
