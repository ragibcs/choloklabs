import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleOAuthConfig } from "@/lib/providers";
import { query } from "@/lib/db";
import { createSession, dashboardPathForRole, logAudit, type UserRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("cl_oauth_state")?.value;
  cookieStore.set("cl_oauth_state", "", { maxAge: 0, path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/login?error=oauth_state_invalid`);
  }

  const google = await getGoogleOAuthConfig();
  if (!google.enabled || !google.clientId || !google.clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=google_disabled`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=google_token_failed`);
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/login?error=google_token_missing`);
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=google_profile_failed`);
    }

    const profile = (await userInfoRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!profile.email || !profile.sub) {
      return NextResponse.redirect(`${origin}/login?error=google_email_missing`);
    }

    const email = profile.email.toLowerCase();
    if (google.allowedDomain && !email.endsWith(`@${google.allowedDomain.toLowerCase()}`)) {
      return NextResponse.redirect(`${origin}/login?error=google_domain_restricted`);
    }

    const { rows } = await query<{ id: string; role: UserRole; status: string }>(
      `SELECT id, role, status FROM users WHERE google_id = $1 OR email = $2 LIMIT 1`,
      [profile.sub, email]
    );

    let userId: string;
    let role: UserRole = "USER";

    if (rows.length > 0) {
      if (rows[0].status !== "active") {
        return NextResponse.redirect(`${origin}/login?error=account_suspended`);
      }
      userId = rows[0].id;
      role = rows[0].role;
      await query(
        `UPDATE users SET google_id = COALESCE(google_id, $1), avatar_url = COALESCE(NULLIF($2, ''), avatar_url), updated_at = NOW() WHERE id = $3`,
        [profile.sub, profile.picture || "", userId]
      );
    } else {
      if (!google.allowSignup) {
        return NextResponse.redirect(`${origin}/login?error=google_signup_disabled`);
      }
      const inserted = await query<{ id: string }>(
        `INSERT INTO users (email, full_name, google_id, avatar_url, role)
         VALUES ($1, $2, $3, $4, 'USER')
         RETURNING id`,
        [email, profile.name || email.split("@")[0], profile.sub, profile.picture || ""]
      );
      userId = inserted.rows[0].id;
    }

    await createSession(userId, {
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });
    await logAudit(userId, "auth.login", "user", userId, { method: "google_oauth" });

    return NextResponse.redirect(`${origin}${dashboardPathForRole(role)}`);
  } catch (err) {
    console.error("[auth/google/callback]", err);
    return NextResponse.redirect(`${origin}/login?error=google_callback_error`);
  }
}
