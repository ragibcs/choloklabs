import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { rows } = await query<{ now: string; users: string; products: string; services: string }>(
      `SELECT NOW()::text AS now,
              (SELECT COUNT(*) FROM users)::text AS users,
              (SELECT COUNT(*) FROM cms_products)::text AS products,
              (SELECT COUNT(*) FROM cms_services)::text AS services`
    );
    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: rows[0]?.now,
      counts: {
        users: Number(rows[0]?.users || 0),
        products: Number(rows[0]?.products || 0),
        services: Number(rows[0]?.services || 0),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", database: "disconnected", error: err instanceof Error ? err.message : "DB error" },
      { status: 500 }
    );
  }
}
