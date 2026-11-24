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

    const { rows: documents } = await query(
      `SELECT id, slug, title, category, content, author_name, version, is_confidential, tags, updated_at
       FROM knowledge_documents
       ORDER BY category ASC, updated_at DESC`
    );

    return NextResponse.json({ documents });
  } catch (err) {
    console.error("[api/admin/knowledge GET]", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { slug, title, category, content, tags, is_confidential } = body;

    if (!slug || !title || !content) {
      return NextResponse.json({ error: "Missing required document fields" }, { status: 400 });
    }

    await query(
      `INSERT INTO knowledge_documents (slug, title, category, content, author_name, tags, is_confidential)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         content = EXCLUDED.content,
         author_name = EXCLUDED.author_name,
         tags = EXCLUDED.tags,
         is_confidential = EXCLUDED.is_confidential,
         version = knowledge_documents.version + 1,
         updated_at = NOW()`,
      [slug, title, category || 'engineering', content, user.fullName, JSON.stringify(tags || []), Boolean(is_confidential)]
    );

    await logAudit(user.id, "upsert_document", "knowledge_documents", slug, { title, category });
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("[api/admin/knowledge POST]", err);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}
