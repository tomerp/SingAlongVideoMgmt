import { NextRequest, NextResponse } from "next/server";
import { login, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }
  const valid = await login(username, password);
  if (!valid) {
    // Debug info in dev to diagnose auth config
    const debug =
      process.env.NODE_ENV === "development"
        ? {
            usernameSet: !!process.env.AUTH_USERNAME,
            hashSet: !!process.env.AUTH_PASSWORD_HASH,
            hashLength: process.env.AUTH_PASSWORD_HASH?.length,
          }
        : undefined;
    return NextResponse.json(
      { error: "Invalid credentials", ...debug },
      { status: 401 }
    );
  }
  await setSession();
  return NextResponse.json({ success: true });
}
