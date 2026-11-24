import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

export const runtime = "nodejs";

const onboardSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["EMPLOYEE", "HR"]).default("EMPLOYEE"),
  employeeCode: z.string().min(2),
  department: z.string().min(2),
  jobTitle: z.string().min(2),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]).default("full-time"),
  salaryMonthly: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  managerName: z.string().optional(),
  hireDate: z.string().optional(),
});

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = await req.json();
    const parsed = onboardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid employee data" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existingUser = await query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      await query(`UPDATE users SET role = $1, full_name = $2, phone = COALESCE(NULLIF($3, ''), phone) WHERE id = $4`, [
        parsed.data.role,
        parsed.data.fullName.trim(),
        parsed.data.phone || "",
        userId,
      ]);
    } else {
      const pass = parsed.data.password || "Cholok@2026";
      const inserted = await query<{ id: string }>(
        `INSERT INTO users (email, password_hash, full_name, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [email, hashPassword(pass), parsed.data.fullName.trim(), parsed.data.phone || "", parsed.data.role]
      );
      userId = inserted.rows[0].id;
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO employees (user_id, employee_code, department, job_title, employment_type, salary_monthly, currency, manager_name, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::date, CURRENT_DATE))
       RETURNING id`,
      [
        userId,
        parsed.data.employeeCode.trim().toUpperCase(),
        parsed.data.department.trim(),
        parsed.data.jobTitle.trim(),
        parsed.data.employmentType,
        parsed.data.salaryMonthly,
        parsed.data.currency || "USD",
        parsed.data.managerName || "",
        parsed.data.hireDate || null,
      ]
    );

    await logAudit(actor.id, "hr.onboard_employee", "employees", rows[0].id, {
      email,
      code: parsed.data.employeeCode,
    });
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[hr/employees POST]", err);
    return NextResponse.json({ error: "Could not onboard employee (check duplicate code or user)." }, { status: 400 });
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
    const body = await req.json();
    const { id, department, jobTitle, salaryMonthly, status, annualLeaveBalance, sickLeaveBalance } = body as {
      id: string;
      department?: string;
      jobTitle?: string;
      salaryMonthly?: number;
      status?: "active" | "on_leave" | "terminated";
      annualLeaveBalance?: number;
      sickLeaveBalance?: number;
    };
    if (!id) return NextResponse.json({ error: "Employee ID required" }, { status: 400 });

    await query(
      `UPDATE employees
       SET department = COALESCE($1, department),
           job_title = COALESCE($2, job_title),
           salary_monthly = COALESCE($3, salary_monthly),
           status = COALESCE($4, status),
           annual_leave_balance = COALESCE($5, annual_leave_balance),
           sick_leave_balance = COALESCE($6, sick_leave_balance),
           updated_at = NOW()
       WHERE id = $7`,
      [
        department || null,
        jobTitle || null,
        salaryMonthly ?? null,
        status || null,
        annualLeaveBalance ?? null,
        sickLeaveBalance ?? null,
        id,
      ]
    );

    await logAudit(actor.id, "hr.update_employee", "employees", id, { status, department });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hr/employees PATCH]", err);
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}
