import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendEmail, sendSms } from "@/lib/providers";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["HR", "ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { id, status, reviewNote, notify } = (await req.json()) as {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
      notify?: boolean;
    };
    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid leave decision" }, { status: 400 });
    }

    const { rows } = await query<{
      employee_id: string;
      leave_type: string;
      days: number;
      start_date: string;
      end_date: string;
      prev_status: string;
      email: string;
      phone: string;
      full_name: string;
    }>(
      `SELECT lr.employee_id, lr.leave_type, lr.days, lr.start_date, lr.end_date, lr.status AS prev_status,
              u.email, u.phone, u.full_name
       FROM leave_requests lr
       JOIN employees e ON e.id = lr.employee_id
       JOIN users u ON u.id = e.user_id
       WHERE lr.id = $1`,
      [id]
    );

    if (rows.length === 0) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    const lr = rows[0];

    await query(
      `UPDATE leave_requests
       SET status = $1, reviewed_by = $2, review_note = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, actor.id, reviewNote || "", id]
    );

    if (status === "approved" && lr.prev_status !== "approved") {
      if (lr.leave_type === "annual") {
        await query(
          `UPDATE employees SET annual_leave_balance = GREATEST(0, annual_leave_balance - $1) WHERE id = $2`,
          [lr.days, lr.employee_id]
        );
      } else if (lr.leave_type === "sick") {
        await query(
          `UPDATE employees SET sick_leave_balance = GREATEST(0, sick_leave_balance - $1) WHERE id = $2`,
          [lr.days, lr.employee_id]
        );
      }
    }

    if (notify) {
      const msg = `Hi ${lr.full_name}, your ${lr.leave_type} leave (${String(lr.start_date).slice(0, 10)} to ${String(lr.end_date).slice(0, 10)}) has been ${status}.${reviewNote ? ` Note: ${reviewNote}` : ""}`;
      sendEmail({ to: lr.email, subject: `Leave Request ${status.toUpperCase()} — CholokLabs`, text: msg }).catch(
        () => {}
      );
      if (lr.phone) {
        sendSms({ to: lr.phone, message: msg }).catch(() => {});
      }
    }

    await logAudit(actor.id, `hr.leave_${status}`, "leave_requests", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[hr/leaves PATCH]", err);
    return NextResponse.json({ error: "Could not update leave request." }, { status: 500 });
  }
}
