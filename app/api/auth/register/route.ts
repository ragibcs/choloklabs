import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { createSession, dashboardPathForRole, logAudit } from "@/lib/auth";
import { sendEmail } from "@/lib/providers";

export const runtime = "nodejs";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(40).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration details." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = hashPassword(parsed.data.password);
    const { rows } = await query<{ id: string; email: string; full_name: string }>(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, 'USER')
       RETURNING id, email, full_name`,
      [email, passwordHash, parsed.data.fullName.trim(), parsed.data.phone?.trim() || ""]
    );

    const user = rows[0];
    await createSession(user.id, {
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });
    await logAudit(user.id, "auth.register", "user", user.id, { method: "password" });

    // Best-effort welcome email if SMTP is configured
    sendEmail({
      to: user.email,
      subject: "Welcome to CholokLabs",
      text: `Hi ${user.full_name},\n\nYour CholokLabs portal account is ready. You can track inquiries, explore products, and collaborate with our engineering team.\n\n— CholokLabs`,
    }).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        user: { id: user.id, email: user.email, fullName: user.full_name, role: "USER" },
        redirectTo: dashboardPathForRole("USER"),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
