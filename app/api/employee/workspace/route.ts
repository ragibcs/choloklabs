import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function ensureEmployeeProfile(userId: string) {
  const { rows } = await query(`SELECT * FROM employees WHERE user_id = $1 LIMIT 1`, [userId]);
  if (rows.length > 0) return rows[0];

  // Auto-provision an employee record if an ADMIN/HR/EMPLOYEE visits without one
  const code = `CL-EMP-${Math.floor(100 + Math.random() * 900)}`;
  const inserted = await query(
    `INSERT INTO employees (user_id, employee_code, department, job_title)
     VALUES ($1, $2, 'Engineering', 'Team Member')
     RETURNING *`,
    [userId, code]
  );
  return inserted.rows[0];
}

export async function GET() {
  let user;
  try {
    user = await requireAuth(["EMPLOYEE", "HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const employee = await ensureEmployeeProfile(user.id);
    const empId = employee.id as string;

    const [attendanceRes, leavesRes, tasksRes, payrollRes, announcementsRes, standupsRes, commitsRes] = await Promise.all([
      query(`SELECT * FROM attendance_logs WHERE employee_id = $1 ORDER BY work_date DESC LIMIT 30`, [empId]),
      query(`SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 20`, [empId]),
      query(`SELECT * FROM employee_tasks WHERE employee_id = $1 ORDER BY created_at DESC`, [empId]),
      query(`SELECT * FROM payroll_records WHERE employee_id = $1 ORDER BY period_month DESC LIMIT 12`, [empId]),
      query(
        `SELECT a.*, u.full_name AS author_name
         FROM announcements a
         LEFT JOIN users u ON u.id = a.author_id
         WHERE a.audience IN ('all', 'employees')
         ORDER BY a.pinned DESC, a.created_at DESC
         LIMIT 10`
      ),
      query(`SELECT * FROM employee_standups WHERE employee_id = $1 ORDER BY work_date DESC LIMIT 14`, [empId]),
      query(`SELECT * FROM employee_commits WHERE employee_id = $1 ORDER BY committed_at DESC LIMIT 30`, [empId]),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const todayLog = attendanceRes.rows.find((r) => String(r.work_date).slice(0, 10) === today) || null;

    return NextResponse.json({
      employee,
      todayLog,
      attendance: attendanceRes.rows,
      leaves: leavesRes.rows,
      tasks: tasksRes.rows,
      payroll: payrollRes.rows,
      announcements: announcementsRes.rows,
      standups: standupsRes.rows,
      commits: commitsRes.rows,
    });
  } catch (err) {
    console.error("[employee/workspace GET]", err);
    return NextResponse.json({ error: "Failed to load employee workspace." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireAuth(["EMPLOYEE", "HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const employee = await ensureEmployeeProfile(user.id);
    const empId = employee.id as string;
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "clock_in") {
      const mode = body.status === "remote" ? "remote" : "present";
      await query(
        `INSERT INTO attendance_logs (employee_id, work_date, clock_in, status, notes)
         VALUES ($1, CURRENT_DATE, NOW(), $2, $3)
         ON CONFLICT (employee_id, work_date) DO UPDATE SET
           clock_in = COALESCE(attendance_logs.clock_in, NOW()),
           status = EXCLUDED.status,
           notes = COALESCE(NULLIF(EXCLUDED.notes, ''), attendance_logs.notes)`,
        [empId, mode, String(body.notes || "")]
      );
      await logAudit(user.id, "employee.clock_in", "attendance_logs", empId);
      return NextResponse.json({ ok: true });
    }

    if (action === "clock_out") {
      await query(
        `UPDATE attendance_logs
         SET clock_out = NOW(), notes = COALESCE(NULLIF($2, ''), notes)
         WHERE employee_id = $1 AND work_date = CURRENT_DATE`,
        [empId, String(body.notes || "")]
      );
      await logAudit(user.id, "employee.clock_out", "attendance_logs", empId);
      return NextResponse.json({ ok: true });
    }

    if (action === "request_leave") {
      const { leaveType, startDate, endDate, reason } = body as {
        leaveType: string;
        startDate: string;
        endDate: string;
        reason: string;
      };
      if (!startDate || !endDate || !reason?.trim()) {
        return NextResponse.json({ error: "Dates and reason are required." }, { status: 400 });
      }
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const days = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      await query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason)
         VALUES ($1, $2, $3::date, $4::date, $5, $6)`,
        [empId, leaveType || "annual", startDate, endDate, days, reason.trim()]
      );
      await logAudit(user.id, "employee.leave_requested", "leave_requests", empId, { days, leaveType });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (action === "update_task") {
      const { taskId, status } = body as { taskId: string; status: string };
      if (!taskId || !["todo", "in_progress", "review", "done"].includes(status)) {
        return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
      }
      await query(
        `UPDATE employee_tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND employee_id = $3`,
        [status, taskId, empId]
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "standup") {
      const { completed, planned, blockers } = body as {
        completed: string;
        planned: string;
        blockers?: string;
      };
      if (!completed?.trim() || !planned?.trim()) {
        return NextResponse.json({ error: "Completed and planned updates are required." }, { status: 400 });
      }
      await query(
        `INSERT INTO employee_standups (employee_id, work_date, completed, planned, blockers)
         VALUES ($1, CURRENT_DATE, $2, $3, $4)
         ON CONFLICT (employee_id, work_date) DO UPDATE SET
           completed = EXCLUDED.completed,
           planned = EXCLUDED.planned,
           blockers = EXCLUDED.blockers`,
        [empId, completed.trim(), planned.trim(), String(blockers || "").trim()]
      );
      await logAudit(user.id, "employee.standup_submitted", "employee_standups", empId);
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (action === "log_commit") {
      const { repoName, branch, commitSha, commitMessage, commitUrl, prStatus } = body as {
        repoName?: string;
        branch?: string;
        commitSha?: string;
        commitMessage?: string;
        commitUrl?: string;
        prStatus?: string;
      };
      if (!commitMessage?.trim()) {
        return NextResponse.json({ error: "Commit or deliverable summary is required." }, { status: 400 });
      }
      const sha = commitSha?.trim() || Math.random().toString(16).slice(2, 9);
      await query(
        `INSERT INTO employee_commits (employee_id, repo_name, branch, commit_sha, commit_message, commit_url, pr_status, ci_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'passed')`,
        [
          empId,
          repoName?.trim() || "choloklabs/core",
          branch?.trim() || "main",
          sha,
          commitMessage.trim(),
          commitUrl?.trim() || "",
          prStatus || "merged",
        ]
      );
      await logAudit(user.id, "employee.commit_logged", "employee_commits", empId, { sha });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[employee/workspace POST]", err);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
