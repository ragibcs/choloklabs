"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Network,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import DashboardShell, { type NavItem } from "./DashboardShell";
import HrRecruitmentPanel from "./HrRecruitmentPanel";
import ErpCommandPanel from "./ErpCommandPanel";
import type { SessionUser } from "@/lib/auth";

interface HrData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    pendingLeaves: number;
    presentToday: number;
    monthlyPayroll: number;
  };
  employees: Array<{
    id: string;
    employee_code: string;
    full_name: string;
    email: string;
    phone: string;
    department: string;
    job_title: string;
    employment_type: string;
    salary_monthly: string;
    currency: string;
    status: "active" | "on_leave" | "terminated";
    annual_leave_balance: number;
    sick_leave_balance: number;
  }>;
  leaves: Array<{
    id: string;
    employee_code: string;
    full_name: string;
    department: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: "pending" | "approved" | "rejected";
    review_note: string;
  }>;
  attendance: Array<{
    id: string;
    employee_code: string;
    full_name: string;
    department: string;
    work_date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    notes: string;
  }>;
  payroll: Array<{
    id: string;
    employee_id: string;
    employee_code: string;
    full_name: string;
    period_month: string;
    base_salary: string;
    bonus: string;
    deductions: string;
    net_pay: string;
    currency: string;
    status: "draft" | "processed" | "paid";
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    audience: string;
    pinned: boolean;
    author_name: string | null;
    created_at: string;
  }>;
  tasks: Array<{
    id: string;
    employee_name: string;
    employee_code: string;
    title: string;
    priority: string;
    status: string;
    due_date: string | null;
  }>;
}

export default function HrDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<HrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [empForm, setEmpForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "HR",
    employeeCode: "",
    department: "Engineering",
    jobTitle: "",
    employmentType: "full-time" as "full-time" | "part-time" | "contract" | "intern",
    salaryMonthly: "3500",
    managerName: "",
  });

  const [payrollForm, setPayrollForm] = useState({
    employeeId: "",
    periodMonth: new Date().toISOString().slice(0, 7),
    baseSalary: "",
    bonus: "0",
    deductions: "0",
    status: "processed" as "draft" | "processed" | "paid",
    notes: "",
  });

  const [taskForm, setTaskForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  });

  const [annForm, setAnnForm] = useState({
    title: "",
    body: "",
    audience: "all" as "all" | "employees" | "hr",
    pinned: false,
  });

  const notify = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/overview");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function onboardEmployee(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empForm),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Onboarding failed");
      setEmpForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "EMPLOYEE",
        employeeCode: "",
        department: "Engineering",
        jobTitle: "",
        employmentType: "full-time",
        salaryMonthly: "3500",
        managerName: "",
      });
      notify("ok", "Employee onboarded and account provisioned.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function updateEmployeeStatus(id: string, status: string) {
    const res = await fetch("/api/hr/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      notify("ok", "Employee status updated.");
      loadAll();
    }
  }

  async function reviewLeave(id: string, status: "approved" | "rejected") {
    const reviewNote = window.prompt(`Optional note for ${status} decision:`) || "";
    const res = await fetch("/api/hr/leaves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reviewNote, notify: true }),
    });
    if (res.ok) {
      notify("ok", `Leave request ${status}.`);
      loadAll();
    } else {
      notify("err", "Failed to update leave request.");
    }
  }

  async function savePayroll(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payrollForm,
          baseSalary: Number(payrollForm.baseSalary || 0),
          bonus: Number(payrollForm.bonus || 0),
          deductions: Number(payrollForm.deductions || 0),
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      notify("ok", "Payroll record saved.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function markPayrollPaid(id: string) {
    const res = await fetch("/api/hr/payroll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid" }),
    });
    if (res.ok) {
      notify("ok", "Payslip marked as PAID.");
      loadAll();
    }
  }

  async function assignTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setTaskForm({ employeeId: "", title: "", description: "", priority: "medium", dueDate: "" });
      notify("ok", "Task assigned to employee.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annForm),
      });
      if (!res.ok) throw new Error("Could not post announcement");
      setAnnForm({ title: "", body: "", audience: "all", pinned: false });
      notify("ok", "Announcement published.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    await fetch("/api/hr/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAll();
  }

  const navItems: NavItem[] = [
    { id: "overview", label: "HR Overview", icon: LayoutDashboard, group: "PEOPLE OPS" },
    { id: "employees", label: "Employees & Onboarding", icon: Users, badge: data?.stats.totalEmployees || 0, group: "PEOPLE OPS" },
    { id: "erp_tree", label: "Org Tree & Profiles", icon: Network, group: "PEOPLE OPS" },
    { id: "erp_interns", label: "Internship Program", icon: GraduationCap, group: "PEOPLE OPS" },
    { id: "leaves", label: "Leave Requests", icon: CalendarCheck, badge: data?.stats.pendingLeaves || 0, group: "PEOPLE OPS" },
    { id: "recruitment", label: "Hiring & Job Openings", icon: Briefcase, group: "PEOPLE OPS" },
    { id: "erp_commits", label: "Commits & Performance", icon: GitBranch, group: "OPERATIONS" },
    { id: "attendance", label: "Attendance Logs", icon: Clock, group: "OPERATIONS" },
    { id: "standups", label: "Team Standups", icon: MessageSquareText, group: "OPERATIONS" },
    { id: "payroll", label: "Payroll & Payslips", icon: DollarSign, group: "OPERATIONS" },
    { id: "tasks", label: "Tasks & Announcements", icon: Megaphone, group: "OPERATIONS" },
  ];

  return (
    <DashboardShell
      user={user}
      roleLabel="HR"
      title={navItems.find((n) => n.id === tab)?.label || "HR Workspace"}
      subtitle="Manage team onboarding, leave approvals, attendance, payroll, and internal communications."
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

      {tab === "overview" && (
        <>
          <div className="cl-kpi-grid">
            <div className="cl-kpi dark-kpi">
              <div className="cl-kpi-top">
                <span>HEADCOUNT</span>
                <Users size={15} />
              </div>
              <div className="cl-kpi-val">{data?.stats.totalEmployees ?? "—"}</div>
              <div className="cl-kpi-sub">{data?.stats.activeEmployees ?? 0} active</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>PRESENT TODAY</span>
                <Clock size={15} />
              </div>
              <div className="cl-kpi-val">{data?.stats.presentToday ?? 0}</div>
              <div className="cl-kpi-sub">Logged attendance today</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>PENDING LEAVES</span>
                <CalendarCheck size={15} />
              </div>
              <div className="cl-kpi-val">{data?.stats.pendingLeaves ?? 0}</div>
              <div className="cl-kpi-sub">Awaiting HR review</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>MONTHLY PAYROLL</span>
                <DollarSign size={15} />
              </div>
              <div className="cl-kpi-val">
                ${Number(data?.stats.monthlyPayroll || 0).toLocaleString()}
              </div>
              <div className="cl-kpi-sub">Active base commitment</div>
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Pending Leave Approvals</h2>
                  <p>Approve or reject requests with automatic balance deduction</p>
                </div>
                <button type="button" className="cl-btn outline sm" onClick={() => setTab("leaves")}>
                  All leaves
                </button>
              </div>
              {(data?.leaves || []).filter((l) => l.status === "pending").length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No pending leave requests.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(data?.leaves || [])
                    .filter((l) => l.status === "pending")
                    .map((l) => (
                      <div
                        key={l.id}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          background: "var(--paper)",
                          border: "1px solid var(--line)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong>{l.full_name}</strong>{" "}
                          <span className="cl-pill">{l.leave_type}</span>
                          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                            {String(l.start_date).slice(0, 10)} → {String(l.end_date).slice(0, 10)} ({l.days}d) · {l.reason}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="cl-btn mint sm" onClick={() => reviewLeave(l.id, "approved")}>
                            Approve
                          </button>
                          <button type="button" className="cl-btn danger sm" onClick={() => reviewLeave(l.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Recent Attendance</h2>
                  <p>Live clock-in &amp; clock-out activity</p>
                </div>
              </div>
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.attendance || []).slice(0, 6).map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.full_name}</strong>
                          <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                            {a.employee_code}
                          </div>
                        </td>
                        <td>{String(a.work_date).slice(0, 10)}</td>
                        <td>
                          <span className="cl-pill mint">{a.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(!data?.attendance || data.attendance.length === 0) && (
                      <tr>
                        <td colSpan={3} style={{ color: "var(--muted)" }}>
                          No attendance logs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "employees" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <form className="cl-card" onSubmit={onboardEmployee}>
            <div className="cl-card-head">
              <div>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserPlus size={18} /> Onboard New Employee
                </h2>
                <p>Creates the employee profile and login credentials in PostgreSQL</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Full Name</label>
                <input
                  required
                  className="cl-input"
                  value={empForm.fullName}
                  onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Work Email</label>
                <input
                  type="email"
                  required
                  className="cl-input"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Employee Code</label>
                <input
                  required
                  className="cl-input mono"
                  placeholder="CL-EMP-002"
                  value={empForm.employeeCode}
                  onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Department</label>
                <input
                  required
                  className="cl-input"
                  value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Job Title</label>
                <input
                  required
                  className="cl-input"
                  placeholder="Embedded Systems Engineer"
                  value={empForm.jobTitle}
                  onChange={(e) => setEmpForm({ ...empForm, jobTitle: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Monthly Salary (USD)</label>
                <input
                  type="number"
                  required
                  className="cl-input"
                  value={empForm.salaryMonthly}
                  onChange={(e) => setEmpForm({ ...empForm, salaryMonthly: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Portal Role</label>
                <select
                  className="cl-select"
                  value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as "EMPLOYEE" | "HR" })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Initial Password (default: Cholok@2026)</label>
                <input
                  type="password"
                  className="cl-input"
                  placeholder="Leave blank for Cholok@2026"
                  value={empForm.password}
                  onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Plus size={15} /> Onboard Employee
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Employee Directory</h2>
              </div>
            </div>
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Employee</th>
                    <th>Department / Title</th>
                    <th>Monthly Salary</th>
                    <th>Leave Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.employees || []).map((emp) => (
                    <tr key={emp.id}>
                      <td className="mono">{emp.employee_code}</td>
                      <td>
                        <strong>{emp.full_name}</strong>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{emp.email}</div>
                      </td>
                      <td>
                        {emp.department}
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{emp.job_title}</div>
                      </td>
                      <td className="mono">
                        {emp.currency} {Number(emp.salary_monthly).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        Annual: <strong>{emp.annual_leave_balance}d</strong> · Sick:{" "}
                        <strong>{emp.sick_leave_balance}d</strong>
                      </td>
                      <td>
                        <select
                          className="cl-select"
                          style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                          value={emp.status}
                          onChange={(e) => updateEmployeeStatus(emp.id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="on_leave">On Leave</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "leaves" && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Leave Requests</h2>
              <p>Approving deducts from annual/sick balances and dispatches email/SMS if configured</p>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.leaves || []).map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.full_name}</strong>
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {l.employee_code}
                      </div>
                    </td>
                    <td>
                      <span className="cl-pill">{l.leave_type}</span>
                    </td>
                    <td>
                      {String(l.start_date).slice(0, 10)} → {String(l.end_date).slice(0, 10)} ({l.days}d)
                    </td>
                    <td>{l.reason}</td>
                    <td>
                      <span
                        className={`cl-pill ${
                          l.status === "approved" ? "mint" : l.status === "rejected" ? "danger" : "warn"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="cl-btn mint sm" onClick={() => reviewLeave(l.id, "approved")}>
                            Approve
                          </button>
                          <button type="button" className="cl-btn danger sm" onClick={() => reviewLeave(l.id, "rejected")}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{l.review_note || "Reviewed"}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data?.leaves || data.leaves.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--muted)" }}>
                      No leave requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Company Attendance Ledger</h2>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(data?.attendance || []).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.full_name}</strong> ({a.employee_code})
                    </td>
                    <td>{String(a.work_date).slice(0, 10)}</td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : "—"}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : "Active"}
                    </td>
                    <td>
                      <span className="cl-pill mint">{a.status}</span>
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--muted)" }}>{a.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payroll" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <form className="cl-card" onSubmit={savePayroll}>
            <div className="cl-card-head">
              <div>
                <h2>Run / Generate Payslip</h2>
                <p>Creates or updates a monthly payroll entry visible in the employee&apos;s portal</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Employee</label>
                <select
                  required
                  className="cl-select"
                  value={payrollForm.employeeId}
                  onChange={(e) => {
                    const emp = data?.employees.find((x) => x.id === e.target.value);
                    setPayrollForm({
                      ...payrollForm,
                      employeeId: e.target.value,
                      baseSalary: emp ? String(emp.salary_monthly) : payrollForm.baseSalary,
                    });
                  }}
                >
                  <option value="">Select employee...</option>
                  {(data?.employees || []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field">
                <label>Period (YYYY-MM)</label>
                <input
                  required
                  className="cl-input mono"
                  value={payrollForm.periodMonth}
                  onChange={(e) => setPayrollForm({ ...payrollForm, periodMonth: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Base Salary</label>
                <input
                  type="number"
                  required
                  className="cl-input"
                  value={payrollForm.baseSalary}
                  onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Bonus</label>
                <input
                  type="number"
                  className="cl-input"
                  value={payrollForm.bonus}
                  onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Deductions</label>
                <input
                  type="number"
                  className="cl-input"
                  value={payrollForm.deductions}
                  onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Status</label>
                <select
                  className="cl-select"
                  value={payrollForm.status}
                  onChange={(e) =>
                    setPayrollForm({
                      ...payrollForm,
                      status: e.target.value as "draft" | "processed" | "paid",
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <DollarSign size={15} /> Save Payroll Record
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Payroll History</h2>
              </div>
            </div>
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Employee</th>
                    <th>Base</th>
                    <th>Bonus</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.payroll || []).map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.period_month}</td>
                      <td>
                        <strong>{p.full_name}</strong> ({p.employee_code})
                      </td>
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
                      <td>
                        {p.status !== "paid" && (
                          <button type="button" className="cl-btn mint sm" onClick={() => markPayrollPaid(p.id)}>
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data?.payroll || data.payroll.length === 0) && (
                    <tr>
                      <td colSpan={8} style={{ color: "var(--muted)" }}>
                        No payroll runs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="cl-grid-2">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <form className="cl-card" onSubmit={assignTask}>
              <div className="cl-card-head">
                <div>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ClipboardList size={18} /> Assign Task to Employee
                  </h2>
                </div>
              </div>
              <div className="cl-form-grid">
                <div className="cl-field full">
                  <label>Employee</label>
                  <select
                    required
                    className="cl-select"
                    value={taskForm.employeeId}
                    onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })}
                  >
                    <option value="">Select employee...</option>
                    {(data?.employees || []).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cl-field full">
                  <label>Task Title</label>
                  <input
                    required
                    className="cl-input"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                </div>
                <div className="cl-field">
                  <label>Priority</label>
                  <select
                    className="cl-select"
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        priority: e.target.value as "low" | "medium" | "high" | "urgent",
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="cl-field">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="cl-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="cl-field full">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    className="cl-textarea"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="submit" className="cl-btn primary" disabled={saving}>
                  <Plus size={15} /> Assign Task
                </button>
              </div>
            </form>

            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Active Team Tasks</h2>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(data?.tasks || []).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{t.title}</strong>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {t.employee_name} · {t.priority.toUpperCase()}
                      </div>
                    </div>
                    <span className={`cl-pill ${t.status === "done" ? "mint" : ""}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <form className="cl-card" onSubmit={postAnnouncement}>
              <div className="cl-card-head">
                <div>
                  <h2>Publish Company Announcement</h2>
                </div>
              </div>
              <div className="cl-form-grid">
                <div className="cl-field full">
                  <label>Title</label>
                  <input
                    required
                    className="cl-input"
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  />
                </div>
                <div className="cl-field full">
                  <label>Message</label>
                  <textarea
                    required
                    rows={3}
                    className="cl-textarea"
                    value={annForm.body}
                    onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
                  />
                </div>
                <div className="cl-field">
                  <label>Audience</label>
                  <select
                    className="cl-select"
                    value={annForm.audience}
                    onChange={(e) =>
                      setAnnForm({ ...annForm, audience: e.target.value as "all" | "employees" | "hr" })
                    }
                  >
                    <option value="all">Everyone</option>
                    <option value="employees">Employees Only</option>
                    <option value="hr">HR Only</option>
                  </select>
                </div>
                <div className="cl-field" style={{ justifyContent: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={annForm.pinned}
                      onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })}
                    />
                    Pin to top
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="submit" className="cl-btn mint" disabled={saving}>
                  <Megaphone size={15} /> Publish
                </button>
              </div>
            </form>

            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Recent Announcements</h2>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.announcements || []).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong>{a.title}</strong>
                      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{a.body}</p>
                    </div>
                    <button
                      type="button"
                      className="cl-btn danger sm"
                      onClick={() => deleteAnnouncement(a.id)}
                      style={{ height: "fit-content" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "recruitment" && <HrRecruitmentPanel mode="recruitment" onNotify={notify} />}
      {tab === "standups" && <HrRecruitmentPanel mode="standups" onNotify={notify} />}
      {tab === "erp_tree" && <ErpCommandPanel mode="org_tree" onNotify={notify} />}
      {tab === "erp_interns" && <ErpCommandPanel mode="interns" onNotify={notify} />}
      {tab === "erp_commits" && <ErpCommandPanel mode="commits" onNotify={notify} />}
    </DashboardShell>
  );
}
