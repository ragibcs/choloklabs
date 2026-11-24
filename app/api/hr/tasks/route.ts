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
    const { employeeId, title, description, priority, dueDate } = (await req.json()) as {
      employeeId: string;
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: string;
    };
    if (!employeeId || !title?.trim()) {
      return NextResponse.json({ error: "Employee and task title are required." }, { status: 400 });
    }
    const { rows } = await query<{ id: string }>(
      `INSERT INTO employee_tasks (employee_id, assigned_by, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6::date)
       RETURNING id`,
      [employeeId, actor.id, title.trim(), description || "", priority || "medium", dueDate || null]
    );
    await logAudit(actor.id, "hr.task_assigned", "employee_tasks", rows[0].id);
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[hr/tasks POST]", err);
    return NextResponse.json({ error: "Failed to assign task." }, { status: 500 });
  }
}
