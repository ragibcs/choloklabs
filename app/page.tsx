import StudioHeader from "@/components/StudioHeader";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/Hero";
import Catalog from "@/components/Catalog";
import ResearchInnovation from "@/components/ResearchInnovation";
import { Contact } from "@/components/Contact";
import Statement from "@/components/Statement";
import MotionProvider from "@/components/MotionProvider";
import ClickSpark from "@/components/ClickSpark";
import { getCmsSiteData } from "@/lib/cms";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { getPublishedBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [cms, user, posts] = await Promise.all([
    getCmsSiteData(false),
    getCurrentUser().catch(() => null),
    getPublishedBlogPosts(3),
  ]);

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;
  const interests = [
    ...cms.products.map((p) => p.name),
    "Bangla Audio Corpus & Datasets",
    "Research & Innovation Partnership",
    ...cms.services.map((s) => s.name),
    "Something else",
  ];

  return (
    <div id="top">
      <MotionProvider />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <StudioHeader dashboardHref={dashboardHref} userRole={user?.role ?? null} />
      <ClickSpark
        sparkColor={["#5ef2c8", "#38bdf8"]}
        sparkSize={9}
        sparkRadius={22}
        sparkCount={9}
        duration={420}
      >
        <main id="main">
          <Hero copy={cms.copy} />
          <Statement eyebrow={cms.copy.statementEyebrow} body={cms.copy.statementBody} />
          <Catalog cms={cms} />
          <ResearchInnovation posts={posts} />
          <Contact
            heading={cms.copy.contactHeading}
            subheading={cms.copy.contactSubheading}
            interests={interests}
          />
        </main>
      </ClickSpark>
      <SiteFooter
        tagline={cms.copy.footerTagline}
        products={cms.products}
        services={cms.services}
      />
    </div>
  );
}
