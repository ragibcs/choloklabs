import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows: objectives } = await query(
      `SELECT
         o.id,
         o.title,
         o.category,
         o.year,
         o.quarter,
         o.owner_name,
         o.confidence_score,
         o.status,
         o.created_at,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', kr.id,
                 'title', kr.title,
                 'metric_type', kr.metric_type,
                 'target_value', kr.target_value,
                 'current_value', kr.current_value,
                 'unit', kr.unit
               )
             )
             FROM key_results kr
             WHERE kr.objective_id = o.id
           ), '[]'::json
         ) AS key_results
       FROM company_objectives o
       ORDER BY o.year DESC, o.quarter DESC, o.created_at ASC`
    );

    return NextResponse.json({ objectives });
  } catch (err) {
    console.error("[api/admin/okr GET]", err);
    return NextResponse.json({ error: "Failed to fetch OKRs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_objective") {
      const { title, category, year, quarter, owner_name, confidence_score } = body;
      const { rows } = await query(
        `INSERT INTO company_objectives (title, category, year, quarter, owner_name, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [title, category || 'Company', year || 2026, quarter || 'Q1', owner_name || user.fullName, confidence_score || 0.85]
      );
      await logAudit(user.id, "create_objective", "company_objectives", rows[0].id, { title });
      return NextResponse.json({ ok: true, id: rows[0].id });
    }

    if (action === "update_kr_value") {
      const { kr_id, current_value } = body;
      await query(
        `UPDATE key_results SET current_value = $1, updated_at = NOW() WHERE id = $2`,
        [current_value, kr_id]
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[api/admin/okr POST]", err);
    return NextResponse.json({ error: "Failed to update OKR" }, { status: 500 });
  }
}
