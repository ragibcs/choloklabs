import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: code === 403 ? "Forbidden" : "Unauthorized" }, { status: code });
  }

  try {
    const [usersRes, empRes, prodRes, svcRes, inqRes, leaveRes, auditRes, notifRes, recentInqRes] =
      await Promise.all([
        query<{ count: string }>(`SELECT COUNT(*) FROM users`),
        query<{ count: string }>(`SELECT COUNT(*) FROM employees WHERE status = 'active'`),
        query<{ count: string }>(`SELECT COUNT(*) FROM cms_products`),
        query<{ count: string }>(`SELECT COUNT(*) FROM cms_services`),
        query<{ total: string; unread: string }>(
          `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'new') AS unread FROM inquiries`
        ),
        query<{ count: string }>(`SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'`),
        query<{
          id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Record<string, unknown>;
          created_at: string;
          actor_name: string | null;
        }>(
          `SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.full_name AS actor_name
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.actor_id
           ORDER BY a.created_at DESC
           LIMIT 15`
        ),
        query<{
          id: string;
          channel: string;
          recipient: string;
          subject: string;
          status: string;
          error_message: string;
          provider: string;
          created_at: string;
        }>(`SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 12`),
        query<{
          id: string;
          name: string;
          email: string;
          company: string;
          interest: string;
          status: string;
          created_at: string;
        }>(`SELECT id, name, email, company, interest, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 6`),
      ]);

    return NextResponse.json({
      stats: {
        users: Number(usersRes.rows[0]?.count || 0),
        activeEmployees: Number(empRes.rows[0]?.count || 0),
        products: Number(prodRes.rows[0]?.count || 0),
        services: Number(svcRes.rows[0]?.count || 0),
        totalInquiries: Number(inqRes.rows[0]?.total || 0),
        newInquiries: Number(inqRes.rows[0]?.unread || 0),
        pendingLeaves: Number(leaveRes.rows[0]?.count || 0),
      },
      auditLogs: auditRes.rows,
      notificationLogs: notifRes.rows,
      recentInquiries: recentInqRes.rows,
    });
  } catch (err) {
    console.error("[admin/overview]", err);
    return NextResponse.json({ error: "Failed to load admin overview." }, { status: 500 });
  }
}
