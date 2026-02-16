# YouTube Data API v3 – Video Statistics

*Research for Item 7: Add View Count from YouTube Sync*

---

## Statistics Object

When using `videos.list` with `part=statistics`, the API returns a `statistics` object with these fields:

| Field         | Type   | Status        | Notes                                                                 |
|---------------|--------|---------------|-----------------------------------------------------------------------|
| **viewCount** | string | ✅ Available  | Total number of views. Primary viewership metric.                     |
| **likeCount** | string | ✅ Available  | Total number of likes. Engagement metric.                            |
| **commentCount** | string | ✅ Available | Total number of comments. Engagement metric.                          |
| **dislikeCount** | string | ❌ Deprecated | Removed Dec 2021. Only available to video owners via authenticated API. |
| **favoriteCount** | string | ❌ Deprecated | YouTube deprecated the "Add to favorites" feature; this is no longer meaningful. |

---

## Recommendation

Store and display for public sync:

1. **viewCount** – Already in schema and sync; add to UI display.
2. **likeCount** – Add to schema, mock, real sync, and UI.
3. **commentCount** – Add to schema, mock, real sync, and UI.

Skip: `dislikeCount`, `favoriteCount`.

---

## Current State in This Project

- **Schema:** `Video` has `viewCount` (Int, default 0). No `likeCount` or `commentCount`.
- **Sync (real):** Stores `viewCount` from `item.statistics?.viewCount`. Does not store like/comment.
- **Sync (mock):** Mock fixtures have `viewCount`. No like/comment.
- **UI:** Videos table does not display `viewCount`. Sort dropdown has "Most Viewed" (works via API).

---

## Implementation Scope

1. **Schema:** Add `likeCount` and `commentCount` (optional Int, default 0) to Video.
2. **Mock fixtures:** Add `likeCount`, `commentCount` to each video.
3. **Mock interface:** Update `MockVideo` type.
4. **Real sync:** Parse and store `likeCount`, `commentCount` from `item.statistics`.
5. **UI:** Add View Count column to videos table; optionally add Likes/Comments columns or a compact "Views / Likes" display.
