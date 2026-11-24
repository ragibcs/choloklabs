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
    const { employeeId, periodMonth, baseSalary, bonus, deductions, status, notes } = (await req.json()) as {
      employeeId: string;
      periodMonth: string;
      baseSalary: number;
      bonus?: number;
      deductions?: number;
      status?: "draft" | "processed" | "paid";
      notes?: string;
    };

    if (!employeeId || !periodMonth) {
      return NextResponse.json({ error: "Employee and period month are required." }, { status: 400 });
    }

    const base = Number(baseSalary || 0);
    const bon = Number(bonus || 0);
    const ded = Number(deductions || 0);
    const net = Math.max(0, base + bon - ded);
    const st = status || "processed";

    await query(
      `INSERT INTO payroll_records (employee_id, period_month, base_salary, bonus, deductions, net_pay, status, paid_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'paid' THEN NOW() ELSE NULL END, $8)
       ON CONFLICT (employee_id, period_month) DO UPDATE SET
         base_salary = EXCLUDED.base_salary,
         bonus = EXCLUDED.bonus,
         deductions = EXCLUDED.deductions,
         net_pay = EXCLUDED.net_pay,
         status = EXCLUDED.status,
         paid_at = CASE WHEN EXCLUDED.status = 'paid' THEN COALESCE(payroll_records.paid_at, NOW()) ELSE NULL END,
         notes = EXCLUDED.notes`,
      [employeeId, periodMonth, base, bon, ded, net, st, notes || ""]
    );

    await logAudit(actor.id, "hr.payroll_upsert", "payroll_records", `${employeeId}:${periodMonth}`, { net, st });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hr/payroll POST]", err);
    return NextResponse.json({ error: "Failed to save payroll record." }, { status: 500 });
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
    const { id, status } = (await req.json()) as { id: string; status: "draft" | "processed" | "paid" };
    await query(
      `UPDATE payroll_records
       SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END
       WHERE id = $2`,
      [status, id]
    );
    await logAudit(actor.id, "hr.payroll_status", "payroll_records", id, { status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hr/payroll PATCH]", err);
    return NextResponse.json({ error: "Failed to update payroll status." }, { status: 500 });
  }
}
