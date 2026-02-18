# YouTube Sync: Switching from Mock to Real Data

This guide explains how to connect the SingAlong Video Management app to your real YouTube channel instead of mock data.

---

## Prerequisites

- The app is already running with mock data (database set up, auth configured)
- A Google account that owns the YouTube channel you want to sync

---

## 1. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **YouTube Data API v3**:
   - Go to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create an API key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create credentials** → **API key**
   - Copy the API key

---

## 2. Identify Your Channel

You can use either your **@handle** (e.g. `@YourChannelName`) or your **channel ID** (e.g. `UC_x5XG1OV2P6uZZ5FSM9Ttw`). **Using your @handle is recommended** — it's easier and ensures you sync the correct channel.

### Option A: Use your @handle (recommended)

1. Your handle is the part after `@` in your channel URL, e.g. `https://www.youtube.com/@YourHandle`
2. In the Sync page, simply enter `@YourHandle` (or just `YourHandle`)
3. The app will resolve it to the correct channel automatically

### Option B: Find your channel ID

Channel ID format: `UC` + 22 characters (e.g. `UC_x5XG1OV2P6uZZ5FSM9Ttw`).

**From advanced account settings:**
1. Sign in to YouTube on a computer
2. Open: **https://www.youtube.com/account_advanced**
3. On that page you'll see your **channel ID** and **user ID** listed
4. Use the channel ID (starts with `UC`), not the user ID (numeric)

> **Note:** This is YouTube's *account* settings, not YouTube Studio. The channel ID is not shown in YouTube Studio → Settings → Channel → Advanced settings.

**From your channel URL:**
1. Go to your channel — the URL may be `https://www.youtube.com/@YourHandle`
2. The part after `/channel/` in some URLs is your channel ID

---

## 3. Update `.env`

In your project root, edit `.env`:

1. Add your API key:
   ```
   YOUTUBE_API_KEY="your-api-key-here"
   ```

2. Disable mock mode (if present):
   - Remove the line `USE_MOCK_YOUTUBE="true"`, or
   - Set it to `USE_MOCK_YOUTUBE="false"`

The app uses real YouTube when:
- `YOUTUBE_API_KEY` is set, and
- `USE_MOCK_YOUTUBE` is not `"true"` (or is omitted)

---

## 4. Restart the Dev Server

Environment variables are loaded at startup. After changing `.env`:

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

---

## 5. Connect your YouTube account (for unlisted videos)

To sync **unlisted** videos, connect your YouTube account:

1. Run `npm run db:push` to add the YouTubeConnection table (if not already done).
2. In Google Cloud Console, create **OAuth 2.0 credentials** (not an API key):
   - **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Add redirect URI: `http://localhost:3000/api/auth/youtube/callback` (and your production URL when deploying)
2. Add to `.env`: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. In the app, go to **Dashboard** → **YouTube Sync**
4. Click **Connect YouTube** and sign in with your Google account
5. Check **Sync my channel** and click **Sync Now**

Your client will do the same — each person connects their own YouTube account. The app stores one connection at a time.

## 6. Sync other channels (API key only)

Without connecting, you can still sync **public** videos from any channel by entering a channel ID or @handle. This uses the API key and does not include unlisted videos.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Still shows "Mock" | Restart the dev server after editing `.env` |
| Sync fails with API error | Check that YouTube Data API v3 is enabled in Google Cloud Console |
| "Invalid channel" or empty sync | Use your **@handle** instead of channel ID — it's more reliable. Or verify channel ID at https://www.youtube.com/account_advanced |
| Wrong channel / only a few videos / weird titles | For **artists/musicians**: @handle often resolves to a "Topic" channel. Use your channel ID from account_advanced, or **Connect YouTube** to sync your channel (including unlisted). |
| Most videos are unlisted | Connect your YouTube account via **Connect YouTube**. The API key only returns public videos. |
| Quota exceeded | YouTube API has daily quotas; wait or request an increase in Cloud Console |
