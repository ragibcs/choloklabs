import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleOAuthConfig } from "@/lib/providers";
import { generateToken } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const google = await getGoogleOAuthConfig();
  const origin = new URL(req.url).origin;

  if (!google.enabled || !google.clientId || !google.clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=google_disabled`);
  }

  const state = generateToken(24);
  const cookieStore = await cookies();
  cookieStore.set("cl_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: google.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  if (google.allowedDomain) {
    params.set("hd", google.allowedDomain);
  }

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
