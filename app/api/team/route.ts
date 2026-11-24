import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TeamMemberNode {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  department: string;
  field_unit: string;
  job_title: string;
  employment_type: string;
  is_field_head: boolean;
  parent_employee_id: string | null;
  manager_name: string;
  github_username: string;
  linkedin_url: string;
  bio: string;
  skills: string[];
  tree_order: number;
  commits_count: number;
  tasks_done_count: number;
  points?: number;
  contributions?: number;
  profile_details?: any;
}

export async function GET() {
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

    const members = rows.map((r) => ({
      ...r,
      skills: Array.isArray(r.skills) ? r.skills : [],
    }));

    return NextResponse.json({ members });
  } catch (err) {
    console.error("[api/team GET]", err);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}
