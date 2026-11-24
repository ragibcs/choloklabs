"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  GitBranch,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Play,
  RefreshCw,
  Send,
  Square,
  UserCog,
} from "lucide-react";
import DashboardShell, { type NavItem } from "./DashboardShell";
import type { SessionUser } from "@/lib/auth";

interface EmployeeWorkspace {
  employee: {
    id: string;
    employee_code: string;
    department: string;
    job_title: string;
    employment_type: string;
    salary_monthly: string;
    currency: string;
    annual_leave_balance: number;
    sick_leave_balance: number;
  };
  todayLog: {
    id: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    notes: string;
  } | null;
  attendance: Array<{
    id: string;
    work_date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    notes: string;
  }>;
  leaves: Array<{
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: string;
    review_note: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    status: "todo" | "in_progress" | "review" | "done";
    due_date: string | null;
  }>;
  payroll: Array<{
    id: string;
    period_month: string;
    base_salary: string;
    bonus: string;
    deductions: string;
    net_pay: string;
    status: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    created_at: string;
  }>;
  standups?: Array<{
    id: string;
    work_date: string;
    completed: string;
    planned: string;
    blockers: string;
  }>;
  commits?: Array<{
    id: string;
    repo_name: string;
    branch: string;
    commit_sha: string;
    commit_message: string;
    pr_status: string;
    committed_at: string;
  }>;
}

export default function EmployeeDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<EmployeeWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [workMode, setWorkMode] = useState<"present" | "remote">("present");
  const [workNotes, setWorkNotes] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    currentPassword: "",
    newPassword: "",
  });

  const [standupForm, setStandupForm] = useState({
    completed: "",
    planned: "",
    blockers: "",
  });

  const [commitForm, setCommitForm] = useState({
    repoName: "choloklabs/porikkha",
    branch: "main",
    commitSha: "",
    commitMessage: "",
    prStatus: "merged",
  });

  async function submitCommit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/employee/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log_commit", ...commitForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not log commit");
      setCommitForm({ ...commitForm, commitSha: "", commitMessage: "" });
      notify("ok", "Commit / deliverable recorded to engineering ledger.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitStandup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/employee/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "standup", ...standupForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not submit standup");
      setStandupForm({ completed: "", planned: "", blockers: "" });
      notify("ok", "Daily async standup submitted.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const notify = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/workspace");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function doAction(payload: Record<string, unknown>, okMsg: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/employee/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Action failed");
      notify("ok", okMsg);
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    await doAction({ action: "request_leave", ...leaveForm }, "Leave request submitted to HR.");
    setLeaveForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          ...(profileForm.newPassword
            ? {
                currentPassword: profileForm.currentPassword,
                newPassword: profileForm.newPassword,
              }
            : {}),
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Update failed");
      setProfileForm({ ...profileForm, currentPassword: "", newPassword: "" });
      notify("ok", "Profile & security settings updated.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const openTasks = (data?.tasks || []).filter((t) => t.status !== "done").length;

  const navItems: NavItem[] = [
    { id: "overview", label: "Workspace", icon: LayoutDashboard, group: "EMPLOYEE" },
    { id: "standup", label: "Daily Standup", icon: MessageSquareText, group: "EMPLOYEE" },
    { id: "commits", label: "Git Commits & Work", icon: GitBranch, badge: data?.commits?.length || 0, group: "EMPLOYEE" },
    { id: "tasks", label: "My Tasks", icon: ClipboardList, badge: openTasks, group: "EMPLOYEE" },
    { id: "leaves", label: "Leave Requests", icon: CalendarCheck, group: "EMPLOYEE" },
    { id: "attendance", label: "Attendance Log", icon: Clock, group: "RECORDS" },
    { id: "payslips", label: "Payslips", icon: DollarSign, group: "RECORDS" },
    { id: "profile", label: "Profile & Security", icon: UserCog, group: "ACCOUNT" },
  ];

  return (
    <DashboardShell
      user={user}
      roleLabel="EMPLOYEE"
      title={navItems.find((n) => n.id === tab)?.label || "Employee Workspace"}
      subtitle={
        data
          ? `${data.employee.employee_code} · ${data.employee.job_title} (${data.employee.department})`
          : "Attendance, tasks, leave requests, and payslips."
      }
      navItems={navItems}
      activeTab={tab}
      onTabChange={setTab}
      headerActions={
        <button type="button" className="cl-btn outline sm" onClick={loadAll} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {toast && (
        <div className={toast.type === "ok" ? "cl-alert ok" : "cl-alert err"}>
          <CheckCircle2 size={16} />
          <span>{toast.msg}</span>
        </div>
      )}

      {tab === "overview" && data && (
        <>
          <div className="cl-kpi-grid">
            <div className="cl-kpi dark-kpi">
              <div className="cl-kpi-top">
                <span>TODAY&apos;S STATUS</span>
                <Clock size={15} />
              </div>
              <div className="cl-kpi-val" style={{ fontSize: 26 }}>
                {data.todayLog?.clock_out
                  ? "Clocked Out"
                  : data.todayLog?.clock_in
                  ? "Clocked In"
                  : "Not Checked In"}
              </div>
              <div className="cl-kpi-sub">
                {data.todayLog?.clock_in
                  ? `Since ${new Date(data.todayLog.clock_in).toLocaleTimeString()}`
                  : "Ready to start shift"}
              </div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>OPEN TASKS</span>
                <ClipboardList size={15} />
              </div>
              <div className="cl-kpi-val">{openTasks}</div>
              <div className="cl-kpi-sub">{data.tasks.length} total assigned</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>ANNUAL LEAVE</span>
                <CalendarCheck size={15} />
              </div>
              <div className="cl-kpi-val">{data.employee.annual_leave_balance}d</div>
              <div className="cl-kpi-sub">Remaining days</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>SICK LEAVE</span>
                <CalendarCheck size={15} />
              </div>
              <div className="cl-kpi-val">{data.employee.sick_leave_balance}d</div>
              <div className="cl-kpi-sub">Remaining days</div>
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Daily Attendance Clock</h2>
                  <p>Log your shift start/end and daily engineering focus</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="cl-form-grid">
                  <div className="cl-field">
                    <label>Work Mode</label>
                    <select
                      className="cl-select"
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value as "present" | "remote")}
                    >
                      <option value="present">On-site / Lab</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div className="cl-field">
                    <label>Shift Note</label>
                    <input
                      className="cl-input"
                      placeholder="e.g. Working on PCB revision 3"
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="cl-btn mint"
                    disabled={saving || Boolean(data.todayLog?.clock_in)}
                    onClick={() =>
                      doAction(
                        { action: "clock_in", status: workMode, notes: workNotes },
                        "Clocked in for today."
                      )
                    }
                  >
                    <Play size={14} /> Clock In
                  </button>
                  <button
                    type="button"
                    className="cl-btn primary"
                    disabled={saving || !data.todayLog?.clock_in || Boolean(data.todayLog?.clock_out)}
                    onClick={() =>
                      doAction(
                        { action: "clock_out", notes: workNotes },
                        "Clocked out for today."
                      )
                    }
                  >
                    <Square size={14} /> Clock Out
                  </button>
                </div>
              </div>
            </div>

            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Megaphone size={18} /> Company Announcements
                  </h2>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                    }}
                  >
                    <strong>{a.title}</strong>
                    <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "tasks" && data && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>My Assigned Tasks</h2>
              <p>Update task status directly to sync with HR &amp; Engineering leads</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{t.title}</strong>
                    <span className={`cl-pill ${t.priority === "urgent" || t.priority === "high" ? "warn" : ""}`}>
                      {t.priority}
                    </span>
                  </div>
                  {t.description && (
                    <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{t.description}</p>
                  )}
                  {t.due_date && (
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      DUE: {String(t.due_date).slice(0, 10)}
                    </div>
                  )}
                </div>
                <select
                  className="cl-select"
                  style={{ width: "auto", fontSize: 13 }}
                  value={t.status}
                  onChange={(e) =>
                    doAction({ action: "update_task", taskId: t.id, status: e.target.value }, "Task status updated.")
                  }
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            ))}
            {data.tasks.length === 0 && (
              <p style={{ color: "var(--muted)" }}>No tasks assigned to you yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "leaves" && data && (
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={submitLeave}>
            <div className="cl-card-head">
              <div>
                <h2>Request Time Off</h2>
                <p>
                  Balances: Annual {data.employee.annual_leave_balance}d · Sick{" "}
                  {data.employee.sick_leave_balance}d
                </p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field full">
                <label>Leave Type</label>
                <select
                  className="cl-select"
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Start Date</label>
                <input
                  type="date"
                  required
                  className="cl-input"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>End Date</label>
                <input
                  type="date"
                  required
                  className="cl-input"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>Reason</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                Submit Leave Request
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>My Leave History</h2>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.leaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>
                      {l.leave_type.toUpperCase()} ({l.days}d)
                    </strong>
                    <span
                      className={`cl-pill ${
                        l.status === "approved" ? "mint" : l.status === "rejected" ? "danger" : "warn"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                    {String(l.start_date).slice(0, 10)} → {String(l.end_date).slice(0, 10)} · {l.reason}
                  </div>
                  {l.review_note && (
                    <div style={{ fontSize: 12, color: "var(--signal-deep)", marginTop: 4 }}>
                      HR Note: {l.review_note}
                    </div>
                  )}
                </div>
              ))}
              {data.leaves.length === 0 && (
                <p style={{ color: "var(--muted)" }}>No leave requests submitted.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "attendance" && data && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>My Attendance History</h2>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.attendance.map((a) => (
                  <tr key={a.id}>
                    <td>{String(a.work_date).slice(0, 10)}</td>
                    <td className="mono">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : "—"}</td>
                    <td className="mono">{a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "—"}</td>
                    <td>
                      <span className="cl-pill mint">{a.status}</span>
                    </td>
                    <td>{a.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payslips" && data && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>My Payslips</h2>
              <p>Monthly compensation statements generated by HR</p>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Base Salary</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payroll.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.period_month}</td>
                    <td>${Number(p.base_salary).toLocaleString()}</td>
                    <td>${Number(p.bonus).toLocaleString()}</td>
                    <td>${Number(p.deductions).toLocaleString()}</td>
                    <td className="mono">
                      <strong>${Number(p.net_pay).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className={`cl-pill ${p.status === "paid" ? "mint" : "warn"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.payroll.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--muted)" }}>
                      No payslips generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <form className="cl-card" onSubmit={updateProfile} style={{ maxWidth: 640 }}>
          <div className="cl-card-head">
            <div>
              <h2>Profile &amp; Password</h2>
            </div>
          </div>
          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Full Name</label>
              <input
                required
                className="cl-input"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Phone</label>
              <input
                className="cl-input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Current Password (to change)</label>
              <input
                type="password"
                className="cl-input"
                value={profileForm.currentPassword}
                onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>New Password (min 8 chars)</label>
              <input
                type="password"
                minLength={8}
                className="cl-input"
                value={profileForm.newPassword}
                onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              Save Profile
            </button>
          </div>
        </form>
      )}

      {tab === "standup" && (
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={submitStandup}>
            <div className="cl-card-head">
              <div>
                <h2>Daily Async Standup</h2>
                <p>Share your progress and blockers with leads &amp; HR</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field full">
                <label>What did you complete?</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  placeholder="Shipped PRs, hardware tests, milestones..."
                  value={standupForm.completed}
                  onChange={(e) => setStandupForm({ ...standupForm, completed: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>What is planned next?</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  placeholder="Today's top engineering priorities..."
                  value={standupForm.planned}
                  onChange={(e) => setStandupForm({ ...standupForm, planned: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>Any blockers? (Optional)</label>
                <input
                  className="cl-input"
                  placeholder="Waiting on review, hardware part, credentials..."
                  value={standupForm.blockers}
                  onChange={(e) => setStandupForm({ ...standupForm, blockers: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Send size={14} /> Submit Standup
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Recent Standups ({data?.standups?.length || 0})</h2>
              </div>
            </div>
            {(data?.standups || []).length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No standups logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.standups || []).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                      fontSize: 13,
                    }}
                  >
                    <div className="mono" style={{ fontSize: 11, color: "var(--signal-deep)", marginBottom: 6 }}>
                      {String(s.work_date).slice(0, 10)}
                    </div>
                    <div><strong>Done:</strong> {s.completed}</div>
                    <div style={{ marginTop: 4 }}><strong>Next:</strong> {s.planned}</div>
                    {s.blockers && <div style={{ marginTop: 4, color: "#991b1b" }}><strong>Blockers:</strong> {s.blockers}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "commits" && (
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={submitCommit}>
            <div className="cl-card-head">
              <div>
                <h2>Log Git Commit or Work Deliverable</h2>
                <p>Syncs directly to your profile on the Organization Tree &amp; Field Head scorecard</p>
              </div>
            </div>
            <div className="cl-form-grid">
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
                <label>Branch / Track</label>
                <input
                  className="cl-input"
                  value={commitForm.branch}
                  onChange={(e) => setCommitForm({ ...commitForm, branch: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Commit SHA / Deliverable ID (Optional)</label>
                <input
                  className="cl-input"
                  placeholder="e.g., a4f91c2 or CL-104"
                  value={commitForm.commitSha}
                  onChange={(e) => setCommitForm({ ...commitForm, commitSha: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Type</label>
                <select
                  className="cl-select"
                  value={commitForm.prStatus}
                  onChange={(e) => setCommitForm({ ...commitForm, prStatus: e.target.value })}
                >
                  <option value="merged">PR Merged</option>
                  <option value="commit">Git Commit</option>
                  <option value="deliverable">Field Deliverable</option>
                </select>
              </div>
              <div className="cl-field full">
                <label>Commit Message / Deliverable Summary</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  placeholder="Describe the shipped code, dataset batch, hardware test, or campaign milestone..."
                  value={commitForm.commitMessage}
                  onChange={(e) => setCommitForm({ ...commitForm, commitMessage: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <GitBranch size={14} /> Log Commit / Deliverable
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>My Verified Commits &amp; Deliverables ({data?.commits?.length || 0})</h2>
              </div>
            </div>
            {(data?.commits || []).length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No commits or deliverables logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.commits || []).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 13,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="cl-pill dark">{c.commit_sha}</span>
                      <span className="cl-pill mint">{c.pr_status}</span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>{c.commit_message}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      {c.repo_name} ({c.branch}) · {new Date(c.committed_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
