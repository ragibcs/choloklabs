import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSession, dashboardPathForRole, logAudit, type UserRole } from "@/lib/auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { rows } = await query<{
      id: string;
      email: string;
      password_hash: string | null;
      full_name: string;
      role: UserRole;
      status: string;
    }>(`SELECT id, email, password_hash, full_name, role, status FROM users WHERE email = $1 LIMIT 1`, [
      email,
    ]);

    const user = rows[0];
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (user.status !== "active") {
      return NextResponse.json({ error: "This account is suspended. Contact an administrator." }, { status: 403 });
    }

    const valid = verifyPassword(parsed.data.password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id, {
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });
    await logAudit(user.id, "auth.login", "user", user.id, { method: "password" });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      redirectTo: dashboardPathForRole(user.role),
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
