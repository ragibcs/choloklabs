"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Trash2, Users } from "lucide-react";

interface JobRow {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_range: string;
  status: "open" | "paused" | "closed";
  applicants_count: number;
  description: string;
  created_at: string;
}

interface StandupRow {
  id: string;
  employee_code: string;
  department: string;
  full_name: string;
  work_date: string;
  completed: string;
  planned: string;
  blockers: string;
}

export default function HrRecruitmentPanel({
  mode,
  onNotify,
}: {
  mode: "recruitment" | "standups";
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [standups, setStandups] = useState<StandupRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    department: "Engineering",
    location: "Dhaka / Remote",
    employmentType: "full-time",
    salaryRange: "",
    description: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/hr/jobs");
    if (res.ok) {
      const out = await res.json();
      setJobs(out.jobs || []);
      setStandups(out.standups || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setForm({
        title: "",
        department: "Engineering",
        location: "Dhaka / Remote",
        employmentType: "full-time",
        salaryRange: "",
        description: "",
      });
      onNotify("ok", "Job opening published to HR pipeline.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateJob(id: string, patch: { status?: string; applicantsCount?: number }) {
    const res = await fetch("/api/hr/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      onNotify("ok", "Job opening updated.");
      load();
    }
  }

  async function deleteJob(id: string) {
    if (!confirm("Delete this job opening?")) return;
    const res = await fetch("/api/hr/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      onNotify("ok", "Job opening deleted.");
      load();
    }
  }

  if (mode === "standups") {
    return (
      <div className="cl-card">
        <div className="cl-card-head">
          <div>
            <h2>Team Daily Async Standups ({standups.length})</h2>
            <p>Engineering &amp; operations check-ins submitted from Employee Workspaces</p>
          </div>
        </div>
        {standups.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No daily standups submitted yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {standups.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div>
                    <strong>{s.full_name}</strong>{" "}
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {s.employee_code} · {s.department}
                    </span>
                  </div>
                  <span className="cl-pill mint">{String(s.work_date).slice(0, 10)}</span>
                </div>
                <div className="cl-grid-3" style={{ fontSize: 13 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--signal-deep)", marginBottom: 4 }}>
                      COMPLETED
                    </div>
                    <div>{s.completed}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink)", marginBottom: 4 }}>
                      PLANNED NEXT
                    </div>
                    <div>{s.planned}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: "#991b1b", marginBottom: 4 }}>
                      BLOCKERS
                    </div>
                    <div>{s.blockers || "None reported"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <form className="cl-card" onSubmit={createJob}>
        <div className="cl-card-head">
          <div>
            <h2>Post New Job Opening</h2>
            <p>Manage CholokLabs hiring requisitions across software, AI, embedded, and silicon</p>
          </div>
        </div>
        <div className="cl-form-grid">
          <div className="cl-field">
            <label>Role Title</label>
            <input
              required
              className="cl-input"
              placeholder="e.g., Embedded Firmware Engineer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Department</label>
            <input
              className="cl-input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Location / Mode</label>
            <input
              className="cl-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Employment Type</label>
            <select
              className="cl-select"
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>
          <div className="cl-field">
            <label>Salary Range (Optional)</label>
            <input
              className="cl-input"
              placeholder="e.g., $2,500 - $4,000 / mo"
              value={form.salaryRange}
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
            />
          </div>
          <div className="cl-field">
            <label>Summary / Requirements</label>
            <input
              className="cl-input"
              placeholder="Core skills and responsibilities"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="submit" className="cl-btn primary" disabled={saving}>
            <Plus size={15} /> Create Opening
          </button>
        </div>
      </form>

      <div className="cl-card">
        <div className="cl-card-head">
          <div>
            <h2>Hiring Pipeline ({jobs.length})</h2>
          </div>
        </div>
        {jobs.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No open positions created yet.</p>
        ) : (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <strong>
                        <Briefcase size={13} style={{ display: "inline", marginRight: 6 }} />
                        {j.title}
                      </strong>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {j.department} · {j.employment_type} {j.salary_range ? `· ${j.salary_range}` : ""}
                      </div>
                    </td>
                    <td>{j.location}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={13} />
                        <strong>{j.applicants_count}</strong>
                        <button
                          type="button"
                          className="cl-btn outline sm"
                          style={{ padding: "2px 8px" }}
                          onClick={() => updateJob(j.id, { applicantsCount: j.applicants_count + 1 })}
                        >
                          +1
                        </button>
                      </div>
                    </td>
                    <td>
                      <select
                        className="cl-select"
                        style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                        value={j.status}
                        onChange={(e) => updateJob(j.id, { status: e.target.value })}
                      >
                        <option value="open">Open</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="cl-btn danger sm"
                        onClick={() => deleteJob(j.id)}
                        aria-label="Delete job"
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
