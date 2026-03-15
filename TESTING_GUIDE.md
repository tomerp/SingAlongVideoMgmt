# SingAlong Video Management System — Testing Guide

This document provides a comprehensive manual testing guide for the SingAlong Video Management System. It is intended for testers (QA, developers, or stakeholders) who want to verify the app functions correctly.

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Authentication](#2-authentication)
3. [Dashboard & Navigation](#3-dashboard--navigation)
4. [Video Management](#4-video-management)
5. [YouTube Sync](#5-youtube-sync)
6. [Playlists](#6-playlists)
7. [Events](#7-events)
8. [Setup (Reference Data)](#8-setup-reference-data)
9. [Export](#9-export)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)

---

## 1. Prerequisites & Setup

### 1.1 Requirements

- **Node.js** 18+ 
- **PostgreSQL** 16+ (local or cloud, e.g. Neon)
- **npm** (comes with Node.js)

### 1.2 Initial Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Database setup:**
   ```bash
   # Option A: Docker
   docker compose up -d
   # Wait a few seconds for PostgreSQL to start

   # Option B: Use Neon (neon.tech) - get connection string and add to .env

   npm run db:push
   npm run db:seed
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` (PostgreSQL connection string)
   - Generate `AUTH_PASSWORD_HASH`:  
     `node -e "console.log(require('bcryptjs').hashSync('admin', 10))"`
   - Set `AUTH_SESSION_SECRET` (any random string, e.g. `openssl rand -hex 32`)
   - Optional: `YOUTUBE_API_KEY` for real YouTube sync (omit to use mock)
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for YouTube OAuth

4. **Start the app:**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000**

### 1.3 Default Credentials

- **Username:** `admin` (or value of `AUTH_USERNAME` in `.env`)
- **Password:** `admin` (if you hashed that password in step 3)

---

## 2. Authentication

### 2.1 Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000 | Login page is displayed |
| 2 | Enter valid username (e.g. `admin`) and password | Redirect to `/dashboard/videos` |
| 3 | Enter wrong username or password | Error message; stay on login page |
| 4 | Submit with empty fields | Validation prevents submit or shows error |

### 2.2 Logout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While logged in, locate logout button/link | Logout control is visible |
| 2 | Click logout | Redirect to login page |
| 3 | Try opening `/dashboard/videos` directly | Redirect to login |

### 2.3 Session & Protected Routes

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in successfully | Can access dashboard |
| 2 | Close browser tab and reopen app | Still logged in (session persists) |
| 3 | Clear cookies and visit `/dashboard/videos` | Redirect to login |

---

## 3. Dashboard & Navigation

### 3.1 Route Structure

Verify all main routes work and show expected content:

| Route | Expected Content |
|-------|------------------|
| `/` | Login page |
| `/dashboard` | Redirects to `/dashboard/videos` |
| `/dashboard/videos` | Video list with filters and search |
| `/dashboard/videos/new` | Add video form |
| `/dashboard/videos/[id]/edit` | Edit video form |
| `/dashboard/sync` | YouTube sync page |
| `/dashboard/playlists` | Playlist list |
| `/dashboard/playlists/[id]/edit` | Edit playlist |
| `/dashboard/events` | Event list |
| `/dashboard/events/new` | Create event form |
| `/dashboard/events/[id]` | View/edit event |
| `/dashboard/setup` | Setup for genres, singers, holidays, tags |

### 3.2 Navigation Links

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click each nav link | Correct page loads |
| 2 | Use browser back/forward | Navigation history works |
| 3 | Direct URL navigation | Correct page loads |

---

## 4. Video Management

### 4.1 List & Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/dashboard/videos` | Video list loads (may be empty) |
| 2 | Type in search box | Results update (or show “no results”) |
| 3 | Clear search | All videos shown again |
| 4 | Search for Hebrew text | Hebrew search works (if applicable) |

### 4.2 Filters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Filter by genre | Only videos in that genre shown |
| 2 | Filter by singer(s) | Videos with selected singer(s) |
| 3 | Filter by holiday(s) | Videos with selected holiday(s) |
| 4 | Filter by tag(s) | Videos with selected tag(s) |
| 5 | Set quality range (min/max, 1–10) | Only videos in range shown |
| 6 | Filter by duration range | Videos within duration shown |
| 7 | Filter by “Recently Published” (e.g. last 60 days) | Matching videos shown |
| 8 | Filter by “Active only” | Only active videos shown |
| 9 | Combine multiple filters | Results match all filters |
| 10 | Clear filters | Back to unfiltered list |

### 4.3 Sorting

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sort by title (asc/desc) | Order correct |
| 2 | Sort by duration | Order correct |
| 3 | Sort by quality | Order correct |
| 4 | Sort by publish date | Order correct |
| 5 | Sort by last used | Order correct |
| 6 | Sort Hebrew titles | Hebrew collation works correctly |

### 4.4 Pagination

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | If more than one page of results | Pagination controls appear |
| 2 | Go to next page | Next page loads |
| 3 | Go to previous page | Previous page loads |
| 4 | Change page size (if supported) | Page size updates |

### 4.5 Add Video

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to “Add Video” or `/dashboard/videos/new` | Form displayed |
| 2 | Fill title only | Video created if title required |
| 3 | Fill all fields: title, URL, genre, duration, quality, singers, holidays, tags, notes | Video created with all metadata |
| 4 | Submit with invalid URL | Validation error |
| 5 | Submit with missing required field | Validation error |
| 6 | Submit valid form | Redirect to video list; new video appears |

### 4.6 Edit Video

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open edit page for existing video | Form pre-filled with current data |
| 2 | Change title | Save; title updated |
| 3 | Change quality (1–10) | Save; quality updated |
| 4 | Add/remove singers | Save; changes persist |
| 5 | Add/remove holidays | Save; changes persist |
| 6 | Add/remove tags | Save; changes persist |
| 7 | Change genre | Save; genre updated |
| 8 | Toggle “Active” | Save; active state updated |

### 4.7 Delete Video

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Delete a video not in any events | Video removed; list updates |
| 2 | Delete video used in events | Confirmation or warning; behavior as designed |
| 3 | Check video list after delete | Video no longer appears |

### 4.8 Usage Tracking

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add video to an event | Video `usedCount` increments; `lastUsedDate` set |
| 2 | View video list | Usage columns show correct values |
| 3 | Filter/sort by “last used” | Order reflects usage |

---

## 5. YouTube Sync

### 5.1 Mock Mode (No API Key)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ensure no `YOUTUBE_API_KEY` (or `USE_MOCK_YOUTUBE=true`) | Sync page shows mock mode |
| 2 | Go to `/dashboard/sync` | Sync UI loads |
| 3 | Select mock channel | Channel/playlist options appear |
| 4 | Run sync | Videos imported from mock data |
| 5 | Check video list | New videos from sync appear |

### 5.2 Real Mode (With API Key)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set `YOUTUBE_API_KEY` in `.env` | Sync page shows real mode |
| 2 | Enter valid YouTube channel ID or @handle | Channel validated |
| 3 | Run sync | Videos imported from YouTube |
| 4 | Handle rate limits | Clear error or retry behavior |
| 5 | Sync private/unlisted channel | OAuth required (see 5.3) |

### 5.3 YouTube OAuth (Connect YouTube)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set | “Connect YouTube” option visible |
| 2 | Click “Connect YouTube” | Redirect to Google OAuth |
| 3 | Authorize app | Redirect back; connected status shown |
| 4 | Check connection status | Indicates connected |
| 5 | Disconnect | Connection cleared |
| 6 | Sync unlisted videos | Works when connected |

### 5.4 Sync Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid channel ID | Error message |
| 2 | Enter non-existent channel | Appropriate error |
| 3 | Sync empty channel | No videos added or clear message |

---

## 6. Playlists

### 6.1 List Playlists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/dashboard/playlists` | Playlist list loads |
| 2 | Create playlists if empty | Playlists appear in list |

### 6.2 Create Playlist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new playlist | Form or modal appears |
| 2 | Set name and type (YouTube/local) | Playlist created |
| 3 | Add videos | Videos added to playlist |

### 6.3 Edit Playlist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open playlist edit | Videos in playlist shown |
| 2 | Add videos | Videos added |
| 3 | Remove videos | Videos removed |
| 4 | Reorder videos | Order persisted |
| 5 | Save | Changes saved |

### 6.4 Delete Playlist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Delete playlist | Playlist removed |
| 2 | Confirm videos unchanged | Only playlist record deleted |

---

## 7. Events

### 7.1 List Events

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/dashboard/events` | Event list loads |
| 2 | Sort/filter if available | List updates correctly |

### 7.2 Create Event

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to “New Event” or `/dashboard/events/new` | Form displayed |
| 2 | Set name, date, notes | Event created |
| 3 | Add videos | Videos attached to event |
| 4 | Reorder videos | Order persists |

### 7.3 Create Event from Video List

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On video list, select videos | Checkboxes or selection works |
| 2 | Click “Create event from selected” (or similar) | Modal or form opens |
| 3 | Enter event name and date | Event created with selected videos |
| 4 | Open event | Videos appear in correct order |

### 7.4 View/Edit Event

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open event | Event details and video list shown |
| 2 | Edit name, date, notes | Changes saved |
| 3 | Add videos | Videos added |
| 4 | Remove videos | Videos removed |
| 5 | Reorder videos | Order saved |

### 7.5 Usage Impact

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add video to event | Video `usedCount` and `lastUsedDate` updated |
| 2 | Remove video from event | Usage may or may not change (per design) |

---

## 8. Setup (Reference Data)

### 8.1 Genres

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/dashboard/setup` | Setup page loads |
| 2 | Add genre | Genre created and appears |
| 3 | Edit genre | Name updated |
| 4 | Delete genre (unused) | Genre removed |
| 5 | Delete genre in use | Blocked or warning |

### 8.2 Singers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add singer | Singer created |
| 2 | Edit singer | Name updated |
| 3 | Delete singer | Behavior as designed (block if in use) |

### 8.3 Holidays

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add holiday | Holiday created |
| 2 | Edit/delete holiday | Works per design |

### 8.4 Tag Categories & Tags

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add tag category | Category created |
| 2 | Add tag under category | Tag created |
| 3 | Edit tag | Name updated |
| 4 | Delete tag | Removed if allowed |
| 5 | Assign tags to video | Tags appear on video |

### 8.5 Settings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View settings | Key-value settings shown |
| 2 | Update setting | Value saved |
| 3 | Reload page | New value persisted |

---

## 9. Export

### 9.1 Export Videos to Excel

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Apply filters on video list | Filters active |
| 2 | Click “Export to Excel” (or similar) | Excel file downloads |
| 3 | Open Excel file | Data matches filtered list |
| 4 | Export with no results | Appropriate message or empty file |
| 5 | Export all videos (no filter) | All videos in file |

### 9.2 Export Event to Excel

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open an event | Event details shown |
| 2 | Click export | Excel file downloads |
| 3 | Open Excel file | Event details and video list correct |

---

## 10. Edge Cases & Error Handling

### 10.1 Network & Server

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stop backend/database | User sees error, not crash |
| 2 | Simulate slow network | Loading states shown |
| 3 | Refresh during operation | No data corruption |

### 10.2 Invalid Data

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit video with negative duration | Validation error |
| 2 | Submit quality outside 1–10 | Validation error |
| 3 | Submit malformed URL | Validation error |
| 4 | Edit non-existent video ID | 404 or redirect |
| 5 | Delete already-deleted resource | Appropriate handling |

### 10.3 Concurrent Use

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit same video in two tabs | Last save wins or conflict handling |
| 2 | Delete video while another tab has it open | Graceful handling on refresh |

### 10.4 Browser & Responsiveness

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Test in Chrome, Firefox, Safari | Core flows work |
| 2 | Resize to mobile width | Layout usable or responsive |
| 3 | Use keyboard navigation | Accessible where applicable |

---

## Appendix A: Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_USERNAME` | Yes | Login username |
| `AUTH_PASSWORD_HASH` | Yes | bcrypt hash of password |
| `AUTH_SESSION_SECRET` | Production | Session cookie signing |
| `YOUTUBE_API_KEY` | Optional | Real YouTube API |
| `GOOGLE_CLIENT_ID` | Optional | YouTube OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | YouTube OAuth |
| `USE_MOCK_YOUTUBE` | Optional | Force mock mode |
| `NEXTAUTH_URL` / `APP_URL` | Production | OAuth redirect base URL |

---

## Appendix B: Quick Test Checklist

Use this as a minimal smoke test:

- [ ] Login with valid credentials
- [ ] Logout
- [ ] View video list
- [ ] Add a video
- [ ] Edit a video
- [ ] Filter videos by genre
- [ ] Create an event and add videos
- [ ] Export videos to Excel
- [ ] Add genre/singer/holiday in Setup
- [ ] (If configured) Run YouTube sync (mock or real)

---

## Appendix C: Useful Commands

```bash
# Start app
npm run dev

# Browse database
npm run db:studio

# Create DB backup
npm run db:snapshot

# Restore from backup
npm run db:restore -- backups/snapshot_YYYY-MM-DDTHH-MM-SS.sql
```

---

*Last updated: February 2025*
