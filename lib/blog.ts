import { query } from "./db";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  cover_image: string;
  author_name: string;
  author_role: string;
  read_time: string;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export async function getPublishedBlogPosts(limit = 30): Promise<BlogPost[]> {
  try {
    const { rows } = await query<BlogPost>(
      `SELECT * FROM blog_posts
       WHERE is_published = TRUE
       ORDER BY published_at DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : [],
    }));
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { rows } = await query<BlogPost>(
      `SELECT * FROM blog_posts WHERE slug = $1 AND is_published = TRUE LIMIT 1`,
      [slug]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      tags: Array.isArray(rows[0].tags) ? rows[0].tags : [],
    };
  } catch {
    return null;
  }
}
