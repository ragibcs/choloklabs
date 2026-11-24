import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as {
      repository?: { full_name?: string };
      ref?: string;
      commits?: Array<{
        id: string;
        message: string;
        url?: string;
        timestamp?: string;
        author?: { username?: string; email?: string };
        added?: string[];
        modified?: string[];
        removed?: string[];
      }>;
    };

    const repoName = payload.repository?.full_name || "choloklabs/repo";
    const branch = (payload.ref || "refs/heads/main").replace("refs/heads/", "");
    const commits = Array.isArray(payload.commits) ? payload.commits : [];

    let recorded = 0;
    for (const c of commits) {
      const ghUser = c.author?.username || "";
      const ghEmail = c.author?.email || "";

      const empRes = await query<{ id: string }>(
        `SELECT e.id
         FROM employees e
         JOIN users u ON u.id = e.user_id
         WHERE (LOWER(e.github_username) = LOWER($1) AND $1 <> '')
            OR (LOWER(u.email) = LOWER($2) AND $2 <> '')
         LIMIT 1`,
        [ghUser, ghEmail]
      );

      let employeeId = empRes.rows[0]?.id;
      if (!employeeId) {
        const fallback = await query<{ id: string }>(`SELECT id FROM employees ORDER BY tree_order ASC LIMIT 1`);
        employeeId = fallback.rows[0]?.id;
      }
      if (!employeeId) continue;

      const shortSha = (c.id || "").slice(0, 7) || Math.random().toString(16).slice(2, 9);
      await query(
        `INSERT INTO employee_commits (employee_id, repo_name, branch, commit_sha, commit_message, commit_url, additions, deletions, pr_status, ci_status, committed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'merged', 'passed', COALESCE($9::timestamptz, NOW()))`,
        [
          employeeId,
          repoName,
          branch,
          shortSha,
          (c.message || "Git push").split("\n")[0].slice(0, 220),
          c.url || "",
          (c.added?.length || 0) + (c.modified?.length || 0),
          c.removed?.length || 0,
          c.timestamp || null,
        ]
      );
      recorded++;
    }

    return NextResponse.json({ ok: true, recorded });
  } catch (err) {
    console.error("[webhooks/github POST]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
