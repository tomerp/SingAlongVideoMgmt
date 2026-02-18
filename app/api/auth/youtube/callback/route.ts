import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  exchangeCodeForTokens,
  saveConnection,
  getOAuth2Client,
} from "@/lib/youtube/oauth";
import { google } from "googleapis";

const BASE_URL =
  process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.redirect(new URL("/", BASE_URL));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/sync?error=${encodeURIComponent(error)}`, BASE_URL)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/sync?error=no_code", BASE_URL)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const client = getOAuth2Client();
    client.setCredentials(tokens);

    const youtube = google.youtube({ version: "v3", auth: client });
    const res = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });
    const channel = res.data.items?.[0];
    const channelId = channel?.id ?? undefined;
    const channelName = channel?.snippet?.title ?? undefined;

    await saveConnection(tokens, channelId, channelName);

    return NextResponse.redirect(
      new URL("/dashboard/sync?youtube_connected=1", BASE_URL)
    );
  } catch (e) {
    console.error("YouTube OAuth callback:", e);
    return NextResponse.redirect(
      new URL(
        `/dashboard/sync?error=${encodeURIComponent(e instanceof Error ? e.message : "oauth_failed")}`,
        BASE_URL
      )
    );
  }
}
