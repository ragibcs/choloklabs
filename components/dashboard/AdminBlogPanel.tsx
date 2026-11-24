"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author_name: string;
  author_role: string;
  read_time: string;
  is_published: boolean;
  published_at: string;
}

export default function AdminBlogPanel({
  authorName,
  onNotify,
}: {
  authorName: string;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Research & Innovation",
    tagsText: "Bangla Audio Corpus, Datasets, AI",
    authorName,
    authorRole: "CholokLabs Research",
    excerpt: "",
    content: "",
    isPublished: true,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/blog");
    if (res.ok) {
      const out = await res.json();
      setPosts(out.posts || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function publishPost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          category: form.category,
          tags,
          authorName: form.authorName,
          authorRole: form.authorRole,
          excerpt: form.excerpt,
          content: form.content,
          isPublished: form.isPublished,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not publish post");
      setForm({
        title: "",
        slug: "",
        category: "Research & Innovation",
        tagsText: "",
        authorName,
        authorRole: "CholokLabs Research",
        excerpt: "",
        content: "",
        isPublished: true,
      });
      onNotify("ok", `Article published at /blog/${out.slug}`);
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(post: AdminBlogPost) {
    const res = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, isPublished: !post.is_published }),
    });
    if (res.ok) {
      onNotify("ok", post.is_published ? "Moved to Draft." : "Published live to /blog.");
      load();
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this blog post permanently?")) return;
    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      onNotify("ok", "Blog post deleted.");
      load();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <form className="cl-card" onSubmit={publishPost}>
        <div className="cl-card-head">
          <div>
            <h2>Publish Blog Post / Research Dispatch</h2>
            <p>Published posts appear immediately on the homepage Research Journal, /blog, and /sitemap.xml</p>
          </div>
          <Link href="/blog" target="_blank" className="cl-btn outline sm">
            View /blog <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="cl-form-grid">
          <div className="cl-field full">
            <label>Article Title</label>
            <input
              required
              className="cl-input"
              placeholder="e.g., Building a Dialect-Diverse Bangla Audio Corpus for Real-World ASR"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Category</label>
            <select
              className="cl-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="Research & Innovation">Research &amp; Innovation</option>
              <option value="Bangla Audio Corpus">Bangla Audio Corpus</option>
              <option value="Datasets & AI">Datasets &amp; AI</option>
              <option value="Embedded & Silicon">Embedded &amp; Silicon</option>
              <option value="Product Updates">Product Updates</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>
          <div className="cl-field">
            <label>Custom URL Slug (Optional)</label>
            <input
              className="cl-input"
              placeholder="auto-generated-from-title"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Author Name</label>
            <input
              required
              className="cl-input"
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Tags (comma-separated)</label>
            <input
              className="cl-input"
              placeholder="Bangla ASR, Speech Corpus, PyTorch"
              value={form.tagsText}
              onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
            />
          </div>
          <div className="cl-field full">
            <label>Short Excerpt (SEO meta description &amp; card summary)</label>
            <textarea
              required
              rows={2}
              className="cl-textarea"
              placeholder="A crisp 1-2 sentence summary of the research note or engineering update..."
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div className="cl-field full">
            <label>Full Article Content (separate paragraphs with blank lines; use &quot;## Heading&quot; for subheadings)</label>
            <textarea
              required
              rows={8}
              className="cl-textarea"
              placeholder="Write your full article, dataset methodology, benchmarks, or announcement..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Publish immediately on live site
          </label>
          <button type="submit" className="cl-btn primary" disabled={saving}>
            <Plus size={15} /> {saving ? "Publishing..." : "Publish Article"}
          </button>
        </div>
      </form>

      <div className="cl-card">
        <div className="cl-card-head">
          <div>
            <h2>All Journal Posts ({posts.length})</h2>
          </div>
        </div>
        {posts.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            No blog posts yet. Write your first research note or product dispatch above.
          </p>
        ) : (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>
                        <BookOpen size={13} style={{ display: "inline", marginRight: 6 }} />
                        {p.title}
                      </strong>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        /blog/{p.slug} · {p.read_time}
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <span className={`cl-pill ${p.is_published ? "mint" : "warn"}`}>
                        {p.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{new Date(p.published_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.is_published && (
                          <Link href={`/blog/${p.slug}`} target="_blank" className="cl-btn outline sm">
                            View <ArrowUpRight size={12} />
                          </Link>
                        )}
                        <button type="button" className="cl-btn outline sm" onClick={() => togglePublish(p)}>
                          {p.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button type="button" className="cl-btn danger sm" onClick={() => deletePost(p.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
