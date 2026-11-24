import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tasksRes, risksRes, projectsRes, employeesRes] = await Promise.all([
      query(
        `SELECT t.*, p.title AS project_title, e.full_name AS assignee_name, e.designation AS assignee_designation
         FROM enterprise_tasks t
         LEFT JOIN client_projects p ON p.id = t.project_id
         LEFT JOIN employees e ON e.id = t.assignee_id
         ORDER BY t.created_at DESC`
      ),
      query(
        `SELECT r.*, p.title AS project_title
         FROM project_risks r
         LEFT JOIN client_projects p ON p.id = r.project_id
         ORDER BY r.created_at DESC`
      ),
      query(
        `SELECT id, title, client_name, status, health_score, budget, spent FROM client_projects ORDER BY updated_at DESC`
      ),
      query(
        `SELECT id, full_name, designation, wing FROM employees WHERE status = 'active' ORDER BY full_name ASC`
      ),
    ]);

    return NextResponse.json({
      tasks: tasksRes.rows,
      risks: risksRes.rows,
      projects: projectsRes.rows,
      employees: employeesRes.rows,
    });
  } catch (err) {
    console.error("[api/admin/tasks GET]", err);
    return NextResponse.json({ error: "Failed to fetch tasks and risks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    if (type === "risk") {
      const { project_id, title, severity, probability, mitigation_plan } = body;
      if (!project_id || !title) {
        return NextResponse.json({ error: "Project and title are required for risks" }, { status: 400 });
      }

      const { rows } = await query(
        `INSERT INTO project_risks (project_id, title, severity, probability, mitigation_plan)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [project_id, title, severity || "medium", probability || "medium", mitigation_plan || ""]
      );

      await logAudit(user.id, "create_risk", "project_risks", rows[0].id, { title, severity });
      return NextResponse.json({ risk: rows[0] });
    }

    // Default: task
    const { project_id, title, description, assignee_id, priority, status, estimated_hours, due_date, labels } = body;
    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO enterprise_tasks (
        project_id, title, description, assignee_id, priority, status, estimated_hours, due_date, labels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING *`,
      [
        project_id || null,
        title,
        description || "",
        assignee_id || null,
        priority || "medium",
        status || "todo",
        Number(estimated_hours || 0),
        due_date || null,
        JSON.stringify(labels || []),
      ]
    );

    await logAudit(user.id, "create_task", "enterprise_tasks", rows[0].id, { title, priority });
    return NextResponse.json({ task: rows[0] });
  } catch (err) {
    console.error("[api/admin/tasks POST]", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, status, actual_hours, mitigation_plan } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "risk") {
      const { rows } = await query(
        `UPDATE project_risks
         SET status = COALESCE($1, status),
             mitigation_plan = COALESCE($2, mitigation_plan)
         WHERE id = $3
         RETURNING *`,
        [status || null, mitigation_plan || null, id]
      );
      return NextResponse.json({ risk: rows[0] });
    }

    // Default: update task
    const { rows } = await query(
      `UPDATE enterprise_tasks
       SET status = COALESCE($1, status),
           actual_hours = COALESCE($2, actual_hours),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status || null, actual_hours !== undefined ? Number(actual_hours) : null, id]
    );

    return NextResponse.json({ task: rows[0] });
  } catch (err) {
    console.error("[api/admin/tasks PATCH]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
