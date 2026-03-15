# SingAlong Video Management System — User Manual

A web-based application for managing a curated video library for live singalong events. Import videos from YouTube, organize them into playlists and events, and export setlists for your performances.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigation](#2-navigation)
3. [Video Library](#3-video-library)
4. [Playlists](#4-playlists)
5. [Events](#5-events)
6. [YouTube Sync](#6-youtube-sync)
7. [Setup](#7-setup)
8. [Export](#8-export)
9. [Tips and Workflows](#9-tips-and-workflows)

---

## 1. Getting Started

### Logging In

1. Open the application in your browser (e.g. `http://localhost:3000`).
2. Enter your **username** and **password**.
3. Click **Log in**.
4. You will be taken to the Video Library.

### Logging Out

Click **Logout** in the top-right corner of the navigation bar.

---

## 2. Navigation

The main navigation bar appears at the top of every page:

| Link | Purpose |
|------|---------|
| **Videos** | Browse and manage your video library |
| **Add Video** | Add a new manual video |
| **Sync** | Import videos from YouTube channels |
| **Playlists** | View and manage playlists |
| **Events** | View and manage events (performances) |
| **Setup** | Configure genres, singers, holidays, tags, and settings |

---

## 3. Video Library

The Video Library is your main catalog of all videos. You can filter, sort, export, and create events from your selection.

### Video List

The list shows:

- **Title** — Video title
- **Views** — View count (for YouTube videos)
- **Singers** — Assigned singers
- **Genre** — Assigned genre
- **Duration** — Length (M:SS format)
- **Quality** — Your quality score (1–10)
- **Used** — How many times used in events
- **Source** — YouTube or Manual
- **Channel** — YouTube channel name (for YouTube videos)
- **Actions** — Edit link

### Filters

Filters apply immediately as you change them (no Apply button).

**Basic filters:**

- **Search** — Search by title and description. Placeholder: "Search title, description..."
- **Genre** — Multi-select dropdown. Shows videos in *any* of the selected genres.
- **Sort** — Choose how to order the list:
  - Title (A–Z or Z–A)
  - Singer (A–Z or Z–A)
  - Most Viewed
  - Most Used
  - Recently Used
  - Recently Published
  - Quality Score

**Advanced filters** (click "Advanced filters" to expand):

- **Language** — Filter by language
- **Quality** — Min and max quality score (1–10)
- **Duration** — Min and max duration (in M:SS format)
- **Active** — Yes, No, or Any
- **Recently published** — Videos published within the last N days (N is set in Setup → Settings)
- **Singers** — Multi-select
- **Holidays** — Multi-select
- **Tags** — Multi-select (shown as "Category: Tag")

### Pagination

Videos are shown 50 per page. Use the pagination controls at the bottom to move between pages.

### Add Video (Manual)

1. Click **Add Video** in the navigation.
2. Fill in the form:
   - **Title** (required)
   - **Description**
   - **Duration** — Enter as M:SS (e.g. `3:45`)
   - **Genre** (required)
   - **URL** — Link to the video
   - **File path** — Local file path (if applicable)
   - **Language**, **Tempo**, **Quality** (1–10)
   - **Singers** — Use the autocomplete; click to open the list, type to filter
   - **Holidays** — Checkboxes
   - **Tags** — Checkboxes (grouped by category)
   - **Notes**, **Copyright**, **Active**
3. Click **Save**.

### Edit Video

1. Click **Edit** next to a video in the list.
2. For **YouTube videos**, some fields are read-only (title, description, duration, URL, etc.) because they come from YouTube. You can edit: genre, singers, holidays, tags, notes, quality, copyright, active.
3. For **manual videos**, all fields are editable. A **Delete** button is available to remove the video.
4. The **Used in Events** section shows which events include this video, with links to edit them.
5. Click **Save**.

### Create Event from Selection

1. Use the filters to narrow down your video list.
2. Check the boxes next to the videos you want in the event.
3. Click **Create Event from Selection**.
4. Enter the event name, date, and optional notes.
5. Click **Create**. The event is created with the selected videos in the order they appear in the list.

### Export Filtered List

1. Apply the filters you want.
2. Click **Export Excel**.
3. An Excel file (.xlsx) is downloaded with up to 5,000 videos matching your filters. Columns include: Title, Duration, Genre, Singers, Holidays, Tags, Language, Tempo, Quality, View Count, Used Count, Last Used, Publish Date, URL, Source, Copyright, Active, Notes.

---

## 4. Playlists

Playlists group videos for practice or themed sets. There are two types:

- **Local playlists** — You create and edit these. Add or remove videos, reorder them.
- **YouTube playlists** — Imported from YouTube during sync. Read-only; you cannot edit them in the app.

### Create a Local Playlist

1. Go to **Playlists**.
2. Enter a name in the "Playlist name" field.
3. Click **Create**.

### Edit a Local Playlist

1. Click **Edit** on a local playlist card.
2. **Add videos:** Use the search box to find videos, then click **Add** next to each one.
3. **Remove videos:** Click **Remove** next to a video in the setlist.
4. **Reorder:** Drag videos up or down to change the order.
5. Click **Save** when done.

### Delete a Local Playlist

1. Click **Delete** on the playlist card.
2. Confirm in the dialog. YouTube playlists cannot be deleted.

### YouTube Playlists

YouTube playlists show the channel name below the playlist title. They are synced from YouTube and cannot be edited or deleted in the app.

---

## 5. Events

Events represent performances or singalong sessions. Each event has a name, date, notes, and a **setlist** (ordered list of videos).

### Create an Event

1. Go to **Events**.
2. Click **New Event**.
3. Enter:
   - **Event name** (required)
   - **Event date** (required)
   - **Notes** (optional)
4. Build the setlist:
   - Use the search box to find videos.
   - Click **Add** to add a video to the setlist.
   - Drag videos to reorder them.
   - Click **Remove** to remove a video.
5. When adding a video that was used recently in another event, a warning appears: *"Consider varying your setlist."*
6. Click **Save** to create the event.

### Edit an Event

1. Click on an event in the Events list.
2. Edit the name, date, notes, or setlist as needed.
3. Click **Save** to save changes.

**Unsaved changes warning:** If you have unsaved changes and try to leave (e.g. by clicking another nav link or "Back to events"), a confirmation dialog appears: *"You have unsaved changes. Leave without saving?"* Choose **Cancel** to stay and save, or confirm to discard changes. Closing or refreshing the browser tab also triggers a warning.

### Export Event to Excel

1. Open the event.
2. Click **Export Excel**.
3. An Excel file is downloaded with the setlist and video details.

### Delete an Event

1. Open the event.
2. Click **Delete**.
3. Confirm in the dialog. The event and its setlist are removed. Video "used count" is updated accordingly.

---

## 6. YouTube Sync

Sync imports videos and playlists from YouTube channels into your library.

### Mock vs Real Mode

- **Mock mode** — Used when no YouTube API key is configured. You can select from predefined mock channels to test the app.
- **Real mode** — Used when a YouTube API key is set. You sync real YouTube channels.

The Sync page title shows **(Mock)** when mock mode is active.

### Syncing with Real YouTube

**Option A: Connect your YouTube account (recommended for your own channel)**

1. Click **Connect YouTube**.
2. Sign in to Google and authorize the app.
3. After connecting, check **Sync my connected channel**.
4. Click **Sync**. Your channel's videos and playlists (including unlisted videos) are imported.

**Option B: Sync by channel ID or handle**

1. Enter one or more channel IDs (e.g. `UC...`) or @handles in the text field. Separate multiple entries with spaces or commas.
2. Click **Sync**.

### Genre Assignment

- New videos get a genre from their **YouTube category** (e.g. "Music" → genre "Music").
- If the category does not match an existing genre, a new genre is created.
- If a video has no category, it uses the first existing genre as a fallback.

**Important:** At least one genre must exist before syncing. After **Reset All Data**, default genres are restored automatically, so you can sync immediately.

### After Sync

- Sync shows how many videos and playlists were imported per channel.
- Videos appear in the Video Library.
- YouTube playlists appear in Playlists.
- Re-running sync updates existing videos (title, views, etc.) and refreshes playlist contents.

### Disconnect YouTube

To stop using your connected YouTube account, click **Disconnect**. You can still sync other channels by ID if you have an API key.

---

## 7. Setup

Setup is where you manage reference data and app settings. Use the tabs: **Genres**, **Singers**, **Holidays**, **Tags**, **Settings**.

### Genres

Genres classify videos (e.g. Oldies, Hebrew, Comedy).

- **Add:** Enter a name and click **Add**.
- **Edit:** Click **Edit**, change the name, click **Save**.
- **Delete:** Click **Delete** and confirm.

Default genres (created on first setup or after reset): Oldies, Hebrew, Oriental, Comedy, Love, War.

### Singers

Singers are performers or artists. Used when assigning videos.

- **Add:** Enter a name and click **Add**.
- **Edit:** Click **Edit**, change the name, click **Save**.
- **Delete:** Click **Delete** and confirm. You cannot delete a singer that is assigned to videos.

### Holidays

Holidays are thematic categories (e.g. Passover, Hanukkah).

- **Add:** Enter a name and click **Add**.
- **Edit:** Click **Edit**, change the name, click **Save**.
- **Delete:** Click **Delete** and confirm.

### Tags

Tags are flexible labels, organized by **Tag Categories**.

**Tag Categories:**

- **Add:** Enter a category name and click **Add**.
- **Edit:** Click **Edit**, change the name, click **Save**.
- **Delete:** Click **Delete** and confirm. Deleting a category removes its tags.

**Tags (within a category):**

- **Add:** Enter a tag name in the category's input and click **Add**.
- **Edit:** Click **Edit** next to the tag, change the name, click **Save**.
- **Delete:** Click **Delete** and confirm.

Tags are shown as "Category: Tag" in the video form and filters.

### Settings

**Recently Published**

- Defines "recently published" for the Video Library filter.
- Enter the number of days (1–365). Default: 60.
- Click **Save**. A green "Saved." message appears briefly.

**Reset All Data (Danger Zone)**

Resets the entire database to a clean state:

- Deletes: videos, events, playlists, genres, singers, holidays, tags, settings, YouTube connections.
- Restores: default genres (Oldies, Hebrew, Oriental, Comedy, Love, War).
- **This cannot be undone.**

To reset:

1. Click **Reset All Data**.
2. In the dialog, type **RESET** (all caps) to confirm.
3. Click **Reset Everything**.

After reset, you can sync from YouTube again immediately because default genres are recreated.

---

## 8. Export

### Filtered Video List

- Apply filters in the Video Library.
- Click **Export Excel**.
- Downloads an Excel file with up to 5,000 videos matching the current filters.

### Event Setlist

- Open an event.
- Click **Export Excel**.
- Downloads an Excel file with the event's setlist and video details.

---

## 9. Tips and Workflows

### Typical Workflow

1. **Setup:** Add genres, singers, and holidays in Setup.
2. **Sync:** Import videos from your YouTube channel(s).
3. **Enrich:** Edit videos to add singers, holidays, tags, quality scores.
4. **Organize:** Create local playlists for practice or themed sets.
5. **Plan events:** Create events and build setlists from your library.
6. **Export:** Export event setlists to Excel for printing or sharing.

### Singer Autocomplete

When adding or editing a video, the Singer field uses an autocomplete. Click in the field to see the full list; type to filter. Select singers with checkboxes.

### Duration Format

Duration is displayed and entered as **M:SS** (e.g. `3:45` for 3 minutes 45 seconds). You can also enter `H:MM:SS` for longer videos.

### Hebrew Sorting

When sorting by Title or Singer, Hebrew text is sorted correctly (right-to-left aware).

### Usage Warnings

When building an event setlist, adding a video that was used recently in another event triggers a warning. This helps you vary your setlist.

### Manual vs YouTube Videos

- **Manual videos** — You add them yourself. You can edit all fields and delete them.
- **YouTube videos** — Imported via sync. Core metadata (title, description, duration, etc.) is read-only; you can edit genre, singers, holidays, tags, notes, quality. They cannot be deleted.

### Channel Information

YouTube videos and playlists show the channel name. This is stored during sync and helps you see which channel a video or playlist came from.

---

## Quick Reference

| Task | Where |
|------|-------|
| Log in | Home page |
| Browse videos | Videos |
| Add manual video | Add Video |
| Edit video | Videos → Edit |
| Delete manual video | Edit video → Delete |
| Filter videos | Videos (filters at top) |
| Export filtered list | Videos → Export Excel |
| Create event from selection | Videos → select → Create Event from Selection |
| Create playlist | Playlists → Create Local Playlist |
| Edit local playlist | Playlists → Edit |
| Create event | Events → New Event |
| Edit event | Events → click event |
| Export event | Event page → Export Excel |
| Sync YouTube | Sync |
| Connect YouTube account | Sync → Connect YouTube |
| Add genre/singer/holiday | Setup → Genres / Singers / Holidays |
| Add tag category/tag | Setup → Tags |
| Change "recently published" days | Setup → Settings |
| Reset all data | Setup → Settings → Reset All Data |

---

*SingAlong Video Management System — User Manual*
