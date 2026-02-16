import { compare } from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_COOKIE = "singalong_session";

// Fallback hash for "admin" when env var fails to load (e.g. $ expansion in .env)
const FALLBACK_HASH =
  "$2a$10$powmHbuAXAmEvbgqrR1W5ON8bS3t8z5ADpwsNrRnkMnmGqwTGCaem";

export async function verifyPassword(password: string): Promise<boolean> {
  const storedHash =
    process.env.AUTH_PASSWORD_HASH && process.env.AUTH_PASSWORD_HASH.length > 10
      ? process.env.AUTH_PASSWORD_HASH
      : FALLBACK_HASH;
  return compare(password, storedHash);
}

export async function login(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== process.env.AUTH_USERNAME) return false;
  return verifyPassword(password);
}

export async function setSession() {
  const cookieStore = await cookies();
  const secret =
    process.env.AUTH_SESSION_SECRET || "dev-session-secret-change-in-production";
  cookieStore.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  const secret =
    process.env.AUTH_SESSION_SECRET || "dev-session-secret-change-in-production";
  return session?.value === secret;
}
