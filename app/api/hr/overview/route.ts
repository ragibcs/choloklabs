import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
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
    const [employeesRes, leavesRes, attendanceRes, payrollRes, announcementsRes, tasksRes] =
      await Promise.all([
        query(
          `SELECT e.*, u.full_name, u.email, u.phone, u.role, u.status AS user_status
           FROM employees e
           JOIN users u ON u.id = e.user_id
           ORDER BY e.created_at DESC`
        ),
        query(
          `SELECT lr.*, e.employee_code, e.department, u.full_name, u.email, u.phone
           FROM leave_requests lr
           JOIN employees e ON e.id = lr.employee_id
           JOIN users u ON u.id = e.user_id
           ORDER BY CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END, lr.created_at DESC`
        ),
        query(
          `SELECT al.*, e.employee_code, e.department, u.full_name
           FROM attendance_logs al
           JOIN employees e ON e.id = al.employee_id
           JOIN users u ON u.id = e.user_id
           ORDER BY al.work_date DESC, al.clock_in DESC
           LIMIT 50`
        ),
        query(
          `SELECT pr.*, e.employee_code, e.department, e.currency, u.full_name, u.email
           FROM payroll_records pr
           JOIN employees e ON e.id = pr.employee_id
           JOIN users u ON u.id = e.user_id
           ORDER BY pr.period_month DESC, pr.created_at DESC
           LIMIT 60`
        ),
        query(
          `SELECT a.*, u.full_name AS author_name
           FROM announcements a
           LEFT JOIN users u ON u.id = a.author_id
           ORDER BY a.pinned DESC, a.created_at DESC
           LIMIT 20`
        ),
        query(
          `SELECT t.*, e.employee_code, u.full_name AS employee_name
           FROM employee_tasks t
           JOIN employees e ON e.id = t.employee_id
           JOIN users u ON u.id = e.user_id
           ORDER BY t.created_at DESC
           LIMIT 40`
        ),
      ]);

    const employees = employeesRes.rows;
    const leaves = leavesRes.rows;
    const today = new Date().toISOString().slice(0, 10);
    const presentToday = attendanceRes.rows.filter(
      (a) => String(a.work_date).slice(0, 10) === today
    ).length;

    return NextResponse.json({
      stats: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "active").length,
        onLeave: employees.filter((e) => e.status === "on_leave").length,
        pendingLeaves: leaves.filter((l) => l.status === "pending").length,
        presentToday,
        monthlyPayroll: employees
          .filter((e) => e.status !== "terminated")
          .reduce((acc, e) => acc + Number(e.salary_monthly || 0), 0),
      },
      employees,
      leaves,
      attendance: attendanceRes.rows,
      payroll: payrollRes.rows,
      announcements: announcementsRes.rows,
      tasks: tasksRes.rows,
    });
  } catch (err) {
    console.error("[hr/overview]", err);
    return NextResponse.json({ error: "Failed to load HR data." }, { status: 500 });
  }
}
