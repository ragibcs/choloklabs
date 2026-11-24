import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";
import { getCmsSiteData } from "@/lib/cms";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }
  const data = await getCmsSiteData(true);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = await req.json();
    const { entity, id, data } = body as { entity: string; id?: string; data: Record<string, unknown> };

    if (entity === "copy") {
      await query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ('homepage', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(data)]
      );
      await logAudit(admin.id, "cms.update_copy", "site_settings", "homepage");
    } else if (entity === "product") {
      const slug = String(data.slug || data.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const points = Array.isArray(data.points) ? data.points : [];
      if (id) {
        await query(
          `UPDATE cms_products
           SET slug=$1, name=$2, tagline=$3, summary=$4, status=$5, status_label=$6, href=$7,
               points=$8::jsonb, icon=$9, sort_order=$10, is_published=$11, updated_at=NOW()
           WHERE id=$12`,
          [
            slug,
            data.name,
            data.tagline,
            data.summary,
            data.status || "development",
            data.statusLabel || "In development",
            data.href || "",
            JSON.stringify(points),
            data.icon || "GraduationCap",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
            id,
          ]
        );
        await logAudit(admin.id, "cms.update_product", "cms_products", id, { name: data.name });
      } else {
        const res = await query<{ id: string }>(
          `INSERT INTO cms_products (slug, name, tagline, summary, status, status_label, href, points, icon, sort_order, is_published)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11) RETURNING id`,
          [
            slug || `product-${Date.now()}`,
            data.name,
            data.tagline,
            data.summary,
            data.status || "development",
            data.statusLabel || "In development",
            data.href || "",
            JSON.stringify(points),
            data.icon || "GraduationCap",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
          ]
        );
        await logAudit(admin.id, "cms.create_product", "cms_products", res.rows[0].id, { name: data.name });
      }
    } else if (entity === "service") {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      if (id) {
        await query(
          `UPDATE cms_services
           SET layer=$1, name=$2, summary=$3, tags=$4::jsonb, image_url=$5, image_alt=$6,
               icon=$7, sort_order=$8, is_published=$9, updated_at=NOW()
           WHERE id=$10`,
          [
            data.layer,
            data.name,
            data.summary,
            JSON.stringify(tags),
            data.imageUrl || "/services/software.png",
            data.imageAlt || data.name,
            data.icon || "Code2",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
            id,
          ]
        );
        await logAudit(admin.id, "cms.update_service", "cms_services", id, { name: data.name });
      } else {
        const res = await query<{ id: string }>(
          `INSERT INTO cms_services (layer, name, summary, tags, image_url, image_alt, icon, sort_order, is_published)
           VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9) RETURNING id`,
          [
            data.layer,
            data.name,
            data.summary,
            JSON.stringify(tags),
            data.imageUrl || "/services/software.png",
            data.imageAlt || data.name,
            data.icon || "Code2",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
          ]
        );
        await logAudit(admin.id, "cms.create_service", "cms_services", res.rows[0].id, { name: data.name });
      }
    } else if (entity === "project") {
      const tags = Array.isArray(data.tags) ? data.tags : [];
      if (id) {
        await query(
          `UPDATE cms_projects
           SET title=$1, kind=$2, summary=$3, tags=$4::jsonb, href=$5, image_url=$6, image_alt=$7, sort_order=$8, is_published=$9
           WHERE id=$10`,
          [
            data.title,
            data.kind || "Representative engagement",
            data.summary,
            JSON.stringify(tags),
            data.href || "",
            data.imageUrl || "/services/software.png",
            data.imageAlt || data.title,
            Number(data.sortOrder || 0),
            data.isPublished !== false,
            id,
          ]
        );
      } else {
        await query(
          `INSERT INTO cms_projects (title, kind, summary, tags, href, image_url, image_alt, sort_order, is_published)
           VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,
          [
            data.title,
            data.kind || "Representative engagement",
            data.summary,
            JSON.stringify(tags),
            data.href || "",
            data.imageUrl || "/services/software.png",
            data.imageAlt || data.title,
            Number(data.sortOrder || 0),
            data.isPublished !== false,
          ]
        );
      }
      await logAudit(admin.id, "cms.save_project", "cms_projects", id || "new", { title: data.title });
    } else if (entity === "industry") {
      const layers = Array.isArray(data.layers) ? data.layers : [];
      if (id) {
        await query(
          `UPDATE cms_industries
           SET name=$1, note=$2, layers=$3::jsonb, flag=$4, icon=$5, sort_order=$6, is_published=$7
           WHERE id=$8`,
          [
            data.name,
            data.note,
            JSON.stringify(layers),
            data.flag || "",
            data.icon || "Factory",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
            id,
          ]
        );
      } else {
        await query(
          `INSERT INTO cms_industries (name, note, layers, flag, icon, sort_order, is_published)
           VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)`,
          [
            data.name,
            data.note,
            JSON.stringify(layers),
            data.flag || "",
            data.icon || "Factory",
            Number(data.sortOrder || 0),
            data.isPublished !== false,
          ]
        );
      }
      await logAudit(admin.id, "cms.save_industry", "cms_industries", id || "new", { name: data.name });
    } else {
      return NextResponse.json({ error: "Unknown CMS entity" }, { status: 400 });
    }

    revalidatePath("/");
    const updated = await getCmsSiteData(true);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[admin/cms PUT]", err);
    return NextResponse.json({ error: "Failed to save CMS content." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const { entity, id } = (await req.json()) as { entity: string; id: string };
    const tableMap: Record<string, string> = {
      product: "cms_products",
      service: "cms_services",
      project: "cms_projects",
      industry: "cms_industries",
    };
    const table = tableMap[entity];
    if (!table || !id) {
      return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
    }
    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    await logAudit(admin.id, `cms.delete_${entity}`, table, id);
    revalidatePath("/");
    const updated = await getCmsSiteData(true);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[admin/cms DELETE]", err);
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
