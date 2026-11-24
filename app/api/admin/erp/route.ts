import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "HR"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const [membersRes, commitsRes, datasetsRes, campaignsRes, internsRes, tasksRes] = await Promise.all([
      query(
        `SELECT
           e.id, e.user_id, e.employee_code, e.department,
           COALESCE(e.field_unit, e.department) AS field_unit,
           e.job_title, e.employment_type, e.status,
           COALESCE(e.is_field_head, FALSE) AS is_field_head,
           e.parent_employee_id,
           COALESCE(e.manager_name, '') AS manager_name,
           COALESCE(e.github_username, '') AS github_username,
           COALESCE(e.linkedin_url, '') AS linkedin_url,
           COALESCE(e.bio, '') AS bio,
           COALESCE(e.skills, '[]'::jsonb) AS skills,
           COALESCE(e.is_public_team, TRUE) AS is_public_team,
           COALESCE(e.tree_order, 0) AS tree_order,
           u.full_name, u.email, u.role,
           (SELECT COUNT(*)::int FROM employee_commits c WHERE c.employee_id = e.id) AS commits_count,
           (SELECT COUNT(*)::int FROM employee_tasks t WHERE t.employee_id = e.id AND t.status = 'done') AS tasks_done_count,
           (SELECT COUNT(*)::int FROM employee_tasks t WHERE t.employee_id = e.id AND t.status <> 'done') AS tasks_open_count,
           (SELECT COUNT(*)::int FROM employee_standups s WHERE s.employee_id = e.id) AS standups_count
         FROM employees e
         JOIN users u ON u.id = e.user_id
         ORDER BY COALESCE(e.tree_order, 0) ASC, e.employee_code ASC`
      ),
      query(
        `SELECT c.*, e.employee_code, e.field_unit, u.full_name
         FROM employee_commits c
         JOIN employees e ON e.id = c.employee_id
         JOIN users u ON u.id = e.user_id
         ORDER BY c.committed_at DESC
         LIMIT 60`
      ),
      query(`SELECT * FROM research_datasets ORDER BY code ASC`),
      query(`SELECT * FROM marketing_campaigns ORDER BY created_at DESC`),
      query(`SELECT * FROM intern_profiles ORDER BY created_at DESC`),
      query(
        `SELECT t.*, e.employee_code, COALESCE(t.field_unit, e.field_unit, e.department) AS field_unit, u.full_name AS employee_name
         FROM employee_tasks t
         JOIN employees e ON e.id = t.employee_id
         JOIN users u ON u.id = e.user_id
         ORDER BY t.created_at DESC
         LIMIT 50`
      ),
    ]);

    return NextResponse.json({
      members: membersRes.rows,
      commits: commitsRes.rows,
      datasets: datasetsRes.rows,
      campaigns: campaignsRes.rows,
      interns: internsRes.rows,
      tasks: tasksRes.rows,
    });
  } catch (err) {
    console.error("[admin/erp GET]", err);
    return NextResponse.json({ error: "Could not load ERP data." }, { status: 500 });
  }
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
      entity: "commit" | "sync_github" | "dataset" | "campaign" | "intern" | "field_task";
      data: Record<string, unknown>;
    };
    const d = body.data || {};

    if (body.entity === "commit") {
      const employeeId = String(d.employeeId || "");
      const message = String(d.commitMessage || "").trim();
      if (!employeeId || !message) {
        return NextResponse.json({ error: "Employee and commit/deliverable message are required." }, { status: 400 });
      }
      const sha =
        String(d.commitSha || "").trim() ||
        Math.random().toString(16).slice(2, 9);
      const { rows } = await query<{ id: string }>(
        `INSERT INTO employee_commits (employee_id, repo_name, branch, commit_sha, commit_message, commit_url, additions, deletions, pr_status, ci_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          employeeId,
          String(d.repoName || "choloklabs/core"),
          String(d.branch || "main"),
          sha,
          message,
          String(d.commitUrl || ""),
          Number(d.additions || 0),
          Number(d.deletions || 0),
          String(d.prStatus || "merged"),
          String(d.ciStatus || "passed"),
        ]
      );
      await logAudit(actor.id, "erp.commit_logged", "employee_commits", rows[0].id, { sha });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    if (body.entity === "sync_github") {
      const repo = String(d.repo || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
      const employeeId = String(d.employeeId || "");
      if (!repo || !repo.includes("/") || !employeeId) {
        return NextResponse.json({ error: "Provide a valid GitHub repo (owner/repo) and employee." }, { status: 400 });
      }
      const ghRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "CholokLabs-Company-OS" },
      });
      if (!ghRes.ok) {
        return NextResponse.json(
          { error: `GitHub API returned ${ghRes.status}. Verify the public repository name (owner/repo).` },
          { status: 400 }
        );
      }
      const commits = (await ghRes.json()) as Array<{
        sha: string;
        html_url: string;
        commit: { message: string; author?: { date?: string } };
      }>;
      let synced = 0;
      for (const c of commits) {
        const shortSha = (c.sha || "").slice(0, 7);
        if (!shortSha) continue;
        const exists = await query(`SELECT id FROM employee_commits WHERE commit_sha = $1 AND repo_name = $2 LIMIT 1`, [
          shortSha,
          repo,
        ]);
        if (exists.rows.length === 0) {
          await query(
            `INSERT INTO employee_commits (employee_id, repo_name, branch, commit_sha, commit_message, commit_url, pr_status, ci_status, committed_at)
             VALUES ($1, $2, 'main', $3, $4, $5, 'merged', 'passed', COALESCE($6::timestamptz, NOW()))`,
            [
              employeeId,
              repo,
              shortSha,
              (c.commit?.message || "Git commit").split("\n")[0].slice(0, 220),
              c.html_url || "",
              c.commit?.author?.date || null,
            ]
          );
          synced++;
        }
      }
      await logAudit(actor.id, "erp.github_synced", "employee_commits", repo, { synced });
      return NextResponse.json({ ok: true, synced });
    }

    if (body.entity === "field_task") {
      const employeeId = String(d.employeeId || "");
      const title = String(d.title || "").trim();
      if (!employeeId || !title) {
        return NextResponse.json({ error: "Assignee and task title are required." }, { status: 400 });
      }
      const taskCode =
        String(d.taskCode || "").trim().toUpperCase() ||
        `CL-${Math.floor(100 + Math.random() * 900)}`;
      const { rows } = await query<{ id: string }>(
        `INSERT INTO employee_tasks (employee_id, assigned_by, task_code, field_unit, title, description, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date)
         RETURNING id`,
        [
          employeeId,
          actor.id,
          taskCode,
          String(d.fieldUnit || "Engineering"),
          title,
          String(d.description || ""),
          String(d.priority || "medium"),
          d.dueDate ? String(d.dueDate) : null,
        ]
      );
      await logAudit(actor.id, "erp.field_task_assigned", "employee_tasks", rows[0].id, { taskCode });
      return NextResponse.json({ ok: true, id: rows[0].id, taskCode }, { status: 201 });
    }

    if (body.entity === "dataset") {
      const code = String(d.code || "").trim().toUpperCase() || `CL-CORPUS-${Math.floor(10 + Math.random() * 90)}`;
      const name = String(d.name || "").trim();
      if (!name) return NextResponse.json({ error: "Dataset name required." }, { status: 400 });
      const { rows } = await query<{ id: string }>(
        `INSERT INTO research_datasets (code, name, category, lead_name, target_samples, collected_samples, verified_samples, unit_label, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          code,
          name,
          String(d.category || "Bangla Audio Corpus"),
          String(d.leadName || actor.fullName),
          Number(d.targetSamples || 10000),
          Number(d.collectedSamples || 0),
          Number(d.verifiedSamples || 0),
          String(d.unitLabel || "audio clips"),
          String(d.status || "collecting"),
          String(d.description || ""),
        ]
      );
      await logAudit(actor.id, "erp.dataset_created", "research_datasets", rows[0].id, { code });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    if (body.entity === "campaign") {
      const name = String(d.name || "").trim();
      if (!name) return NextResponse.json({ error: "Campaign name required." }, { status: 400 });
      const { rows } = await query<{ id: string }>(
        `INSERT INTO marketing_campaigns (name, product_target, channel, owner_name, budget_usd, leads_count, conversions_count, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          name,
          String(d.productTarget || "Porikkha"),
          String(d.channel || "Social & Content"),
          String(d.ownerName || actor.fullName),
          Number(d.budgetUsd || 0),
          Number(d.leadsCount || 0),
          Number(d.conversionsCount || 0),
          String(d.status || "active"),
          String(d.notes || ""),
        ]
      );
      await logAudit(actor.id, "erp.campaign_created", "marketing_campaigns", rows[0].id, { name });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    if (body.entity === "intern") {
      const fullName = String(d.fullName || "").trim();
      const email = String(d.email || "").trim();
      if (!fullName || !email) return NextResponse.json({ error: "Intern name and email required." }, { status: 400 });
      const { rows } = await query<{ id: string }>(
        `INSERT INTO intern_profiles (full_name, email, university, field_unit, cohort, mentor_name, project_title, progress, performance_score, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          fullName,
          email,
          String(d.university || "Daffodil International University (DIU)"),
          String(d.fieldUnit || "Engineering"),
          String(d.cohort || "2026 Cohort"),
          String(d.mentorName || actor.fullName),
          String(d.projectTitle || ""),
          Number(d.progress || 10),
          Number(d.performanceScore || 85),
          String(d.status || "active"),
        ]
      );
      await logAudit(actor.id, "erp.intern_enrolled", "intern_profiles", rows[0].id, { fullName });
      return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown ERP entity" }, { status: 400 });
  } catch (err) {
    console.error("[admin/erp POST]", err);
    return NextResponse.json({ error: "Operation failed." }, { status: 500 });
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
      entity: "tree_node" | "dataset" | "campaign" | "intern";
      id: string;
      data: Record<string, unknown>;
    };
    const d = body.data || {};
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (body.entity === "tree_node") {
      const skills = Array.isArray(d.skills)
        ? d.skills
        : typeof d.skillsText === "string"
          ? d.skillsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null;

      await query(
        `UPDATE employees
         SET parent_employee_id = CASE WHEN $1 = 'ROOT' THEN NULL WHEN $1 <> '' THEN $1::uuid ELSE parent_employee_id END,
             field_unit = COALESCE($2, field_unit),
             job_title = COALESCE($3, job_title),
             is_field_head = COALESCE($4, is_field_head),
             github_username = COALESCE($5, github_username),
             linkedin_url = COALESCE($6, linkedin_url),
             bio = COALESCE($7, bio),
             skills = COALESCE($8::jsonb, skills),
             is_public_team = COALESCE($9, is_public_team),
             tree_order = COALESCE($10, tree_order),
             updated_at = NOW()
         WHERE id = $11`,
        [
          d.parentEmployeeId === null ? "ROOT" : d.parentEmployeeId ? String(d.parentEmployeeId) : "",
          d.fieldUnit ? String(d.fieldUnit) : null,
          d.jobTitle ? String(d.jobTitle) : null,
          typeof d.isFieldHead === "boolean" ? d.isFieldHead : null,
          d.githubUsername !== undefined ? String(d.githubUsername) : null,
          d.linkedinUrl !== undefined ? String(d.linkedinUrl) : null,
          d.bio !== undefined ? String(d.bio) : null,
          skills ? JSON.stringify(skills) : null,
          typeof d.isPublicTeam === "boolean" ? d.isPublicTeam : null,
          d.treeOrder !== undefined ? Number(d.treeOrder) : null,
          body.id,
        ]
      );
      await logAudit(actor.id, "erp.tree_node_updated", "employees", body.id);
      return NextResponse.json({ ok: true });
    }

    if (body.entity === "dataset") {
      await query(
        `UPDATE research_datasets
         SET collected_samples = COALESCE($1, collected_samples),
             verified_samples = COALESCE($2, verified_samples),
             status = COALESCE($3, status),
             updated_at = NOW()
         WHERE id = $4`,
        [
          d.collectedSamples !== undefined ? Number(d.collectedSamples) : null,
          d.verifiedSamples !== undefined ? Number(d.verifiedSamples) : null,
          d.status ? String(d.status) : null,
          body.id,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    if (body.entity === "campaign") {
      await query(
        `UPDATE marketing_campaigns
         SET leads_count = COALESCE($1, leads_count),
             conversions_count = COALESCE($2, conversions_count),
             status = COALESCE($3, status)
         WHERE id = $4`,
        [
          d.leadsCount !== undefined ? Number(d.leadsCount) : null,
          d.conversionsCount !== undefined ? Number(d.conversionsCount) : null,
          d.status ? String(d.status) : null,
          body.id,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    if (body.entity === "intern") {
      await query(
        `UPDATE intern_profiles
         SET progress = COALESCE($1, progress),
             performance_score = COALESCE($2, performance_score),
             status = COALESCE($3, status)
         WHERE id = $4`,
        [
          d.progress !== undefined ? Number(d.progress) : null,
          d.performanceScore !== undefined ? Number(d.performanceScore) : null,
          d.status ? String(d.status) : null,
          body.id,
        ]
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
  } catch (err) {
    console.error("[admin/erp PATCH]", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
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

  const { entity, id } = (await req.json()) as {
    entity: "commit" | "dataset" | "campaign" | "intern";
    id: string;
  };
  const tableMap = {
    commit: "employee_commits",
    dataset: "research_datasets",
    campaign: "marketing_campaigns",
    intern: "intern_profiles",
  } as const;
  const table = tableMap[entity];
  if (!table || !id) return NextResponse.json({ error: "Invalid delete target" }, { status: 400 });

  await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  await logAudit(actor.id, `erp.${entity}_deleted`, table, id);
  return NextResponse.json({ ok: true });
}
