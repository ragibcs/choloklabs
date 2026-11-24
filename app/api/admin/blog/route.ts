import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  try {
    await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const { rows } = await query(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
  return NextResponse.json({ posts: rows });
}

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = (await req.json()) as {
      title: string;
      slug?: string;
      excerpt: string;
      content: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
      authorName?: string;
      authorRole?: string;
      readTime?: string;
      isPublished?: boolean;
    };

    if (!body.title?.trim() || !body.excerpt?.trim() || !body.content?.trim()) {
      return NextResponse.json({ error: "Title, excerpt, and article content are required." }, { status: 400 });
    }

    const baseSlug = slugify(body.slug?.trim() || body.title);
    const slug = baseSlug || `post-${Date.now()}`;
    const wordCount = body.content.trim().split(/\s+/).length;
    const readTime = body.readTime?.trim() || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const { rows } = await query<{ id: string; slug: string }>(
      `INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, cover_image, author_name, author_role, read_time, is_published)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
       RETURNING id, slug`,
      [
        slug,
        body.title.trim(),
        body.excerpt.trim(),
        body.content.trim(),
        body.category?.trim() || "Research & Innovation",
        JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
        body.coverImage?.trim() || "",
        body.authorName?.trim() || actor.fullName,
        body.authorRole?.trim() || "CholokLabs Team",
        readTime,
        body.isPublished !== false,
      ]
    );

    await logAudit(actor.id, "blog.post_created", "blog_posts", rows[0].id, { slug: rows[0].slug });
    return NextResponse.json({ ok: true, id: rows[0].id, slug: rows[0].slug }, { status: 201 });
  } catch (err) {
    console.error("[admin/blog POST]", err);
    return NextResponse.json({ error: "Could not publish post (check duplicate slug)." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = (await req.json()) as {
      id: string;
      title?: string;
      excerpt?: string;
      content?: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
      readTime?: string;
      isPublished?: boolean;
    };
    if (!body.id) return NextResponse.json({ error: "Post ID required." }, { status: 400 });

    await query(
      `UPDATE blog_posts
       SET title = COALESCE($1, title),
           excerpt = COALESCE($2, excerpt),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           tags = COALESCE($5::jsonb, tags),
           cover_image = COALESCE($6, cover_image),
           read_time = COALESCE($7, read_time),
           is_published = COALESCE($8, is_published),
           updated_at = NOW()
       WHERE id = $9`,
      [
        body.title?.trim() || null,
        body.excerpt?.trim() || null,
        body.content?.trim() || null,
        body.category?.trim() || null,
        body.tags ? JSON.stringify(body.tags) : null,
        body.coverImage !== undefined ? body.coverImage.trim() : null,
        body.readTime?.trim() || null,
        body.isPublished ?? null,
        body.id,
      ]
    );

    await logAudit(actor.id, "blog.post_updated", "blog_posts", body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/blog PATCH]", err);
    return NextResponse.json({ error: "Could not update post." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let actor;
  try {
    actor = await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const { id } = (await req.json()) as { id: string };
  await query(`DELETE FROM blog_posts WHERE id = $1`, [id]);
  await logAudit(actor.id, "blog.post_deleted", "blog_posts", id);
  return NextResponse.json({ ok: true });
}
