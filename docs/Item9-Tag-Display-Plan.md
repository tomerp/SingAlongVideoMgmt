# Implementation Plan: Item 9 – Improve Tag Display Clarity

*Source: Round1ReviewResults.md, P1 Item 9*

---

## Problem

Tags show values without category context (e.g. "Fast", "Medium") – user cannot tell which category a tag belongs to when seeing it in isolation.

---

## Required Behavior

- Display category label next to tags.
- Example format: **Speed: Fast**, **Speed: Medium**
- Maintain alphabetical ordering (already done in Item 8).

---

## Current Tag Display Locations

| Location | Current | Has category? |
|----------|---------|---------------|
| VideoForm – tag checkboxes | `Fast (Speed)` | Yes, in parens |
| Videos page – tag filter | `Fast` | No |
| Setup – Tags tab | `Fast` (under category header) | Implicit from parent |
| Excel export – tags column | `Fast, Medium` | No |

---

## Target Format

**Category: Tag** (e.g. "Speed: Fast", "Speed: Medium")

---

## Implementation Plan

### 1. VideoForm.tsx

- `allTags` comes from `tagCategories.flatMap((c) => c.tags)` – tags don't have category name.
- Add `categoryName` when building the flat list: `c.tags.map((t) => ({ ...t, categoryName: c.name }))`
- Display: `{t.categoryName ? `${t.categoryName}: ` : ""}${t.name}`

### 2. Videos page (advanced filters)

- `allTags` already has `categoryName`: `c.tags.map((t) => ({ ...t, categoryName: c.name }))`
- Change display from `{t.name}` to `{t.categoryName ? `${t.categoryName}: ` : ""}${t.name}`

### 3. Setup page – Tags tab

- Each tag is under `cat.tags` – category is `cat.name`
- Change display from `{tag.name}` to `{cat.name}: {tag.name}`

### 4. Excel export

- Videos include `tags: { include: { tag: { include: { tagCategory: true } } } }`
- Change from `t.tag?.name` to `t.tag?.tagCategory ? `${t.tag.tagCategory.name}: ${t.tag.name}` : t.tag?.name`

---

## File Change Summary

| File | Change |
|------|--------|
| `components/VideoForm.tsx` | Build allTags with categoryName; display "Category: Tag" |
| `app/(dashboard)/dashboard/videos/page.tsx` | Display "Category: Tag" in tag filter (allTags already has categoryName) |
| `app/(dashboard)/dashboard/setup/page.tsx` | Display "cat.name: tag.name" for each tag |
| `lib/excel-export.ts` | Tags column: "Category: Tag" format |
