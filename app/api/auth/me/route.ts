import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    if (parsed.data.newPassword) {
      const { rows } = await query<{ password_hash: string | null }>(
        `SELECT password_hash FROM users WHERE id = $1`,
        [user.id]
      );
      const stored = rows[0]?.password_hash;
      if (stored && (!parsed.data.currentPassword || !verifyPassword(parsed.data.currentPassword, stored))) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
        hashPassword(parsed.data.newPassword),
        user.id,
      ]);
      await logAudit(user.id, "user.password_changed", "user", user.id);
    }

    if (parsed.data.fullName !== undefined || parsed.data.phone !== undefined) {
      await query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             updated_at = NOW()
         WHERE id = $3`,
        [parsed.data.fullName?.trim() || null, parsed.data.phone?.trim() ?? null, user.id]
      );
      await logAudit(user.id, "user.profile_updated", "user", user.id);
    }

    const updated = await getCurrentUser();
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("[auth/me PATCH]", err);
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
