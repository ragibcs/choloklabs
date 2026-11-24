import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SearchResultItem {
  id: string;
  type: "employee" | "project" | "task" | "document" | "blog" | "ticket" | "invoice" | "dataset";
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;
    const results: SearchResultItem[] = [];

    // 1. Employees (Public or Internal)
    const { rows: emps } = await query(
      `SELECT e.id, e.employee_code, u.full_name, e.job_title, e.field_unit
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE u.full_name ILIKE $1 OR e.job_title ILIKE $1 OR e.employee_code ILIKE $1
       LIMIT 4`,
      [pattern]
    );
    emps.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "employee",
        title: r.full_name,
        subtitle: `${r.job_title} • ${r.field_unit}`,
        url: `/team/${r.employee_code}`,
        badge: r.employee_code,
      });
    });

    // 2. Client Projects
    const { rows: projs } = await query(
      `SELECT id, code, title, client_name, status
       FROM client_projects
       WHERE title ILIKE $1 OR client_name ILIKE $1 OR code ILIKE $1
       LIMIT 4`,
      [pattern]
    );
    projs.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "project",
        title: r.title,
        subtitle: `Client: ${r.client_name}`,
        url: user.role === "ADMIN" ? `/dashboard/admin` : `/dashboard/user`,
        badge: r.status,
      });
    });

    // 3. Knowledge Documents
    const { rows: docs } = await query(
      `SELECT id, slug, title, category, author_name
       FROM knowledge_documents
       WHERE title ILIKE $1 OR content ILIKE $1
       LIMIT 4`,
      [pattern]
    );
    docs.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "document",
        title: r.title,
        subtitle: `Category: ${r.category} • Author: ${r.author_name}`,
        url: user.role === "ADMIN" ? `/dashboard/admin` : `/dashboard/employee`,
        badge: r.category,
      });
    });

    // 4. Research Datasets
    const { rows: datasets } = await query(
      `SELECT id, code, name, category, status
       FROM research_datasets
       WHERE name ILIKE $1 OR code ILIKE $1
       LIMIT 4`,
      [pattern]
    );
    datasets.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "dataset",
        title: r.name,
        subtitle: `${r.category} • Status: ${r.status}`,
        url: `/team`,
        badge: r.code,
      });
    });

    // 5. Blog Posts
    const { rows: blogs } = await query(
      `SELECT id, slug, title, category
       FROM blog_posts
       WHERE title ILIKE $1 OR content ILIKE $1
       LIMIT 3`,
      [pattern]
    );
    blogs.forEach((r: any) => {
      results.push({
        id: r.id,
        type: "blog",
        title: r.title,
        subtitle: `Journal: ${r.category}`,
        url: `/blog/${r.slug}`,
        badge: "Journal",
      });
    });

    // 6. Invoices (Admin/Client only)
    if (user.role === "ADMIN" || user.role === "USER") {
      const { rows: invs } = await query(
        `SELECT id, invoice_number, client_name, total_amount, status
         FROM client_invoices
         WHERE invoice_number ILIKE $1 OR client_name ILIKE $1
         LIMIT 3`,
        [pattern]
      );
      invs.forEach((r: any) => {
        results.push({
          id: r.id,
          type: "invoice",
          title: `Invoice #${r.invoice_number}`,
          subtitle: `${r.client_name} • BDT ${Number(r.total_amount).toLocaleString()}`,
          url: user.role === "ADMIN" ? `/dashboard/admin` : `/dashboard/user`,
          badge: r.status,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/search GET]", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
