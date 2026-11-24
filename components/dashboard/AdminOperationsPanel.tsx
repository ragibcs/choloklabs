"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, LifeBuoy, Plus, Receipt, Send, Trash2 } from "lucide-react";

interface OpsData {
  projects: Array<{
    id: string;
    title: string;
    category: string;
    status: "discovery" | "design" | "building" | "testing" | "delivered";
    progress: number;
    budget_usd: string;
    lead_name: string;
    target_date: string | null;
    summary: string;
    client_name: string | null;
    client_email: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    title: string;
    amount: string;
    currency: string;
    status: "draft" | "sent" | "paid" | "overdue";
    due_date: string | null;
    client_name: string | null;
    project_title: string | null;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    message: string;
    admin_reply: string;
    client_name: string;
    client_email: string;
    created_at: string;
  }>;
  clients: Array<{ id: string; full_name: string; email: string; role: string }>;
  summary: {
    activeProjects: number;
    openTickets: number;
    totalRevenue: number;
    outstandingRevenue: number;
  };
}

export default function AdminOperationsPanel({
  mode,
  onNotify,
}: {
  mode: "projects" | "tickets" | "billing";
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [data, setData] = useState<OpsData | null>(null);
  const [saving, setSaving] = useState(false);

  const [projForm, setProjForm] = useState({
    userId: "",
    title: "",
    category: "Software & AI",
    status: "discovery",
    progress: 15,
    budgetUsd: "",
    leadName: "Ragib Hasan",
    targetDate: "",
    summary: "",
  });

  const [invForm, setInvForm] = useState({
    userId: "",
    projectId: "",
    title: "",
    amount: "",
    currency: "USD",
    status: "sent",
    dueDate: "",
    notes: "",
  });

  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/operations");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "project", data: projForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setProjForm({
        userId: "",
        title: "",
        category: "Software & AI",
        status: "discovery",
        progress: 15,
        budgetUsd: "",
        leadName: "Ragib Hasan",
        targetDate: "",
        summary: "",
      });
      onNotify("ok", "Client project created and synced to Customer Portal.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "project", id, data: patch }),
    });
    if (res.ok) {
      onNotify("ok", "Project updated.");
      load();
    }
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "invoice", data: invForm }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed");
      setInvForm({
        userId: "",
        projectId: "",
        title: "",
        amount: "",
        currency: "USD",
        status: "sent",
        dueDate: "",
        notes: "",
      });
      onNotify("ok", "Invoice issued and visible in Customer Billing.");
      load();
    } catch (err) {
      onNotify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateInvoiceStatus(id: string, status: string) {
    const res = await fetch("/api/admin/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "invoice", id, data: { status } }),
    });
    if (res.ok) {
      onNotify("ok", `Invoice marked as ${status.toUpperCase()}.`);
      load();
    }
  }

  async function replyTicket(id: string, status: string) {
    const adminReply = ticketReplies[id] || "";
    const res = await fetch("/api/admin/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "ticket", id, data: { status, adminReply } }),
    });
    if (res.ok) {
      onNotify("ok", "Ticket updated.");
      load();
    }
  }

  async function deleteEntity(entity: "project" | "invoice" | "ticket", id: string) {
    if (!confirm(`Delete this ${entity}?`)) return;
    const res = await fetch("/api/admin/operations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    if (res.ok) {
      onNotify("ok", `${entity} removed.`);
      load();
    }
  }

  if (mode === "projects") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <form className="cl-card" onSubmit={createProject}>
          <div className="cl-card-head">
            <div>
              <h2>Create Client / Internal Project</h2>
              <p>Assigned clients see live progress inside their Customer Portal</p>
            </div>
          </div>
          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Project Title</label>
              <input
                required
                className="cl-input"
                placeholder="e.g., Factory PLC Gateway Rollout"
                value={projForm.title}
                onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Client Account (Optional)</label>
              <select
                className="cl-select"
                value={projForm.userId}
                onChange={(e) => setProjForm({ ...projForm, userId: e.target.value })}
              >
                <option value="">Internal / Unassigned</option>
                {(data?.clients || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="cl-field">
              <label>Engineering Layer</label>
              <select
                className="cl-select"
                value={projForm.category}
                onChange={(e) => setProjForm({ ...projForm, category: e.target.value })}
              >
                <option value="Software & AI">Software &amp; AI</option>
                <option value="GPU Acceleration">GPU Acceleration</option>
                <option value="IoT & IIoT">IoT &amp; IIoT</option>
                <option value="Industrial Automation">Industrial Automation</option>
                <option value="Embedded & PCB">Embedded &amp; PCB</option>
                <option value="Silicon & FPGA">Silicon &amp; FPGA</option>
              </select>
            </div>
            <div className="cl-field">
              <label>Lead Engineer</label>
              <input
                className="cl-input"
                value={projForm.leadName}
                onChange={(e) => setProjForm({ ...projForm, leadName: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Budget (USD)</label>
              <input
                type="number"
                min={0}
                className="cl-input"
                placeholder="5000"
                value={projForm.budgetUsd}
                onChange={(e) => setProjForm({ ...projForm, budgetUsd: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Target Delivery Date</label>
              <input
                type="date"
                className="cl-input"
                value={projForm.targetDate}
                onChange={(e) => setProjForm({ ...projForm, targetDate: e.target.value })}
              />
            </div>
            <div className="cl-field full">
              <label>Scope Summary</label>
              <textarea
                rows={2}
                className="cl-textarea"
                placeholder="Deliverables, milestones, and technical scope..."
                value={projForm.summary}
                onChange={(e) => setProjForm({ ...projForm, summary: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              <Plus size={15} /> Launch Project
            </button>
          </div>
        </form>

        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>Active Delivery Pipeline ({data?.projects.length || 0})</h2>
            </div>
          </div>
          {(data?.projects || []).length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No projects in the pipeline yet.</p>
          ) : (
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Stage</th>
                    <th>Progress</th>
                    <th>Budget</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.projects || []).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.title}</strong>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.category} · {p.lead_name}</div>
                      </td>
                      <td>{p.client_name || "Internal"}</td>
                      <td>
                        <select
                          className="cl-select"
                          style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                          value={p.status}
                          onChange={(e) => updateProject(p.id, { status: e.target.value })}
                        >
                          <option value="discovery">Discovery</option>
                          <option value="design">Design</option>
                          <option value="building">Building</option>
                          <option value="testing">Testing</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            defaultValue={p.progress}
                            onMouseUp={(e) =>
                              updateProject(p.id, { progress: Number((e.target as HTMLInputElement).value) })
                            }
                            style={{ width: 90 }}
                          />
                          <span className="mono" style={{ fontSize: 11 }}>{p.progress}%</span>
                        </div>
                      </td>
                      <td>${Number(p.budget_usd || 0).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="cl-btn danger sm"
                          onClick={() => deleteEntity("project", p.id)}
                          aria-label="Delete project"
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

  if (mode === "billing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="cl-kpi-grid">
          <div className="cl-kpi dark-kpi">
            <div className="cl-kpi-top">
              <span>PAID REVENUE</span>
              <Receipt size={15} />
            </div>
            <div className="cl-kpi-val">${(data?.summary.totalRevenue ?? 0).toLocaleString()}</div>
            <div className="cl-kpi-sub">Collected invoices</div>
          </div>
          <div className="cl-kpi">
            <div className="cl-kpi-top">
              <span>OUTSTANDING</span>
              <FolderKanban size={15} />
            </div>
            <div className="cl-kpi-val">${(data?.summary.outstandingRevenue ?? 0).toLocaleString()}</div>
            <div className="cl-kpi-sub">Sent &amp; overdue</div>
          </div>
        </div>

        <form className="cl-card" onSubmit={createInvoice}>
          <div className="cl-card-head">
            <div>
              <h2>Issue Client Invoice</h2>
              <p>Invoices appear immediately in the client&apos;s Billing &amp; Invoices tab</p>
            </div>
          </div>
          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Invoice Title</label>
              <input
                required
                className="cl-input"
                placeholder="e.g., Milestone 1 — Architecture & Prototype"
                value={invForm.title}
                onChange={(e) => setInvForm({ ...invForm, title: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Client</label>
              <select
                className="cl-select"
                value={invForm.userId}
                onChange={(e) => setInvForm({ ...invForm, userId: e.target.value })}
              >
                <option value="">Select client...</option>
                {(data?.clients || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="cl-field">
              <label>Linked Project (Optional)</label>
              <select
                className="cl-select"
                value={invForm.projectId}
                onChange={(e) => setInvForm({ ...invForm, projectId: e.target.value })}
              >
                <option value="">None</option>
                {(data?.projects || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="cl-field">
              <label>Amount (USD)</label>
              <input
                required
                type="number"
                min={1}
                step="0.01"
                className="cl-input"
                placeholder="1500"
                value={invForm.amount}
                onChange={(e) => setInvForm({ ...invForm, amount: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Due Date</label>
              <input
                type="date"
                className="cl-input"
                value={invForm.dueDate}
                onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Notes</label>
              <input
                className="cl-input"
                placeholder="Wire / bank transfer reference"
                value={invForm.notes}
                onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              <Receipt size={15} /> Issue Invoice
            </button>
          </div>
        </form>

        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h2>All Invoices ({data?.invoices.length || 0})</h2>
            </div>
          </div>
          {(data?.invoices || []).length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No invoices issued yet.</p>
          ) : (
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.invoices || []).map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono">{inv.invoice_number}</td>
                      <td>{inv.client_name || "—"}</td>
                      <td>{inv.title}</td>
                      <td style={{ fontWeight: 600 }}>
                        {inv.currency} {Number(inv.amount).toLocaleString()}
                      </td>
                      <td>
                        <select
                          className="cl-select"
                          style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                          value={inv.status}
                          onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cl-btn danger sm"
                          onClick={() => deleteEntity("invoice", inv.id)}
                          aria-label="Delete invoice"
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

  return (
    <div className="cl-card">
      <div className="cl-card-head">
        <div>
          <h2>Customer Support Desk ({data?.tickets.length || 0})</h2>
          <p>Respond to customer support tickets across Porikkha, BOLoy, and engineering deployments</p>
        </div>
      </div>
      {(data?.tickets || []).length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>No customer support tickets yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(data?.tickets || []).map((t) => (
            <div
              key={t.id}
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "var(--paper)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <strong>{t.subject}</strong>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {t.client_name} ({t.client_email}) · {t.category} · Priority: {t.priority.toUpperCase()}
                  </div>
                </div>
                <span className={`cl-pill ${t.status === "resolved" || t.status === "closed" ? "mint" : "warn"}`}>
                  <LifeBuoy size={11} /> {t.status}
                </span>
              </div>
              <p style={{ fontSize: 13.5, marginTop: 8 }}>{t.message}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <input
                  className="cl-input"
                  style={{ flex: 1, minWidth: 220 }}
                  placeholder="Write an engineer response..."
                  value={ticketReplies[t.id] ?? t.admin_reply ?? ""}
                  onChange={(e) => setTicketReplies({ ...ticketReplies, [t.id]: e.target.value })}
                />
                <button type="button" className="cl-btn outline sm" onClick={() => replyTicket(t.id, "in_progress")}>
                  In Progress
                </button>
                <button type="button" className="cl-btn mint sm" onClick={() => replyTicket(t.id, "resolved")}>
                  <Send size={13} /> Reply &amp; Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
