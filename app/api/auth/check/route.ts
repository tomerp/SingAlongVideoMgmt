import { NextResponse } from "next/server";
import { compareSync } from "bcryptjs";

/**
 * Debug endpoint to verify auth config.
 * Remove or restrict in production.
 */
export async function GET() {
  const hash = process.env.AUTH_PASSWORD_HASH;
  const username = process.env.AUTH_USERNAME;

  const config: {
    usernameSet: boolean;
    usernameValue: string;
    hashSet: boolean;
    hashLength: number;
    hashPrefix: string;
    hashError?: string;
  } = {
    usernameSet: !!username,
    usernameValue: username || "(not set)",
    hashSet: !!hash,
    hashLength: hash?.length ?? 0,
    hashPrefix: hash?.slice(0, 7) ?? "(not set)",
  };

  // Test if "admin" matches the stored hash
  let adminMatches = false;
  if (hash) {
    try {
      adminMatches = compareSync("admin", hash);
    } catch (e) {
      config["hashError"] = String(e);
    }
  }

  return NextResponse.json({
    ...config,
    adminPasswordWorks: adminMatches,
  });
}
