import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Calendar, Clock } from "lucide-react";
import StudioHeader from "@/components/StudioHeader";
import SiteFooter from "@/components/SiteFooter";
import SpotlightCard from "@/components/SpotlightCard";
import { BorderBeam } from "@/components/ui/border-beam";
import { getCmsSiteData } from "@/lib/cms";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { getPublishedBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Research Journal",
  description:
    "Engineering dispatches, Bangla audio corpus research notes, dataset methodology, and deep-tech updates from CholokLabs.",
};

export default async function BlogIndexPage() {
  const [cms, user, posts] = await Promise.all([
    getCmsSiteData(false),
    getCurrentUser().catch(() => null),
    getPublishedBlogPosts(50),
  ]);

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;

  return (
    <div id="top">
      <StudioHeader dashboardHref={dashboardHref} userRole={user?.role ?? null} />
      <main
        style={{
          minHeight: "75svh",
          background:
            "radial-gradient(ellipse 65% 45% at 15% 0%, rgba(94,242,200,0.14), transparent 65%), radial-gradient(ellipse 50% 45% at 85% 20%, rgba(56,189,248,0.1), transparent 60%), var(--ink)",
          color: "var(--paper)",
          paddingBlock: "clamp(56px, 7vw, 96px)",
        }}
      >
        <div className="wrap">
          <div className="eyebrow" style={{ color: "var(--signal)" }}>
            <i style={{ background: "var(--signal)" }} />
            CHOLOKLABS JOURNAL
          </div>
          <h1
            style={{
              fontSize: "clamp(42px, 5.2vw, 76px)",
              letterSpacing: "-0.055em",
              lineHeight: 1.02,
              margin: "16px 0 18px",
              color: "var(--paper)",
            }}
          >
            Research, datasets &amp; engineering<span>.</span>
          </h1>
          <p style={{ color: "var(--mist)", fontSize: 17, maxWidth: 620, marginBottom: 42 }}>
            Technical write-ups on Bangla audio corpora, AI systems, embedded hardware, and lessons
            from building Porikkha and BOLoy.
          </p>

          {posts.length === 0 ? (
            <div className="ri-blog-empty">
              <div>
                <h2 style={{ fontSize: 22, color: "var(--paper)", marginBottom: 6 }}>
                  No dispatches published yet
                </h2>
                <p>
                  Founders and researchers can publish articles directly from the Admin OS Blog
                  Publisher.
                </p>
              </div>
              <Link href="/#contact" className="btn mint" style={{ borderRadius: 999 }}>
                Collaborate with R&amp;D <ArrowUpRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="ri-blog-grid">
              {posts.map((post, idx) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="ri-blog-link">
                  <SpotlightCard
                    theme="dark"
                    spotlightColor="#5ef2c8"
                    intensity={0.16}
                    borderGlow={0.8}
                    className="ri-blog-card"
                    style={{
                      ["--spotlight-card-surface" as string]: "#0c191d",
                      ["--spotlight-card-border" as string]: "rgba(94, 242, 200, 0.16)",
                    }}
                  >
                    {idx === 0 && (
                      <BorderBeam
                        size={140}
                        duration={9}
                        colorFrom="#5ef2c8"
                        colorTo="#38bdf8"
                        borderWidth={1.5}
                      />
                    )}
                    <div className="ri-top">
                      <span className="mono ri-code" style={{ color: "var(--signal)" }}>
                        {post.category.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--mist-2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> {post.read_time}
                      </span>
                    </div>
                    <h2 style={{ fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.25, color: "var(--paper)", margin: "4px 0" }}>
                      {post.title}
                    </h2>
                    <p>{post.excerpt}</p>
                    {post.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {post.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="mono"
                            style={{
                              fontSize: 10,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(94,242,200,0.08)",
                              border: "1px solid rgba(94,242,200,0.22)",
                              color: "var(--mist)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="ri-blog-foot">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={12} /> {new Date(post.published_at).toLocaleDateString()}
                      </span>
                      <span className="ri-read-more">
                        <BookOpen size={13} /> Read <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter tagline={cms.copy.footerTagline} products={cms.products} services={cms.services} />
    </div>
  );
}
