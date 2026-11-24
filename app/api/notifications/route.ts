import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows: notifications } = await query(
      `SELECT id, title, message, category, link_url, is_read, created_at
       FROM user_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [user.id]
    );

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[api/notifications GET]", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      await query(`UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1`, [user.id]);
    } else if (id) {
      await query(`UPDATE user_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [id, user.id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/notifications PATCH]", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
