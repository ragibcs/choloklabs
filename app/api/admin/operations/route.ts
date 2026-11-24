import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const [projectsRes, invoicesRes, ticketsRes, clientsRes] = await Promise.all([
      query(
        `SELECT p.*, u.full_name AS client_name, u.email AS client_email
         FROM client_projects p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.updated_at DESC`
      ),
      query(
        `SELECT i.*, u.full_name AS client_name, u.email AS client_email, p.title AS project_title
         FROM client_invoices i
         LEFT JOIN users u ON u.id = i.user_id
         LEFT JOIN client_projects p ON p.id = i.project_id
         ORDER BY i.created_at DESC`
      ),
      query(
        `SELECT t.*, u.full_name AS client_name, u.email AS client_email
         FROM customer_tickets t
         JOIN users u ON u.id = t.user_id
         ORDER BY CASE WHEN t.status = 'open' THEN 0 WHEN t.status = 'in_progress' THEN 1 ELSE 2 END, t.created_at DESC`
      ),
      query(
        `SELECT id, full_name, email, role FROM users ORDER BY created_at DESC`
      ),
    ]);

    const totalRevenue = invoicesRes.rows
      .filter((i) => i.status === "paid")
      .reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const outstandingRevenue = invoicesRes.rows
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((acc, i) => acc + Number(i.amount || 0), 0);

    return NextResponse.json({
      projects: projectsRes.rows,
      invoices: invoicesRes.rows,
      tickets: ticketsRes.rows,
      clients: clientsRes.rows,
      summary: {
        activeProjects: projectsRes.rows.filter((p) => p.status !== "delivered").length,
        openTickets: ticketsRes.rows.filter((t) => t.status === "open" || t.status === "in_progress").length,
        totalRevenue,
        outstandingRevenue,
      },
    });
  } catch (err) {
    console.error("[admin/operations GET]", err);
    return NextResponse.json({ error: "Could not load operations data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = (await req.json()) as {
      entity: "project" | "invoice";
      data: Record<string, unknown>;
    };

    if (body.entity === "project") {
      const d = body.data;
      const title = String(d.title || "").trim();
      if (!title) return NextResponse.json({ error: "Project title is required." }, { status: 400 });

      const { rows } = await query<{ id: string }>(
        `INSERT INTO client_projects (user_id, title, category, status, progress, budget_usd, lead_name, target_date, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9)
         RETURNING id`,
        [
          d.userId || null,
          title,
          String(d.category || "Software & AI"),
          String(d.status || "discovery"),
          Math.max(0, Math.min(100, Number(d.progress ?? 10))),
          Number(d.budgetUsd || 0),
          String(d.leadName || admin.fullName),
          d.targetDate ? String(d.targetDate) : null,
          String(d.summary || ""),
        ]
      );
      await logAudit(admin.id, "admin.project_created", "client_projects", rows[0].id, { title });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    if (body.entity === "invoice") {
      const d = body.data;
      const title = String(d.title || "").trim();
      const amount = Number(d.amount || 0);
      if (!title || amount <= 0) {
        return NextResponse.json({ error: "Invoice title and positive amount are required." }, { status: 400 });
      }
      const invNum =
        String(d.invoiceNumber || "").trim() ||
        `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const status = String(d.status || "sent");

      const { rows } = await query<{ id: string }>(
        `INSERT INTO client_invoices (invoice_number, user_id, project_id, title, amount, currency, status, due_date, paid_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, CASE WHEN $7 = 'paid' THEN NOW() ELSE NULL END, $9)
         RETURNING id`,
        [
          invNum,
          d.userId || null,
          d.projectId || null,
          title,
          amount,
          String(d.currency || "USD"),
          status,
          d.dueDate ? String(d.dueDate) : null,
          String(d.notes || ""),
        ]
      );
      await logAudit(admin.id, "admin.invoice_created", "client_invoices", rows[0].id, { invNum, amount });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown entity." }, { status: 400 });
  } catch (err) {
    console.error("[admin/operations POST]", err);
    return NextResponse.json({ error: "Operation failed." }, { status: 500 });
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
    const body = (await req.json()) as {
      entity: "project" | "invoice" | "ticket";
      id: string;
      data: Record<string, unknown>;
    };
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (body.entity === "project") {
      const d = body.data;
      await query(
        `UPDATE client_projects
         SET status = COALESCE($1, status),
             progress = COALESCE($2, progress),
             lead_name = COALESCE($3, lead_name),
             summary = COALESCE($4, summary),
             updated_at = NOW()
         WHERE id = $5`,
        [
          d.status || null,
          d.progress !== undefined ? Math.max(0, Math.min(100, Number(d.progress))) : null,
          d.leadName || null,
          d.summary !== undefined ? String(d.summary) : null,
          body.id,
        ]
      );
      await logAudit(admin.id, "admin.project_updated", "client_projects", body.id);
      return NextResponse.json({ ok: true });
    }

    if (body.entity === "invoice") {
      const status = String(body.data.status || "sent");
      await query(
        `UPDATE client_invoices
         SET status = $1,
             paid_at = CASE WHEN $1 = 'paid' THEN COALESCE(paid_at, NOW()) ELSE NULL END
         WHERE id = $2`,
        [status, body.id]
      );
      await logAudit(admin.id, "admin.invoice_updated", "client_invoices", body.id, { status });
      return NextResponse.json({ ok: true });
    }

    if (body.entity === "ticket") {
      const status = body.data.status ? String(body.data.status) : null;
      const reply = body.data.adminReply !== undefined ? String(body.data.adminReply) : null;
      await query(
        `UPDATE customer_tickets
         SET status = COALESCE($1, status),
             admin_reply = COALESCE($2, admin_reply),
             replied_at = CASE WHEN $2 IS NOT NULL AND $2 <> '' THEN NOW() ELSE replied_at END,
             updated_at = NOW()
         WHERE id = $3`,
        [status, reply, body.id]
      );
      await logAudit(admin.id, "admin.ticket_updated", "customer_tickets", body.id, { status });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown entity." }, { status: 400 });
  } catch (err) {
    console.error("[admin/operations PATCH]", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { entity, id } = (await req.json()) as { entity: "project" | "invoice" | "ticket"; id: string };
    const tableMap = {
      project: "client_projects",
      invoice: "client_invoices",
      ticket: "customer_tickets",
    } as const;
    const table = tableMap[entity];
    if (!table || !id) return NextResponse.json({ error: "Invalid delete target." }, { status: 400 });

    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    await logAudit(admin.id, `admin.${entity}_deleted`, table, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/operations DELETE]", err);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
