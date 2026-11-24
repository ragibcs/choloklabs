"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  Code2,
  Database,
  GitBranch,
  GitCommitHorizontal,
  GraduationCap,
  Megaphone,
  Network,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

interface ErpMember {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  field_unit: string;
  job_title: string;
  is_field_head: boolean;
  parent_employee_id: string | null;
  github_username: string;
  linkedin_url: string;
  bio: string;
  skills: string[];
  is_public_team: boolean;
  tree_order: number;
  commits_count: number;
  tasks_done_count: number;
  tasks_open_count: number;
  standups_count: number;
}

interface ErpCommit {
  id: string;
  employee_id: string;
  employee_code: string;
  full_name: string;
  field_unit: string;
  repo_name: string;
  branch: string;
  commit_sha: string;
  commit_message: string;
  commit_url: string;
  additions: number;
  deletions: number;
  pr_status: string;
  ci_status: string;
  committed_at: string;
}

interface ErpDataset {
  id: string;
  code: string;
  name: string;
  category: string;
  lead_name: string;
  target_samples: number;
  collected_samples: number;
  verified_samples: number;
  unit_label: string;
  status: string;
  description: string;
}

interface ErpCampaign {
  id: string;
  name: string;
  product_target: string;
  channel: string;
  owner_name: string;
  budget_usd: string;
  leads_count: number;
  conversions_count: number;
  status: string;
  notes: string;
}

interface ErpIntern {
  id: string;
  full_name: string;
  email: string;
  university: string;
  field_unit: string;
  cohort: string;
  mentor_name: string;
  project_title: string;
  progress: number;
  performance_score: number;
  status: string;
}

const FIELD_WINGS = [
  "Executive & Architecture",
  "Software & Product Engineering",
  "Embedded, GPU & Silicon",
  "Research & Bangla Datasets",
  "Product Marketing & Growth",
  "HR & People Operations",
  "Internship & Fellowship",
] as const;

export default function ErpCommandPanel({
  mode,
  onNotify,
}: {
  mode: "org_tree" | "commits" | "datasets" | "marketing" | "interns";
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [members, setMembers] = useState<ErpMember[]>([]);
  const [commits, setCommits] = useState<ErpCommit[]>([]);
  const [datasets, setDatasets] = useState<ErpDataset[]>([]);
  const [campaigns, setCampaigns] = useState<ErpCampaign[]>([]);
  const [interns, setInterns] = useState<ErpIntern[]>([]);
  const [saving, setSaving] = useState(false);

  // Selected member for Org Tree profile editor
  const [editingMemberId, setEditingMemberId] = useState<string>("");
  const [nodeForm, setNodeForm] = useState({
    parentEmployeeId: "ROOT",
    fieldUnit: "Software & Product Engineering",
    jobTitle: "",
    isFieldHead: false,
    githubUsername: "",
    linkedinUrl: "",
    bio: "",
    skillsText: "",
    isPublicTeam: true,
    treeOrder: 10,
  });

  // GitHub Sync & Manual Commit state
  const [ghSyncForm, setGhSyncForm] = useState({ employeeId: "", repo: "" });
  const [commitForm, setCommitForm] = useState({
    employeeId: "",
    repoName: "choloklabs/porikkha",
    branch: "main",
    commitSha: "",
    commitMessage: "",
    commitUrl: "",
    additions: 45,
    deletions: 8,
    prStatus: "merged",
  });
  const [taskForm, setTaskForm] = useState({
    employeeId: "",
    fieldUnit: "Software & Product Engineering",
    taskCode: "",
    title: "",
    description: "",
    priority: "high",
    dueDate: "",
  });

  // Dataset form
  const [dsForm, setDsForm] = useState({
    code: "",
    name: "",
    category: "Bangla Audio Corpus",
    leadName: "Ragib Hasan",
    targetSamples: 10000,
    collectedSamples: 0,
    verifiedSamples: 0,
    unitLabel: "audio clips",
    description: "",
  });

  // Marketing campaign form
  const [campForm, setCampForm] = useState({
    name: "",
    productTarget: "Porikkha",
    channel: "University & Institutional Outreach",
    ownerName: "Rakibul Hasan",
    budgetUsd: 500,
    leadsCount: 0,
    conversionsCount: 0,
    notes: "",
  });

  // Intern form
  const [internForm, setInternForm] = useState({
    fullName: "",
    email: "",
    university: "Daffodil International University (DIU)",
    fieldUnit: "Research & Bangla Datasets",
    cohort: "2026 Cohort",
    mentorName: "Ragib Hasan",
    projectTitle: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/erp");
    if (res.ok) {
      const out = await res.json();
      setMembers(
        (out.members || []).map((m: ErpMember) => ({
          ...m,
          skills: Array.isArray(m.skills) ? m.skills : [],
        }))
      );
      setCommits(out.commits || []);
      setDatasets(out.datasets || []);
      setCampaigns(out.campaigns || []);
      setInterns(out.interns || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function selectMemberForEdit(m: ErpMember) {
    setEditingMemberId(m.id);
    setNodeForm({
      parentEmployeeId: m.parent_employee_id || "ROOT",
      fieldUnit: m.field_unit || m.department || "Software & Product Engineering",
      jobTitle: m.job_title || "",
      isFieldHead: Boolean(m.is_field_head),
      githubUsername: m.github_username || "",
      linkedinUrl: m.linkedin_url || "",
      bio: m.bio || "",
      skillsText: (m.skills || []).join(", "),
      isPublicTeam: m.is_public_team !== false,
      treeOrder: m.tree_order || 0,
    });
  }

  async function saveTreeNode(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMemberId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "tree_node",
          id: editingMemberId,
          data: {
            parentEmployeeId: nodeForm.parentEmployeeId === "ROOT" ? null : nodeForm.parentEmployeeId,
            fieldUnit: nodeForm.fieldUnit,
            jobTitle: nodeForm.jobTitle,
            isFieldHead: nodeForm.isFieldHead,
            githubUsername: nodeForm.githubUsername,
            linkedinUrl: nodeForm.linkedinUrl,
            bio: nodeForm.bio,
            skillsText: nodeForm.skillsText,
            isPublicTeam: nodeForm.isPublicTeam,
            treeOrder: Number(nodeForm.treeOrder || 0),
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to update org tree node");
      onNotify("ok", "Org Tree hierarchy & member profile updated live on /team.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function syncGithub(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "sync_github", data: ghSyncForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "GitHub sync failed");
      onNotify("ok", `Synced ${out.synced} new commits from GitHub.`);
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSaving(false);
    }
  }

  async function logManualCommit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "commit", data: commitForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setCommitForm({ ...commitForm, commitSha: "", commitMessage: "", commitUrl: "" });
      onNotify("ok", "Verified commit / deliverable recorded.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function assignFieldTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "field_task", data: taskForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setTaskForm({ ...taskForm, taskCode: "", title: "", description: "" });
      onNotify("ok", `Task ${out.taskCode} distributed to Field Wing.`);
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function createDataset(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "dataset", data: dsForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setDsForm({ ...dsForm, code: "", name: "", description: "" });
      onNotify("ok", "Research dataset corpus created.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateDataset(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/erp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "dataset", id, data: patch }),
    });
    if (res.ok) {
      onNotify("ok", "Corpus metrics updated.");
      load();
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "campaign", data: campForm }),
      });
      if (!res.ok) throw new Error("Failed");
      setCampForm({ ...campForm, name: "", notes: "" });
      onNotify("ok", "Marketing campaign launched.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaign(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/erp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "campaign", id, data: patch }),
    });
    if (res.ok) {
      onNotify("ok", "Campaign updated.");
      load();
    }
  }

  async function createIntern(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "intern", data: internForm }),
      });
      if (!res.ok) throw new Error("Failed");
      setInternForm({ ...internForm, fullName: "", email: "", projectTitle: "" });
      onNotify("ok", "Intern enrolled in cohort.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateIntern(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/erp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "intern", id, data: patch }),
    });
    if (res.ok) {
      onNotify("ok", "Intern record updated.");
      load();
    }
  }

  async function deleteEntity(entity: "commit" | "dataset" | "campaign" | "intern", id: string) {
    if (!confirm(`Delete this ${entity}?`)) return;
    const res = await fetch("/api/admin/erp", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    if (res.ok) {
      onNotify("ok", `${entity} deleted.`);
      load();
    }
  }

  // MODE 1: ORG TREE & FIELD HEADS MANAGER
  if (mode === "org_tree") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Organization Tree, Field Heads &amp; Public Profiles ({members.length})</h2>
              <p>
                Click any member to assign their Parent Node in the tree, Field Wing, Field Head
                badge, GitHub username, bio, and technical skills for the live /team tree
              </p>
            </div>
            <Link href="/team" target="_blank" className="cl-btn mint sm">
              <Network size={14} /> Open Live /team Tree <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Code &amp; Name</th>
                  <th>Field Wing</th>
                  <th>Reports To (Tree Parent)</th>
                  <th>Field Head</th>
                  <th>GitHub</th>
                  <th>Public /team</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const parent = members.find((p) => p.id === m.parent_employee_id);
                  return (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.full_name}</strong>
                        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                          {m.employee_code} · {m.job_title}
                        </div>
                      </td>
                      <td>
                        <span className="cl-pill dark">{m.field_unit}</span>
                      </td>
                      <td>{parent ? `${parent.full_name} (${parent.employee_code})` : "Root (Founder / Board)"}</td>
                      <td>
                        {m.is_field_head ? (
                          <span className="cl-pill mint">
                            <Sparkles size={11} /> Field Head
                          </span>
                        ) : (
                          <span className="cl-pill">Member</span>
                        )}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {m.github_username ? `@${m.github_username.replace(/^@/, "")}` : "—"}
                      </td>
                      <td>
                        <span className={`cl-pill ${m.is_public_team ? "mint" : "warn"}`}>
                          {m.is_public_team ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cl-btn outline sm"
                          onClick={() => selectMemberForEdit(m)}
                        >
                          Configure Node
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {editingMemberId && (
          <form className="cl-card" onSubmit={saveTreeNode}>
            <div className="cl-card-head">
              <div>
                <h2>
                  Edit Tree Node &amp; Profile:{" "}
                  {members.find((m) => m.id === editingMemberId)?.full_name}
                </h2>
                <p>Changes update both the internal ERP hierarchy and the public /team tree</p>
              </div>
              <button
                type="button"
                className="cl-btn outline sm"
                onClick={() => setEditingMemberId("")}
              >
                Close Editor
              </button>
            </div>

            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Reports To (Parent Node in Org Tree)</label>
                <select
                  className="cl-select"
                  value={nodeForm.parentEmployeeId}
                  onChange={(e) => setNodeForm({ ...nodeForm, parentEmployeeId: e.target.value })}
                >
                  <option value="ROOT">Root Node (Top of Tree)</option>
                  {members
                    .filter((m) => m.id !== editingMemberId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.employee_code} · {m.job_title})
                      </option>
                    ))}
                </select>
              </div>

              <div className="cl-field">
                <label>Field Wing / Division</label>
                <select
                  className="cl-select"
                  value={nodeForm.fieldUnit}
                  onChange={(e) => setNodeForm({ ...nodeForm, fieldUnit: e.target.value })}
                >
                  {FIELD_WINGS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cl-field">
                <label>Official Title</label>
                <input
                  className="cl-input"
                  value={nodeForm.jobTitle}
                  onChange={(e) => setNodeForm({ ...nodeForm, jobTitle: e.target.value })}
                />
              </div>

              <div className="cl-field">
                <label>Tree Display Order (1 = First)</label>
                <input
                  type="number"
                  className="cl-input"
                  value={nodeForm.treeOrder}
                  onChange={(e) => setNodeForm({ ...nodeForm, treeOrder: Number(e.target.value) })}
                />
              </div>

              <div className="cl-field">
                <label>GitHub Username (for Commit Sync)</label>
                <input
                  className="cl-input"
                  placeholder="e.g., ragibhasan"
                  value={nodeForm.githubUsername}
                  onChange={(e) => setNodeForm({ ...nodeForm, githubUsername: e.target.value })}
                />
              </div>

              <div className="cl-field">
                <label>LinkedIn Profile URL</label>
                <input
                  className="cl-input"
                  placeholder="https://linkedin.com/in/..."
                  value={nodeForm.linkedinUrl}
                  onChange={(e) => setNodeForm({ ...nodeForm, linkedinUrl: e.target.value })}
                />
              </div>

              <div className="cl-field full">
                <label>Skills &amp; Competencies (comma-separated)</label>
                <input
                  className="cl-input"
                  placeholder="Systems Architecture, CUDA, Bangla ASR, Next.js, Verilog"
                  value={nodeForm.skillsText}
                  onChange={(e) => setNodeForm({ ...nodeForm, skillsText: e.target.value })}
                />
              </div>

              <div className="cl-field full">
                <label>Public Biography</label>
                <textarea
                  rows={3}
                  className="cl-textarea"
                  placeholder="Short engineering or leadership bio shown on the /team profile modal..."
                  value={nodeForm.bio}
                  onChange={(e) => setNodeForm({ ...nodeForm, bio: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={nodeForm.isFieldHead}
                  onChange={(e) => setNodeForm({ ...nodeForm, isFieldHead: e.target.checked })}
                />
                <strong>Designated Field Head / Team Leader</strong>
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={nodeForm.isPublicTeam}
                  onChange={(e) => setNodeForm({ ...nodeForm, isPublicTeam: e.target.checked })}
                />
                Show on public <code>/team</code> org tree
              </label>
              <button type="submit" className="cl-btn primary" disabled={saving} style={{ marginLeft: "auto" }}>
                <Save size={15} /> Save Tree Node &amp; Profile
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // MODE 2: GIT COMMITS, PERFORMANCE & FIELD-HEAD TASK DISTRIBUTION
  if (mode === "commits") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={syncGithub}>
            <div className="cl-card-head">
              <div>
                <h2>
                  <Code2 size={18} style={{ display: "inline", marginRight: 6 }} />
                  Live GitHub Repository Commit Sync
                </h2>
                <p>Pull real commits directly from GitHub REST API into an engineer&apos;s ledger</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Engineer / Team Member</label>
                <select
                  required
                  className="cl-select"
                  value={ghSyncForm.employeeId}
                  onChange={(e) => setGhSyncForm({ ...ghSyncForm, employeeId: e.target.value })}
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field">
                <label>GitHub Repository (owner/repo)</label>
                <input
                  required
                  className="cl-input"
                  placeholder="e.g., vercel/next.js or owner/repo"
                  value={ghSyncForm.repo}
                  onChange={(e) => setGhSyncForm({ ...ghSyncForm, repo: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                Webhook URL: <code>/api/webhooks/github</code>
              </span>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <RefreshCw size={14} /> Sync Commits
              </button>
            </div>
          </form>

          <form className="cl-card" onSubmit={assignFieldTask}>
            <div className="cl-card-head">
              <div>
                <h2>Field-Head Task Distribution</h2>
                <p>Assign tasks with verification keys (CL-XXX) across company wings</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Field Wing</label>
                <select
                  className="cl-select"
                  value={taskForm.fieldUnit}
                  onChange={(e) => setTaskForm({ ...taskForm, fieldUnit: e.target.value })}
                >
                  {FIELD_WINGS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field">
                <label>Assign To</label>
                <select
                  required
                  className="cl-select"
                  value={taskForm.employeeId}
                  onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })}
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.field_unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field">
                <label>Task Title / Deliverable</label>
                <input
                  required
                  className="cl-input"
                  placeholder="e.g., Record 500 Sylheti dialect prompts"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Priority &amp; Due Date</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    className="cl-select"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="date"
                    className="cl-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn mint" disabled={saving}>
                <Plus size={15} /> Distribute Task
              </button>
            </div>
          </form>
        </div>

        {/* Team Performance & Remote Velocity Scorecard */}
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Team Commit, Delivery &amp; Remote Work Scorecard</h2>
              <p>Outcome-based engineering &amp; operational performance across all Field Wings</p>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Field Wing</th>
                  <th>Verified Commits</th>
                  <th>Shipped Tasks</th>
                  <th>Active Workload</th>
                  <th>Standups Logged</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.full_name}</strong>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {m.employee_code} · {m.job_title}
                      </div>
                    </td>
                    <td>{m.field_unit}</td>
                    <td>
                      <span className="cl-pill mint">
                        <GitCommitHorizontal size={12} /> {m.commits_count} commits
                      </span>
                    </td>
                    <td>
                      <strong>{m.tasks_done_count}</strong> completed
                    </td>
                    <td>
                      <span className={`cl-pill ${m.tasks_open_count > 4 ? "warn" : ""}`}>
                        {m.tasks_open_count} open
                      </span>
                    </td>
                    <td>{m.standups_count} check-ins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={logManualCommit}>
            <div className="cl-card-head">
              <div>
                <h2>Log Commit or Verified Deliverable</h2>
                <p>Record code commits, hardware tests, dataset batches, or marketing launches</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Team Member</label>
                <select
                  required
                  className="cl-select"
                  value={commitForm.employeeId}
                  onChange={(e) => setCommitForm({ ...commitForm, employeeId: e.target.value })}
                >
                  <option value="">Choose member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field">
                <label>Repository / Project Stream</label>
                <input
                  required
                  className="cl-input"
                  placeholder="choloklabs/porikkha or bangla-corpus"
                  value={commitForm.repoName}
                  onChange={(e) => setCommitForm({ ...commitForm, repoName: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Commit SHA / Deliverable Ref</label>
                <input
                  className="cl-input"
                  placeholder="auto-generated if blank"
                  value={commitForm.commitSha}
                  onChange={(e) => setCommitForm({ ...commitForm, commitSha: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Verification Type</label>
                <select
                  className="cl-select"
                  value={commitForm.prStatus}
                  onChange={(e) => setCommitForm({ ...commitForm, prStatus: e.target.value })}
                >
                  <option value="merged">PR Merged &amp; CI Green</option>
                  <option value="commit">Direct Commit</option>
                  <option value="deliverable">Verified Field Deliverable</option>
                </select>
              </div>
              <div className="cl-field full">
                <label>Commit Message / Work Summary</label>
                <input
                  required
                  className="cl-input"
                  placeholder="e.g., feat(corpus): add 1,200 verified Chittagonian audio transcripts (CL-104)"
                  value={commitForm.commitMessage}
                  onChange={(e) => setCommitForm({ ...commitForm, commitMessage: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <GitBranch size={15} /> Record Commit
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Recent Commit &amp; Deliverable Stream ({commits.length})</h2>
              </div>
            </div>
            {commits.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                No commits recorded yet. Sync a GitHub repository or log a deliverable on the left.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
                {commits.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="cl-pill dark">{c.commit_sha}</span>
                        <strong>{c.full_name}</strong>
                        <span className="mono" style={{ fontSize: 11, color: "var(--signal-deep)" }}>
                          {c.repo_name}
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, marginTop: 5 }}>{c.commit_message}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>
                        {c.pr_status.toUpperCase()} · CI: {c.ci_status.toUpperCase()} ·{" "}
                        {new Date(c.committed_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cl-btn danger sm"
                      style={{ height: "fit-content" }}
                      onClick={() => deleteEntity("commit", c.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MODE 3: RESEARCH & BANGLA AUDIO CORPUS TRACKER
  if (mode === "datasets") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <form className="cl-card" onSubmit={createDataset}>
          <div className="cl-card-head">
            <div>
              <h2>
                <AudioLines size={18} style={{ display: "inline", marginRight: 6 }} />
                Launch Research Corpus / Dataset Collection Track
              </h2>
              <p>Track Bangla Audio Corpus recording, phonetic annotation, OCR, and vision datasets</p>
            </div>
          </div>
          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Dataset Name</label>
              <input
                required
                className="cl-input"
                placeholder="e.g., Sylheti & Chittagonian Speech Corpus v2"
                value={dsForm.name}
                onChange={(e) => setDsForm({ ...dsForm, name: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Category</label>
              <select
                className="cl-select"
                value={dsForm.category}
                onChange={(e) => setDsForm({ ...dsForm, category: e.target.value })}
              >
                <option value="Bangla Audio Corpus">Bangla Audio Corpus</option>
                <option value="Vision & OCR Dataset">Vision &amp; OCR Dataset</option>
                <option value="Edge AI & IIoT">Edge AI &amp; IIoT</option>
                <option value="NLP & Assessment">NLP &amp; Assessment</option>
              </select>
            </div>
            <div className="cl-field">
              <label>Target Sample Count</label>
              <input
                type="number"
                min={100}
                className="cl-input"
                value={dsForm.targetSamples}
                onChange={(e) => setDsForm({ ...dsForm, targetSamples: Number(e.target.value) })}
              />
            </div>
            <div className="cl-field">
              <label>Unit Label &amp; Lead Researcher</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="cl-input"
                  placeholder="audio clips / hours"
                  value={dsForm.unitLabel}
                  onChange={(e) => setDsForm({ ...dsForm, unitLabel: e.target.value })}
                />
                <input
                  className="cl-input"
                  placeholder="Lead name"
                  value={dsForm.leadName}
                  onChange={(e) => setDsForm({ ...dsForm, leadName: e.target.value })}
                />
              </div>
            </div>
            <div className="cl-field full">
              <label>Methodology &amp; Scope</label>
              <input
                className="cl-input"
                placeholder="Recording specs, sample rate (16kHz/48kHz), annotation protocol..."
                value={dsForm.description}
                onChange={(e) => setDsForm({ ...dsForm, description: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              <Database size={15} /> Create Corpus Tracker
            </button>
          </div>
        </form>

        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Active Research Datasets &amp; Corpora ({datasets.length})</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {datasets.map((ds) => {
              const pct = Math.min(100, Math.round((ds.collected_samples / Math.max(1, ds.target_samples)) * 100));
              const verPct = Math.min(100, Math.round((ds.verified_samples / Math.max(1, ds.target_samples)) * 100));
              return (
                <div
                  key={ds.id}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--signal-deep)" }}>
                        {ds.code} · {ds.category.toUpperCase()} · LEAD: {ds.lead_name}
                      </span>
                      <h3 style={{ fontSize: 19, margin: "4px 0" }}>{ds.name}</h3>
                      {ds.description && <p style={{ fontSize: 13, color: "var(--muted)" }}>{ds.description}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select
                        className="cl-select"
                        style={{ width: "auto", padding: "5px 10px", fontSize: 12 }}
                        value={ds.status}
                        onChange={(e) => updateDataset(ds.id, { status: e.target.value })}
                      >
                        <option value="planning">Planning</option>
                        <option value="collecting">Collecting</option>
                        <option value="annotating">Annotating</option>
                        <option value="verified">Verified</option>
                        <option value="published">Published</option>
                      </select>
                      <button
                        type="button"
                        className="cl-btn danger sm"
                        onClick={() => deleteEntity("dataset", ds.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span>
                        Collected: <strong>{ds.collected_samples.toLocaleString()}</strong> /{" "}
                        {ds.target_samples.toLocaleString()} {ds.unit_label} ({pct}%)
                      </span>
                      <span>
                        QA Verified: <strong>{ds.verified_samples.toLocaleString()}</strong> ({verPct}%)
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--line)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--signal-deep), var(--signal))",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      className="cl-btn outline sm"
                      onClick={() => updateDataset(ds.id, { collectedSamples: ds.collected_samples + 250 })}
                    >
                      +250 Collected
                    </button>
                    <button
                      type="button"
                      className="cl-btn mint sm"
                      onClick={() =>
                        updateDataset(ds.id, {
                          verifiedSamples: Math.min(ds.collected_samples, ds.verified_samples + 250),
                        })
                      }
                    >
                      +250 Verified QA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // MODE 4: PRODUCT MARKETING & GROWTH HUB
  if (mode === "marketing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <form className="cl-card" onSubmit={createCampaign}>
          <div className="cl-card-head">
            <div>
              <h2>
                <Megaphone size={18} style={{ display: "inline", marginRight: 6 }} />
                Launch Product Marketing Campaign
              </h2>
              <p>Track growth, institutional adoption, leads, and conversions for Porikkha, BOLoy &amp; Services</p>
            </div>
          </div>
          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Campaign Title</label>
              <input
                required
                className="cl-input"
                placeholder="e.g., Porikkha University Pilot Q4"
                value={campForm.name}
                onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Product / Wing Target</label>
              <select
                className="cl-select"
                value={campForm.productTarget}
                onChange={(e) => setCampForm({ ...campForm, productTarget: e.target.value })}
              >
                <option value="Porikkha">Porikkha (AI Exam Platform)</option>
                <option value="BOLoy">BOLoy (Cybersecurity)</option>
                <option value="Bangla Audio Corpus">Bangla Audio Corpus</option>
                <option value="Engineering Services">Engineering Services</option>
              </select>
            </div>
            <div className="cl-field">
              <label>Channel</label>
              <input
                className="cl-input"
                value={campForm.channel}
                onChange={(e) => setCampForm({ ...campForm, channel: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Field Lead &amp; Budget (USD)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="cl-input"
                  placeholder="Lead name"
                  value={campForm.ownerName}
                  onChange={(e) => setCampForm({ ...campForm, ownerName: e.target.value })}
                />
                <input
                  type="number"
                  className="cl-input"
                  value={campForm.budgetUsd}
                  onChange={(e) => setCampForm({ ...campForm, budgetUsd: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              <Plus size={15} /> Create Campaign
            </button>
          </div>
        </form>

        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Marketing Campaigns &amp; Funnel ({campaigns.length})</h2>
            </div>
          </div>
          {campaigns.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No marketing campaigns created yet.</p>
          ) : (
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Product</th>
                    <th>Leads</th>
                    <th>Conversions</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {c.channel} · Lead: {c.owner_name} · ${Number(c.budget_usd || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className="cl-pill dark">{c.product_target}</span>
                      </td>
                      <td>
                        <strong>{c.leads_count}</strong>{" "}
                        <button
                          type="button"
                          className="cl-btn outline sm"
                          style={{ padding: "2px 7px", marginLeft: 4 }}
                          onClick={() => updateCampaign(c.id, { leadsCount: c.leads_count + 5 })}
                        >
                          +5
                        </button>
                      </td>
                      <td>
                        <strong>{c.conversions_count}</strong>{" "}
                        <button
                          type="button"
                          className="cl-btn mint sm"
                          style={{ padding: "2px 7px", marginLeft: 4 }}
                          onClick={() => updateCampaign(c.id, { conversionsCount: c.conversions_count + 1 })}
                        >
                          +1
                        </button>
                      </td>
                      <td>
                        <select
                          className="cl-select"
                          style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                          value={c.status}
                          onChange={(e) => updateCampaign(c.id, { status: e.target.value })}
                        >
                          <option value="planning">Planning</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cl-btn danger sm"
                          onClick={() => deleteEntity("campaign", c.id)}
                        >
                          <Trash2 size={13} />
                        </button>
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

  // MODE 5: INTERNSHIP & FELLOWSHIP WING
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <form className="cl-card" onSubmit={createIntern}>
        <div className="cl-card-head">
          <div>
            <h2>
              <GraduationCap size={18} style={{ display: "inline", marginRight: 6 }} />
              Enroll Intern / Research Fellow
            </h2>
            <p>Manage university internship cohorts, mentors, weekly milestones, and evaluations</p>
          </div>
        </div>
        <div className="cl-form-grid">
          <div className="cl-field">
            <label>Intern Full Name</label>
            <input
              required
              className="cl-input"
              placeholder="Full name"
              value={internForm.fullName}
              onChange={(e) => setInternForm({ ...internForm, fullName: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Email Address</label>
            <input
              required
              type="email"
              className="cl-input"
              placeholder="intern@university.edu.bd"
              value={internForm.email}
              onChange={(e) => setInternForm({ ...internForm, email: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>University / Institution</label>
            <input
              className="cl-input"
              value={internForm.university}
              onChange={(e) => setInternForm({ ...internForm, university: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Assigned Field Wing</label>
            <select
              className="cl-select"
              value={internForm.fieldUnit}
              onChange={(e) => setInternForm({ ...internForm, fieldUnit: e.target.value })}
            >
              {FIELD_WINGS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="cl-field">
            <label>Mentor / Field Head</label>
            <input
              className="cl-input"
              value={internForm.mentorName}
              onChange={(e) => setInternForm({ ...internForm, mentorName: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Assigned Capstone / Project</label>
            <input
              required
              className="cl-input"
              placeholder="e.g., Bangla Audio Corpus Noise Cleaning Pipeline"
              value={internForm.projectTitle}
              onChange={(e) => setInternForm({ ...internForm, projectTitle: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="submit" className="cl-btn primary" disabled={saving}>
            <Plus size={15} /> Enroll Intern
          </button>
        </div>
      </form>

      <div className="cl-card">
        <div className="cl-card-head">
          <div>
            <h2>Active Internship &amp; Fellowship Cohort ({interns.length})</h2>
          </div>
        </div>
        {interns.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No interns enrolled in the current cohort yet.</p>
        ) : (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Intern &amp; University</th>
                  <th>Field Wing &amp; Mentor</th>
                  <th>Project</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.full_name}</strong>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {i.university} · {i.email}
                      </div>
                    </td>
                    <td>
                      <div>{i.field_unit}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Mentor: {i.mentor_name}</div>
                    </td>
                    <td>{i.project_title}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={10}
                          defaultValue={i.progress}
                          onMouseUp={(e) =>
                            updateIntern(i.id, { progress: Number((e.target as HTMLInputElement).value) })
                          }
                          style={{ width: 80 }}
                        />
                        <span className="mono" style={{ fontSize: 11 }}>{i.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="cl-select"
                        style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                        value={i.status}
                        onChange={(e) => updateIntern(i.id, { status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="certified">Certified</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cl-btn danger sm"
                        onClick={() => deleteEntity("intern", i.id)}
                      >
                        <Trash2 size={13} />
                      </button>
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
