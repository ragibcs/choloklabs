import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { title, body, audience, pinned } = (await req.json()) as {
      title: string;
      body: string;
      audience?: "all" | "employees" | "hr";
      pinned?: boolean;
    };
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    const { rows } = await query<{ id: string }>(
      `INSERT INTO announcements (author_id, title, body, audience, pinned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [actor.id, title.trim(), body.trim(), audience || "all", Boolean(pinned)]
    );
    await logAudit(actor.id, "hr.announcement_created", "announcements", rows[0].id);
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[hr/announcements POST]", err);
    return NextResponse.json({ error: "Could not publish announcement." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const { id } = (await req.json()) as { id: string };
  await query(`DELETE FROM announcements WHERE id = $1`, [id]);
  await logAudit(actor.id, "hr.announcement_deleted", "announcements", id);
  return NextResponse.json({ ok: true });
}
