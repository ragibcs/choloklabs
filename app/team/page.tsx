import type { Metadata } from "next";
import StudioHeader from "@/components/StudioHeader";
import SiteFooter from "@/components/SiteFooter";
import TeamTreeClient from "@/components/TeamTreeClient";
import { getCmsSiteData } from "@/lib/cms";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { query } from "@/lib/db";
import type { TeamMemberNode } from "@/app/api/team/route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team & Organizational Hierarchy",
  description:
    "Explore the CholokLabs leadership, field heads, engineers, and research wings across AI/ML, Bangla audio datasets, embedded systems, and silicon architecture.",
};

async function getTeamTreeMembers(): Promise<TeamMemberNode[]> {
  try {
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
       WHERE e.status <> 'terminated' AND COALESCE(e.is_public_team, TRUE) = TRUE
       ORDER BY COALESCE(e.tree_order, 0) ASC, e.employee_code ASC`
    );
    return rows.map((r) => ({
      ...r,
      skills: Array.isArray(r.skills) ? r.skills : [],
    }));
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const [cms, user, members] = await Promise.all([
    getCmsSiteData(false),
    getCurrentUser().catch(() => null),
    getTeamTreeMembers(),
  ]);

  const dashboardHref = user ? dashboardPathForRole(user.role) : null;

  return (
    <div id="top">
      <StudioHeader dashboardHref={dashboardHref} userRole={user?.role ?? null} />
      <main
        style={{
          minHeight: "80svh",
          background:
            "radial-gradient(ellipse 68% 48% at 18% 0%, rgba(94,242,200,0.15), transparent 65%), radial-gradient(ellipse 55% 45% at 85% 25%, rgba(56,189,248,0.11), transparent 65%), var(--ink)",
          color: "var(--paper)",
          paddingBlock: "clamp(56px, 7vw, 96px)",
        }}
      >
        <div className="wrap">
          <div className="eyebrow" style={{ color: "var(--signal)" }}>
            <i style={{ background: "var(--signal)" }} />
            CHOLOKLABS ORGANIZATION TREE &amp; DIRECTORY
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
            One engineering tree, software to silicon<span>.</span>
          </h1>
          <p style={{ color: "var(--mist)", fontSize: 17, maxWidth: 680, marginBottom: 38 }}>
            Click any node in our organizational hierarchy to inspect member profiles, field-wing
            leadership, core competencies, and verified engineering deliverables.
          </p>

          <TeamTreeClient members={members} />
        </div>
      </main>
      <SiteFooter tagline={cms.copy.footerTagline} products={cms.products} services={cms.services} />
    </div>
  );
}
