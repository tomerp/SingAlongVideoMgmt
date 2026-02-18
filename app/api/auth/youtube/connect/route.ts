import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAuthUrl } from "@/lib/youtube/oauth";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("GOOGLE_CLIENT")
        ? "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env (from Google Cloud OAuth credentials)"
        : encodeURIComponent(e instanceof Error ? e.message : "OAuth config error");
    const base = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      new URL(`/dashboard/sync?error=${msg}`, base)
    );
  }
}
