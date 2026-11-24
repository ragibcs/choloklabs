import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudioHeader from "@/components/StudioHeader";
import SiteFooter from "@/components/SiteFooter";
import TeamProfileClient from "@/components/TeamProfileClient";
import { getCmsSiteData } from "@/lib/cms";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { query } from "@/lib/db";
import type { TeamMemberNode } from "@/app/api/team/route";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMemberByParam(param: string): Promise<TeamMemberNode | null> {
  try {
    const decoded = decodeURIComponent(param);
    const { rows } = await query<TeamMemberNode>(
      `SELECT
         e.id,
         e.user_id,
         e.employee_code,
         u.full_name,
         u.email,
         COALESCE(NULLIF(e.avatar_url, ''), u.avatar_url, '') AS avatar_url,
         u.role,
         e.department,
         COALESCE(e.field_unit, e.department) AS field_unit,
         e.job_title,
         e.employment_type,
         COALESCE(e.is_field_head, FALSE) AS is_field_head,
         e.parent_employee_id,
         COALESCE(e.manager_name, '') AS manager_name,
         COALESCE(e.github_username, '') AS github_username,
         COALESCE(e.linkedin_url, '') AS linkedin_url,
         COALESCE(e.bio, '') AS bio,
         COALESCE(e.skills, '[]'::jsonb) AS skills,
         COALESCE(e.tree_order, 0) AS tree_order,
         COALESCE(e.points, 0) AS points,
         COALESCE(e.contributions, 0) AS contributions,
         COALESCE(e.profile_details, '{}'::jsonb) AS profile_details,
         (SELECT COUNT(*)::int FROM employee_commits c WHERE c.employee_id = e.id) AS commits_count,
         (SELECT COUNT(*)::int FROM employee_tasks t WHERE t.employee_id = e.id AND t.status = 'done') AS tasks_done_count
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.status <> 'terminated'
         AND (
           e.id::text = $1
           OR LOWER(e.employee_code) = LOWER($1)
           OR LOWER(SPLIT_PART(u.email, '@', 1)) = LOWER($1)
           OR LOWER(REPLACE(u.full_name, ' ', '-')) = LOWER($1)
         )
       LIMIT 1`,
      [decoded]
    );

    if (rows.length === 0) return null;
    return {
      ...rows[0],
      skills: Array.isArray(rows[0].skills) ? rows[0].skills : [],
    };
  } catch (err) {
    console.error("[getMemberByParam error]", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberByParam(id);
  if (!member) {
    return { title: "Team Member Not Found" };
  }
  return {
    title: `${member.full_name} (${member.employee_code}) - CholokLabs`,
    description: `${member.job_title} at CholokLabs. ${member.bio || ""}`,
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [cms, user, member] = await Promise.all([
    getCmsSiteData(false),
    getCurrentUser().catch(() => null),
    getMemberByParam(id),
  ]);

  if (!member) {
    notFound();
  }

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;

  return (
    <div id="top" style={{ background: "#050914", minHeight: "100vh", color: "#f8fafc" }}>
      <StudioHeader dashboardHref={dashboardHref} userRole={user?.role ?? null} />
      <main
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(56,189,248,0.12), transparent 70%), #050914",
          paddingBlock: "clamp(40px, 5vw, 72px)",
          minHeight: "85vh",
        }}
      >
        <TeamProfileClient member={member} />
      </main>
      <SiteFooter tagline={cms.copy.footerTagline} products={cms.products} services={cms.services} />
    </div>
  );
}
