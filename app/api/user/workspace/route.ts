import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { getCmsSiteData } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  let user;
  try {
    user = await requireAuth(["USER", "EMPLOYEE", "HR", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [inqRes, projectsRes, ticketsRes, invoicesRes, cms] = await Promise.all([
    query(
      `SELECT * FROM inquiries
       WHERE user_id = $1 OR LOWER(email) = LOWER($2)
       ORDER BY created_at DESC`,
      [user.id, user.email]
    ),
    query(
      `SELECT * FROM client_projects
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.id]
    ),
    query(
      `SELECT * FROM customer_tickets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    ),
    query(
      `SELECT i.*, p.title AS project_title
       FROM client_invoices i
       LEFT JOIN client_projects p ON p.id = i.project_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [user.id]
    ),
    getCmsSiteData(false),
  ]);

  return NextResponse.json({
    inquiries: inqRes.rows,
    projects: projectsRes.rows,
    tickets: ticketsRes.rows,
    invoices: invoicesRes.rows,
    products: cms.products,
    services: cms.services,
  });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireAuth(["USER", "EMPLOYEE", "HR", "ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action?: "inquiry" | "ticket";
      company?: string;
      interest?: string;
      message?: string;
      subject?: string;
      category?: string;
      priority?: "low" | "medium" | "high" | "urgent";
    };

    if (body.action === "ticket") {
      if (!body.subject?.trim() || !body.message?.trim() || body.message.trim().length < 5) {
        return NextResponse.json({ error: "Subject and details are required." }, { status: 400 });
      }
      const { rows } = await query<{ id: string }>(
        `INSERT INTO customer_tickets (user_id, subject, category, priority, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          user.id,
          body.subject.trim(),
          body.category?.trim() || "Technical Support",
          body.priority || "medium",
          body.message.trim(),
        ]
      );
      await logAudit(user.id, "customer.ticket_created", "customer_tickets", rows[0].id, {
        subject: body.subject,
      });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    if (!body.interest?.trim() || !body.message?.trim() || body.message.trim().length < 5) {
      return NextResponse.json({ error: "Select an interest and describe your request." }, { status: 400 });
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO inquiries (user_id, name, email, company, interest, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user.id, user.fullName, user.email, body.company?.trim() || "", body.interest.trim(), body.message.trim()]
    );

    await logAudit(user.id, "user.inquiry_created", "inquiries", rows[0].id);
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[user/workspace POST]", err);
    return NextResponse.json({ error: "Could not submit request." }, { status: 500 });
  }
}
