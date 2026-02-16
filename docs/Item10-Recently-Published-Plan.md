# Implementation Plan: Item 10 – Recently Published Logic

*Source: Round1ReviewResults.md, P1 Item 10*

---

## Requirements

- **Recently Published** = videos with publishDate within last N days (default 60)
- **Configurable in Setup** – user can change the N-day threshold

---

## Approach

1. **Settings storage** – New `Setting` model (key-value) for `recentlyPublishedDays` (default 60)
2. **API** – GET /api/settings returns { recentlyPublishedDays }; PATCH updates it
3. **Setup** – New "Settings" tab with "Recently Published (days)" input
4. **Videos filter** – Add "Recently published" checkbox in advanced filters; when checked, send publishDateFrom = today - N days (API already supports publishDateFrom)

---

## File Changes

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add Setting model |
| `app/api/settings/route.ts` | GET returns settings; PATCH updates |
| `app/(dashboard)/dashboard/setup/page.tsx` | Add Settings tab |
| `app/(dashboard)/dashboard/videos/page.tsx` | Fetch settings; add Recently published checkbox; pass publishDateFrom when enabled |
