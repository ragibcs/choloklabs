import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/providers";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const { rows } = await query(`SELECT * FROM inquiries ORDER BY created_at DESC`);
  return NextResponse.json({ inquiries: rows });
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
    const { id, status, adminReply, notifyEmail } = (await req.json()) as {
      id: string;
      status?: string;
      adminReply?: string;
      notifyEmail?: boolean;
    };

    if (!id) return NextResponse.json({ error: "Inquiry ID required" }, { status: 400 });

    const { rows } = await query<{ email: string; name: string; interest: string }>(
      `UPDATE inquiries
       SET status = COALESCE($1, status),
           admin_reply = COALESCE($2, admin_reply),
           replied_at = CASE WHEN $2 IS NOT NULL AND $2 <> '' THEN NOW() ELSE replied_at END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING email, name, interest`,
      [status || null, adminReply ?? null, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    let emailResult: { ok: boolean; error?: string } | null = null;
    if (notifyEmail && adminReply && adminReply.trim()) {
      emailResult = await sendEmail({
        to: rows[0].email,
        subject: `Re: ${rows[0].interest} — CholokLabs`,
        text: `Hi ${rows[0].name},\n\n${adminReply.trim()}\n\n— ${admin.fullName}, CholokLabs`,
      });
    }

    await logAudit(admin.id, "inquiry.updated", "inquiries", id, { status, emailSent: emailResult?.ok });
    return NextResponse.json({ ok: true, emailResult });
  } catch (err) {
    console.error("[admin/inquiries PATCH]", err);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}
