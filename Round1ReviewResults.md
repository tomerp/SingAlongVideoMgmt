# SingAlong Video Management System
## Post-Review Enhancement Plan (After Demo Meeting)

This document captures all requested changes and enhancements identified during the first product review session with Efraim and Sam.

The items are grouped by priority:

- 🔴 P0 – Must Fix (Phase 1 completion requirements)
- 🟡 P1 – Phase 1 Refinements
- 🟢 P2 – Phase 2 Candidates (Nice to Have)

---

# 🔴 P0 – MUST FIX (Phase 1 Completion)

These are required before Phase 1 is considered complete.

---

## 1. Visual Separation: YouTube vs Local Fields

### Problem
Users cannot distinguish between:
- Fields imported from YouTube (read-only)
- Fields managed locally (editable)

### Required Behavior
- Clearly differentiate YouTube-sourced fields visually.
- YouTube fields must be non-editable.
- Local fields must remain editable.
- Possible approaches:
  - Separate UI sections
  - Color differentiation
  - “YouTube Data” vs “Local Data” grouping

### Acceptance Criteria
- User can immediately identify which fields are synced from YouTube.
- Attempting to edit a YouTube field is blocked.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 2. Simplify Singer Assignment UX

### Problem
Current model requires:
- Pre-creating singers
- Selecting from a potentially very large list (e.g., 2,000+ entries)

This is too cumbersome.

### Required Behavior
Replace rigid checkbox selection with:

- Autocomplete input field
- Free typing allowed
- If typed value does not exist → automatically create new Singer
- Preserve many-to-many structure internally

### Acceptance Criteria
- User can type singer name directly inside Video screen.
- Existing singers appear as suggestions.
- New names auto-create entries.
- Duplicate prevention remains intact.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 3. Improve Event Creation Workflow

### Problem
Advanced filtering is not available inside Event Builder.
Filtering logic is duplicated.

### Required Behavior
Preferred design:

- User filters videos in Videos tab.
- User selects multiple videos.
- User clicks “Create Event from Selection”.
- Event is created and editable afterward.

Event screen must still support:
- Adding additional songs
- Removing songs
- Reordering songs

### Acceptance Criteria
- Advanced filters do not need duplication in Event screen.
- Event editing fully supported after creation.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 4. Enable Editing Existing Events

### Problem
Events cannot be fully edited after creation.

### Required Behavior
- Add ability to:
  - Add songs
  - Remove songs
  - Reorder songs
  - Edit notes
  - Edit event name/date

### Acceptance Criteria
- Event editing behaves identically to event creation.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 5. Show Associated Events in Video Detail

### Problem
From Video detail screen, user cannot see:
- Which events used this video.

### Required Behavior
- Display list of associated Events.
- Support multiple events.
- Clickable links to navigate to Event.

### Acceptance Criteria
- Video screen shows all linked events.
- List updates automatically after event changes.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 6. Tag Categories and Tags Must Be Editable

### Problem
Currently tags and categories can only be deleted and re-created.

### Required Behavior
- Allow editing Tag Category name.
- Allow editing Tag name.
- Changes must propagate to all linked videos.
- Maintain referential integrity (ID-based linking).

### Acceptance Criteria
- Editing tag names updates all references.
- No data corruption occurs.

**Implemented** (see Round1ReviewResultsPlan.md)

---

## 7. Add View Count from YouTube Sync

### Problem
View count is not currently stored or displayed.

### Required Behavior
- Store view count during YouTube sync.
- Display in Video table.
- Enable sorting by View Count.

### Acceptance Criteria
- View count visible in UI.
- Sorting by “Most Viewed” works correctly.

---

# 🟡 P1 – Phase 1 Refinements

---

## 8. Sorting Enhancements

### Required Behavior
- Add sorting by Singer.
- Ensure Hebrew-aware, case-insensitive sorting everywhere.
- Alphabetical ordering for:
  - Tags within categories
  - Holidays
  - Singers
  - Genres

---

## 9. Improve Tag Display Clarity

### Problem
Tags show values without category context.

### Required Behavior
- Display category label next to tags.
  Example:
  Speed: Fast
  Speed: Medium
- Maintain alphabetical ordering.

---

## 10. Recently Published Logic

### Required Behavior
- Recently Published = within last 60 days.
- Optionally configurable in Setup.

---

## 11. Excel Export Performance

### Observation
Export is slightly slow.

### Improvement
- Optimize generation performance.
- Show loading indicator during export.

---

# 🟢 P2 – PHASE 2 CANDIDATES

---

## 12. Sorting by Singer in List View

Consider adding Singer column and sorting capability.

---

## 13. Optional Filtering Improvements

Potential future:
- Filter by View Count range.
- Filter by Copyright flag.

---

# Architectural Notes for Planner

1. Preserve many-to-many relationships.
2. Maintain unique video enforcement.
3. Ensure referential integrity when editing tags.
4. Keep filtering performance sub-second.
5. Avoid duplication of filtering logic across screens.

---

# End of Document