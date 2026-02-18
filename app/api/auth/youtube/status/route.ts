import { NextResponse } from "next/server";
import { getStoredConnection } from "@/lib/youtube/oauth";

export async function GET() {
  try {
    const conn = await getStoredConnection();
    if (!conn) {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json({
      connected: true,
      channelId: conn.channelId,
      channelName: conn.channelName,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
