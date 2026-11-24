import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const [jobsRes, standupsRes] = await Promise.all([
      query(`SELECT * FROM hr_job_openings ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, created_at DESC`),
      query(
        `SELECT s.*, e.employee_code, e.department, u.full_name
         FROM employee_standups s
         JOIN employees e ON e.id = s.employee_id
         JOIN users u ON u.id = e.user_id
         ORDER BY s.work_date DESC, s.created_at DESC
         LIMIT 30`
      ),
    ]);
    return NextResponse.json({ jobs: jobsRes.rows, standups: standupsRes.rows });
  } catch (err) {
    console.error("[hr/jobs GET]", err);
    return NextResponse.json({ error: "Could not load recruitment data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = (await req.json()) as {
      title: string;
      department?: string;
      location?: string;
      employmentType?: "full-time" | "part-time" | "contract" | "intern";
      salaryRange?: string;
      description?: string;
    };
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Role title is required." }, { status: 400 });
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO hr_job_openings (title, department, location, employment_type, salary_range, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        body.title.trim(),
        body.department?.trim() || "Engineering",
        body.location?.trim() || "Dhaka / Remote",
        body.employmentType || "full-time",
        body.salaryRange?.trim() || "",
        body.description?.trim() || "",
      ]
    );
    await logAudit(actor.id, "hr.job_created", "hr_job_openings", rows[0].id, { title: body.title });
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[hr/jobs POST]", err);
    return NextResponse.json({ error: "Failed to create job opening." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { id, status, applicantsCount } = (await req.json()) as {
      id: string;
      status?: "open" | "paused" | "closed";
      applicantsCount?: number;
    };
    if (!id) return NextResponse.json({ error: "Job ID required." }, { status: 400 });

    await query(
      `UPDATE hr_job_openings
       SET status = COALESCE($1, status),
           applicants_count = COALESCE($2, applicants_count),
           updated_at = NOW()
       WHERE id = $3`,
      [status || null, applicantsCount ?? null, id]
    );
    await logAudit(actor.id, "hr.job_updated", "hr_job_openings", id, { status, applicantsCount });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hr/jobs PATCH]", err);
    return NextResponse.json({ error: "Failed to update job opening." }, { status: 500 });
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
  await query(`DELETE FROM hr_job_openings WHERE id = $1`, [id]);
  await logAudit(actor.id, "hr.job_deleted", "hr_job_openings", id);
  return NextResponse.json({ ok: true });
}
