import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import StudioHeader from "@/components/StudioHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCmsSiteData } from "@/lib/cms";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { getBlogPostBySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author_name],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [cms, user, post] = await Promise.all([
    getCmsSiteData(false),
    getCurrentUser().catch(() => null),
    getBlogPostBySlug(slug),
  ]);

  if (!post) notFound();

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;
  const paragraphs = post.content.split(/\n{2,}/).filter(Boolean);

  return (
    <div id="top">
      <StudioHeader dashboardHref={dashboardHref} userRole={user?.role ?? null} />
      <main
        style={{
          minHeight: "75svh",
          background: "var(--paper)",
          color: "var(--ink)",
          paddingBlock: "clamp(48px, 6vw, 84px)",
        }}
      >
        <article className="wrap" style={{ maxWidth: 820 }}>
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--signal-deep)",
              marginBottom: 24,
            }}
          >
            <ArrowLeft size={15} /> Back to Journal
          </Link>

          <div className="mono" style={{ fontSize: 11, letterSpacing: "1.6px", color: "var(--signal-deep)", marginBottom: 10 }}>
            {post.category.toUpperCase()}
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 4.2vw, 52px)",
              letterSpacing: "-0.045em",
              lineHeight: 1.08,
              fontWeight: 650,
              margin: "0 0 18px",
            }}
          >
            {post.title}
          </h1>

          <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
            {post.excerpt}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              padding: "14px 0",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 32,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <User size={14} /> <strong style={{ color: "var(--ink)" }}>{post.author_name}</strong> · {post.author_role}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} /> {new Date(post.published_at).toLocaleDateString("en-US", { dateStyle: "long" })}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> {post.read_time}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 16.5, lineHeight: 1.78, color: "var(--ink)" }}>
            {paragraphs.map((para, i) => {
              if (para.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    style={{
                      fontSize: 26,
                      letterSpacing: "-0.03em",
                      fontWeight: 650,
                      marginTop: 12,
                    }}
                  >
                    {para.replace(/^##\s+/, "")}
                  </h2>
                );
              }
              return <p key={i}>{para}</p>;
            })}
          </div>

          {post.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 36, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
              {post.tags.map((t) => (
                <span key={t} className="cl-pill mint">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <SiteFooter tagline={cms.copy.footerTagline} products={cms.products} services={cms.services} />
    </div>
  );
}
