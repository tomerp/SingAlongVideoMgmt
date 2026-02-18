import { google } from "googleapis";
import { prisma } from "@/lib/db";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required for YouTube OAuth"
    );
  }
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri()
  );
}

export function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/youtube/callback`;
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force refresh token on each connect
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getStoredConnection() {
  return prisma.youTubeConnection.findFirst({
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveConnection(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}, channelId?: string, channelName?: string) {
  if (!tokens.access_token) throw new Error("No access token");
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  await prisma.youTubeConnection.deleteMany({});
  return prisma.youTubeConnection.create({
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt,
      channelId: channelId || null,
      channelName: channelName || null,
    },
  });
}

export async function getValidOAuth2Client() {
  const conn = await getStoredConnection();
  if (!conn) return null;

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: conn.accessToken,
    refresh_token: conn.refreshToken,
    expiry_date: conn.expiresAt.getTime(),
  });

  if (conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    if (credentials.access_token) {
      await prisma.youTubeConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: credentials.access_token,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
        },
      });
      client.setCredentials(credentials);
    }
  }

  return client;
}
