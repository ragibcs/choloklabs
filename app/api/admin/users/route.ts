import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const { rows } = await query(
    `SELECT id, email, full_name, phone, role, status, google_id IS NOT NULL AS has_google, created_at, last_login_at
     FROM users
     ORDER BY created_at DESC`
  );
  return NextResponse.json({ users: rows });
}

const createUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  password: z.string().min(8),
  role: z.enum(["USER", "EMPLOYEE", "HR", "ADMIN"]),
});

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const exists = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, hashPassword(parsed.data.password), parsed.data.fullName.trim(), parsed.data.phone || "", parsed.data.role]
    );

    await logAudit(admin.id, "user.created", "user", rows[0].id, { role: parsed.data.role, email });
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "Could not create user." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { id, role, status } = (await req.json()) as {
      id: string;
      role?: "USER" | "EMPLOYEE" | "HR" | "ADMIN";
      status?: "active" | "suspended";
    };
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (id === admin.id && status === "suspended") {
      return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
    }

    await query(
      `UPDATE users
       SET role = COALESCE($1, role),
           status = COALESCE($2, status),
           updated_at = NOW()
       WHERE id = $3`,
      [role || null, status || null, id]
    );

    if (status === "suspended") {
      await query(`DELETE FROM sessions WHERE user_id = $1`, [id]);
    }

    await logAudit(admin.id, "user.updated", "user", id, { role, status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Could not update user." }, { status: 500 });
  }
}
