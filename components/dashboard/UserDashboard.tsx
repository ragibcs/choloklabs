"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Cpu,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Printer,
  Receipt,
  RefreshCw,
  Send,
  UserCog,
} from "lucide-react";
import DashboardShell, { type NavItem } from "./DashboardShell";
import type { SessionUser } from "@/lib/auth";
import type { CmsProduct, CmsService } from "@/lib/cms";

interface CustomerProject {
  id: string;
  title: string;
  category: string;
  status: "discovery" | "design" | "building" | "testing" | "delivered";
  progress: number;
  budget_usd: string;
  lead_name: string;
  target_date: string | null;
  summary: string;
  updated_at: string;
}

interface CustomerTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  message: string;
  admin_reply: string;
  created_at: string;
}

interface CustomerInvoice {
  id: string;
  invoice_number: string;
  title: string;
  project_title: string | null;
  amount: string;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  paid_at: string | null;
  notes: string;
  created_at: string;
}

interface UserWorkspaceData {
  inquiries: Array<{
    id: string;
    company: string;
    interest: string;
    message: string;
    status: string;
    admin_reply: string;
    created_at: string;
  }>;
  projects: CustomerProject[];
  tickets: CustomerTicket[];
  invoices: CustomerInvoice[];
  products: CmsProduct[];
  services: CmsService[];
}

export default function UserDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<UserWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [reqForm, setReqForm] = useState({ company: "", interest: "", message: "" });
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "Technical Support",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    message: "",
  });
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    currentPassword: "",
    newPassword: "",
  });

  const notify = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/workspace");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inquiry", ...reqForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not submit request");
      setReqForm({ company: "", interest: "", message: "" });
      notify("ok", "Project request submitted to CholokLabs engineering.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ticket", ...ticketForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not open ticket");
      setTicketForm({ subject: "", category: "Technical Support", priority: "medium", message: "" });
      notify("ok", "Support ticket opened. Our team will respond shortly.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
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
      if (!res.ok) throw new Error(out.error || "Failed");
      setProfileForm({ ...profileForm, currentPassword: "", newPassword: "" });
      notify("ok", "Account updated.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const interestOptions = [
    ...(data?.products || []).map((p) => p.name),
    ...(data?.services || []).map((s) => s.name),
    "Custom Engineering",
  ];

  const openTicketsCount = (data?.tickets || []).filter((t) => t.status === "open" || t.status === "in_progress").length;
  const dueInvoicesAmount = (data?.invoices || [])
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "CUSTOMER PORTAL" },
    { id: "projects", label: "My Projects", icon: FolderKanban, badge: data?.projects.length || 0, group: "CUSTOMER PORTAL" },
    { id: "tickets", label: "Support Desk", icon: LifeBuoy, badge: openTicketsCount, group: "CUSTOMER PORTAL" },
    { id: "invoices", label: "Billing & Invoices", icon: Receipt, badge: data?.invoices.length || 0, group: "CUSTOMER PORTAL" },
    { id: "inquiries", label: "Project Requests", icon: Inbox, badge: data?.inquiries.length || 0, group: "EXPLORE" },
    { id: "catalog", label: "Products & Services", icon: Boxes, group: "EXPLORE" },
    { id: "account", label: "Account & Security", icon: UserCog, group: "ACCOUNT" },
  ];

  return (
    <DashboardShell
      user={user}
      roleLabel="CUSTOMER"
      title={navItems.find((n) => n.id === tab)?.label || "Customer Portal"}
      subtitle="Track live project delivery, manage invoices, open support tickets, and explore CholokLabs products."
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
                <span>ACTIVE PROJECTS</span>
                <FolderKanban size={15} />
              </div>
              <div className="cl-kpi-val">{data?.projects.length ?? 0}</div>
              <div className="cl-kpi-sub">
                {(data?.projects || []).filter((p) => p.status !== "delivered").length} in delivery
              </div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>OPEN TICKETS</span>
                <LifeBuoy size={15} />
              </div>
              <div className="cl-kpi-val">{openTicketsCount}</div>
              <div className="cl-kpi-sub">{data?.tickets.length ?? 0} total support threads</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>BALANCE DUE</span>
                <Receipt size={15} />
              </div>
              <div className="cl-kpi-val">${dueInvoicesAmount.toLocaleString()}</div>
              <div className="cl-kpi-sub">{data?.invoices.length ?? 0} billing statements</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>PROJECT REQUESTS</span>
                <Inbox size={15} />
              </div>
              <div className="cl-kpi-val">{data?.inquiries.length ?? 0}</div>
              <div className="cl-kpi-sub">
                {(data?.inquiries || []).filter((i) => i.status === "replied").length} replied by engineers
              </div>
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Active Project Delivery</h2>
                  <p>Real-time engineering milestones from CholokLabs</p>
                </div>
                <button type="button" className="cl-btn outline sm" onClick={() => setTab("projects")}>
                  View All
                </button>
              </div>
              {(data?.projects || []).length === 0 ? (
                <div style={{ padding: "12px 0" }}>
                  <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                    No active engineering projects assigned yet. Submit a project scope to kick off discovery.
                  </p>
                  <button type="button" className="cl-btn mint sm" onClick={() => setTab("inquiries")}>
                    Start a Project Request
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(data?.projects || []).slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--line)",
                        background: "var(--paper)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <strong>{p.title}</strong>
                        <span className={`cl-pill ${p.status === "delivered" ? "mint" : "dark"}`}>{p.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Lead: {p.lead_name || "CholokLabs"} · {p.category}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--mono)", marginBottom: 4 }}>
                          <span>PROGRESS</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: "var(--line)", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${p.progress}%`,
                              height: "100%",
                              borderRadius: 99,
                              background: "linear-gradient(90deg, var(--signal-deep), var(--signal))",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cl-card-dark">
              <div className="eyebrow" style={{ color: "var(--signal)", marginBottom: 10 }}>
                <i style={{ background: "var(--signal)" }} /> THE PRODUCT LAB
              </div>
              <h2 style={{ fontSize: 22, letterSpacing: "-0.04em", marginBottom: 14 }}>
                Explore CholokLabs Products
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(data?.products || []).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: "var(--surface)",
                      border: "1px solid #ffffff16",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: 12.5, color: "var(--mist)" }}>{p.tagline}</div>
                    </div>
                    {p.href ? (
                      <a href={p.href} target="_blank" rel="noreferrer" className="cl-btn mint sm">
                        Open <ArrowUpRight size={14} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="cl-btn outline sm"
                        onClick={() => {
                          setReqForm({ ...reqForm, interest: p.name });
                          setTab("inquiries");
                        }}
                      >
                        Request Access
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "projects" && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>My Projects &amp; Milestones ({data?.projects.length || 0})</h2>
              <p>Live status and delivery progress from your CholokLabs engineering team</p>
            </div>
            <button type="button" className="cl-btn mint sm" onClick={() => setTab("inquiries")}>
              Request New Project
            </button>
          </div>
          {(data?.projects || []).length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              No active projects yet. Once your scope is approved by our founders, your project tracker will appear here.
            </p>
          ) : (
            <div className="cl-grid-2">
              {(data?.projects || []).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <strong style={{ fontSize: 17 }}>{p.title}</strong>
                    <span className={`cl-pill ${p.status === "delivered" ? "mint" : "dark"}`}>{p.status}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--signal-deep)", marginBottom: 8 }}>
                    {p.category.toUpperCase()} · LEAD: {p.lead_name || "CHOLOKLABS"}
                  </div>
                  {p.summary && <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 12 }}>{p.summary}</p>}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--mono)", marginBottom: 4 }}>
                      <span>COMPLETION</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: "var(--line)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${p.progress}%`,
                          height: "100%",
                          borderRadius: 99,
                          background: "linear-gradient(90deg, var(--signal-deep), var(--signal))",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
                    <span>Budget: ${Number(p.budget_usd || 0).toLocaleString()}</span>
                    <span>Target: {p.target_date ? String(p.target_date).slice(0, 10) : "TBD"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "tickets" && (
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={submitTicket}>
            <div className="cl-card-head">
              <div>
                <h2>Open a Support Ticket</h2>
                <p>Direct helpdesk for Porikkha, BOLoy, or active engineering deployments</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field full">
                <label>Subject</label>
                <input
                  required
                  className="cl-input"
                  placeholder="Brief summary of the issue or question"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Category</label>
                <select
                  className="cl-select"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                >
                  <option value="Technical Support">Technical Support</option>
                  <option value="Porikkha Platform">Porikkha Platform</option>
                  <option value="BOLoy Security">BOLoy Security</option>
                  <option value="Hardware / Firmware">Hardware / Firmware</option>
                  <option value="Billing & Account">Billing &amp; Account</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Priority</label>
                <select
                  className="cl-select"
                  value={ticketForm.priority}
                  onChange={(e) =>
                    setTicketForm({
                      ...ticketForm,
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
              <div className="cl-field full">
                <label>Description</label>
                <textarea
                  required
                  rows={5}
                  className="cl-textarea"
                  placeholder="Include steps to reproduce, environment, or device details..."
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <LifeBuoy size={15} /> Submit Ticket
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>My Support Tickets ({data?.tickets.length || 0})</h2>
              </div>
            </div>
            {(data?.tickets || []).length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No support tickets opened yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.tickets || []).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{t.subject}</strong>
                      <span
                        className={`cl-pill ${
                          t.status === "resolved" || t.status === "closed"
                            ? "mint"
                            : t.priority === "urgent"
                              ? "danger"
                              : "warn"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>
                      {t.category} · {t.priority.toUpperCase()} · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                    <p style={{ fontSize: 13.5, marginTop: 6 }}>{t.message}</p>
                    {t.admin_reply && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: 8,
                          background: "var(--mint-tint)",
                          fontSize: 13,
                        }}
                      >
                        <strong className="mono" style={{ fontSize: 10.5, color: "var(--signal-deep)" }}>
                          SUPPORT RESPONSE:
                        </strong>
                        <div>{t.admin_reply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Billing &amp; Invoices ({data?.invoices.length || 0})</h2>
              <p>Statements issued by CholokLabs Finance</p>
            </div>
            <button type="button" className="cl-btn outline sm" onClick={() => window.print()}>
              <Printer size={14} /> Print Statement
            </button>
          </div>
          {(data?.invoices || []).length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No invoices issued to your account yet.</p>
          ) : (
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Description</th>
                    <th>Project</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.invoices || []).map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono">{inv.invoice_number}</td>
                      <td>
                        <strong>{inv.title}</strong>
                        {inv.notes && <div style={{ fontSize: 12, color: "var(--muted)" }}>{inv.notes}</div>}
                      </td>
                      <td>{inv.project_title || "—"}</td>
                      <td style={{ fontWeight: 600 }}>
                        {inv.currency} {Number(inv.amount).toLocaleString()}
                      </td>
                      <td>{inv.due_date ? String(inv.due_date).slice(0, 10) : "—"}</td>
                      <td>
                        <span
                          className={`cl-pill ${
                            inv.status === "paid" ? "mint" : inv.status === "overdue" ? "danger" : "warn"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "inquiries" && (
        <div className="cl-grid-2">
          <form className="cl-card" onSubmit={submitInquiry}>
            <div className="cl-card-head">
              <div>
                <h2>Start a New Project Request</h2>
                <p>Sent directly to our engineering triage queue</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Company / Organization</label>
                <input
                  className="cl-input"
                  value={reqForm.company}
                  onChange={(e) => setReqForm({ ...reqForm, company: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Product or Service</label>
                <select
                  required
                  className="cl-select"
                  value={reqForm.interest}
                  onChange={(e) => setReqForm({ ...reqForm, interest: e.target.value })}
                >
                  <option value="">Choose one...</option>
                  {interestOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cl-field full">
                <label>Project Details</label>
                <textarea
                  required
                  rows={5}
                  className="cl-textarea"
                  placeholder="Describe your requirements, timeline, or hardware/software stack..."
                  value={reqForm.message}
                  onChange={(e) => setReqForm({ ...reqForm, message: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Send size={15} /> Submit Request
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Request History ({data?.inquiries.length || 0})</h2>
              </div>
            </div>
            {(data?.inquiries || []).length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No project requests submitted yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(data?.inquiries || []).map((inq) => (
                  <div
                    key={inq.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--paper)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{inq.interest}</strong>
                      <span className={`cl-pill ${inq.status === "replied" ? "mint" : "warn"}`}>
                        {inq.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                      {new Date(inq.created_at).toLocaleString()}
                    </div>
                    <p style={{ fontSize: 13.5, marginTop: 6 }}>{inq.message}</p>
                    {inq.admin_reply && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: 8,
                          background: "var(--mint-tint)",
                          fontSize: 13,
                        }}
                      >
                        <strong className="mono" style={{ fontSize: 10.5, color: "var(--signal-deep)" }}>
                          ENGINEER REPLY:
                        </strong>
                        <div>{inq.admin_reply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "catalog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>CholokLabs Products</h2>
              </div>
            </div>
            <div className="cl-grid-2">
              {(data?.products || []).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "linear-gradient(135deg, var(--card), var(--mint-tint))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 20 }}>{p.name}</strong>
                    <span className="cl-pill mint">{p.statusLabel}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>{p.summary}</p>
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noreferrer" className="cl-btn primary sm">
                      Open Demo <ArrowUpRight size={14} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="cl-btn primary sm"
                      onClick={() => {
                        setReqForm({ ...reqForm, interest: p.name });
                        setTab("inquiries");
                      }}
                    >
                      Ask About {p.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Engineering Services</h2>
              </div>
            </div>
            <div className="cl-grid-3">
              {(data?.services || []).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                  }}
                >
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--signal-deep)", marginBottom: 4 }}>
                    <Cpu size={12} style={{ display: "inline", marginRight: 5 }} />
                    {s.layer.toUpperCase()}
                  </div>
                  <strong>{s.name}</strong>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{s.summary}</p>
                  <button
                    type="button"
                    className="cl-btn outline sm"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      setReqForm({ ...reqForm, interest: s.name });
                      setTab("inquiries");
                    }}
                  >
                    Request Scope
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "account" && (
        <form className="cl-card" onSubmit={updateProfile} style={{ maxWidth: 640 }}>
          <div className="cl-card-head">
            <div>
              <h2>Account &amp; Security</h2>
              <p>
                Sign-in method:{" "}
                <strong>{user.googleId ? "Google OAuth + Email" : "Email & Password"}</strong>
              </p>
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
              <label>Current Password</label>
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
              Update Account
            </button>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
