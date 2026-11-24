import { cookies } from "next/headers";
import { query } from "./db";
import { generateToken, sha256 } from "./crypto";

export type UserRole = "USER" | "EMPLOYEE" | "HR" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: "active" | "suspended";
  googleId: string | null;
  avatarUrl: string;
  createdAt: string;
}

export const SESSION_COOKIE_NAME = "cl_session";
const SESSION_TTL_DAYS = 14;

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "HR":
      return "/dashboard/hr";
    case "EMPLOYEE":
      return "/dashboard/employee";
    default:
      return "/dashboard/user";
  }
}

export async function createSession(
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const rawToken = generateToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, meta?.ipAddress || "", meta?.userAgent || "", expiresAt.toISOString()]
  );

  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [sha256(rawToken)]);
  }
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = sha256(rawToken);
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: UserRole;
    status: "active" | "suspended";
    google_id: string | null;
    avatar_url: string;
    created_at: string;
  }>(
    `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.google_id, u.avatar_url, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.status = 'active'
     LIMIT 1`,
    [tokenHash]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone || "",
    role: row.role,
    status: row.status,
    googleId: row.google_id,
    avatarUrl: row.avatar_url || "",
    createdAt: row.created_at,
  };
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function logAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId = "",
  details: Record<string, unknown> = {}
) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [actorId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch {
    // Non-blocking audit log
  }
}
