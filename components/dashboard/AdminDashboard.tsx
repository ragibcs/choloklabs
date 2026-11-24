"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AudioLines,
  BookOpen,
  Boxes,
  CheckCircle2,
  Cpu,
  Edit3,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Network,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Send,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import DashboardShell, { type NavItem } from "./DashboardShell";
import AdminOperationsPanel from "./AdminOperationsPanel";
import AdminBlogPanel from "./AdminBlogPanel";
import ErpCommandPanel from "./ErpCommandPanel";
import EnterpriseFinancePanel from "./EnterpriseFinancePanel";
import EnterpriseOkrPanel from "./EnterpriseOkrPanel";
import EnterpriseEngineeringPanel from "./EnterpriseEngineeringPanel";
import EnterpriseProjectPanel from "./EnterpriseProjectPanel";
import EnterpriseKnowledgePanel from "./EnterpriseKnowledgePanel";
import type { SessionUser } from "@/lib/auth";
import type { CmsProduct, CmsProject, CmsService, CmsSiteData, HomepageCopy } from "@/lib/cms";

interface AdminOverview {
  stats: {
    users: number;
    activeEmployees: number;
    products: number;
    services: number;
    totalInquiries: number;
    newInquiries: number;
    pendingLeaves: number;
  };
  auditLogs: Array<{
    id: string;
    action: string;
    entity_type: string;
    actor_name: string | null;
    created_at: string;
  }>;
  recentInquiries: Array<{
    id: string;
    name: string;
    email: string;
    company: string;
    interest: string;
    status: string;
    created_at: string;
  }>;
}

interface IntegrationsState {
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    hasPassword: boolean;
    passwordMasked: string;
    fromName: string;
    fromEmail: string;
  };
  sms: {
    enabled: boolean;
    provider: "twilio" | "vonage" | "webhook";
    accountSid: string;
    hasAuthToken: boolean;
    authTokenMasked: string;
    fromNumber: string;
    webhookUrl: string;
  };
  google_oauth: {
    enabled: boolean;
    clientId: string;
    hasClientSecret: boolean;
    clientSecretMasked: string;
    allowSignup: boolean;
    allowedDomain: string;
  };
}

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "USER" | "EMPLOYEE" | "HR" | "ADMIN";
  status: "active" | "suspended";
  has_google: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  status: string;
  admin_reply: string;
  created_at: string;
}

interface NotifLog {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  error_message: string;
  provider: string;
  created_at: string;
}

export default function AdminDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [cms, setCms] = useState<CmsSiteData | null>(null);
  const [copyDraft, setCopyDraft] = useState<HomepageCopy | null>(null);
  const [toolsText, setToolsText] = useState("");

  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);
  const [notifLogs, setNotifLogs] = useState<NotifLog[]>([]);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smsToken, setSmsToken] = useState("");
  const [googleSecret, setGoogleSecret] = useState("");
  const [testEmailTo, setTestEmailTo] = useState(user.email);
  const [testSmsTo, setTestSmsTo] = useState("");

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "EMPLOYEE" as "USER" | "EMPLOYEE" | "HR" | "ADMIN",
  });

  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [activeInquiry, setActiveInquiry] = useState<InquiryRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("replied");
  const [sendReplyEmail, setSendReplyEmail] = useState(true);

  // CMS Product / Service / Project draft editors
  const [productDraft, setProductDraft] = useState<Partial<CmsProduct> & { pointsText?: string }>({
    name: "",
    slug: "",
    tagline: "",
    summary: "",
    status: "development",
    statusLabel: "In development",
    href: "",
    pointsText: "",
    icon: "GraduationCap",
    sortOrder: 0,
    isPublished: true,
  });

  const [serviceDraft, setServiceDraft] = useState<Partial<CmsService> & { tagsText?: string }>({
    layer: "",
    name: "",
    summary: "",
    tagsText: "",
    imageUrl: "/services/software.png",
    imageAlt: "",
    icon: "Code2",
    sortOrder: 0,
    isPublished: true,
  });

  const [projectDraft, setProjectDraft] = useState<Partial<CmsProject> & { tagsText?: string }>({
    title: "",
    kind: "Representative engagement",
    summary: "",
    tagsText: "",
    href: "",
    imageUrl: "/services/software.png",
    sortOrder: 0,
    isPublished: true,
  });

  const notify = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, cmsRes, intRes, usrRes, inqRes] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/cms"),
        fetch("/api/admin/integrations"),
        fetch("/api/admin/users"),
        fetch("/api/admin/inquiries"),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (cmsRes.ok) {
        const cmsData = (await cmsRes.json()) as CmsSiteData;
        setCms(cmsData);
        setCopyDraft(cmsData.copy);
        setToolsText((cmsData.copy.tools || []).join(", "));
      }
      if (intRes.ok) {
        const intData = await intRes.json();
        setIntegrations(intData.integrations);
        setNotifLogs(intData.logs || []);
      }
      if (usrRes.ok) {
        const usrData = await usrRes.json();
        setUsers(usrData.users || []);
      }
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData.inquiries || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveSiteCopy(e: React.FormEvent) {
    e.preventDefault();
    if (!copyDraft) return;
    setSaving(true);
    try {
      const payload = {
        ...copyDraft,
        tools: toolsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "copy", data: payload }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to save");
      setCms(out.data);
      notify("ok", "Live website copy updated in PostgreSQL.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const points = (productDraft.pointsText || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          id: productDraft.id,
          data: { ...productDraft, points },
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to save product");
      setCms(out.data);
      setProductDraft({
        name: "",
        slug: "",
        tagline: "",
        summary: "",
        status: "development",
        statusLabel: "In development",
        href: "",
        pointsText: "",
        icon: "GraduationCap",
        sortOrder: out.data.products.length,
        isPublished: true,
      });
      notify("ok", "Product saved and published to the live frontend.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = (serviceDraft.tagsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "service",
          id: serviceDraft.id,
          data: { ...serviceDraft, tags },
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to save service");
      setCms(out.data);
      setServiceDraft({
        layer: "",
        name: "",
        summary: "",
        tagsText: "",
        imageUrl: "/services/software.png",
        imageAlt: "",
        icon: "Code2",
        sortOrder: out.data.services.length,
        isPublished: true,
      });
      notify("ok", "Service saved and synced to the live frontend.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = (projectDraft.tagsText || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "project",
          id: projectDraft.id,
          data: { ...projectDraft, tags },
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to save project");
      setCms(out.data);
      setProjectDraft({
        title: "",
        kind: "Representative engagement",
        summary: "",
        tagsText: "",
        href: "",
        imageUrl: "/services/software.png",
        sortOrder: out.data.projects.length,
        isPublished: true,
      });
      notify("ok", "Work showcase item saved.");
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCmsItem(entity: "product" | "service" | "project", id: string) {
    if (!confirm(`Delete this ${entity}?`)) return;
    const res = await fetch("/api/admin/cms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    const out = await res.json();
    if (res.ok) {
      setCms(out.data);
      notify("ok", `${entity} deleted.`);
    }
  }

  async function saveProvider(provider: "smtp" | "sms" | "google_oauth") {
    if (!integrations) return;
    setSaving(true);
    try {
      let body: Record<string, unknown> = { provider };
      if (provider === "smtp") {
        body = { ...body, ...integrations.smtp, password: smtpPassword };
      } else if (provider === "sms") {
        body = {
          ...body,
          enabled: integrations.sms.enabled,
          smsProvider: integrations.sms.provider,
          accountSid: integrations.sms.accountSid,
          fromNumber: integrations.sms.fromNumber,
          webhookUrl: integrations.sms.webhookUrl,
          authToken: smsToken,
        };
      } else {
        body = { ...body, ...integrations.google_oauth, clientSecret: googleSecret };
      }

      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Save failed");
      setIntegrations(out.integrations);
      setSmtpPassword("");
      setSmsToken("");
      setGoogleSecret("");
      notify("ok", `${provider.toUpperCase()} configuration saved & secrets encrypted (AES-256-GCM).`);
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed to save integration");
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(action: "test_email" | "test_sms") {
    const to = action === "test_email" ? testEmailTo : testSmsTo;
    if (!to.trim()) {
      notify("err", "Enter a recipient address or phone number first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, to }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || "Test failed");
      notify("ok", `Test ${action === "test_email" ? "email" : "SMS"} dispatched successfully.`);
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Test delivery failed");
    } finally {
      setSaving(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not create user");
      setNewUser({ fullName: "", email: "", phone: "", password: "", role: "EMPLOYEE" });
      notify("ok", "User account created.");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateUserRow(id: string, patch: { role?: string; status?: string }) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      notify("ok", "User updated.");
      loadAll();
    } else {
      const out = await res.json();
      notify("err", out.error || "Update failed");
    }
  }

  async function submitInquiryReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInquiry) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeInquiry.id,
          status: replyStatus,
          adminReply: replyText,
          notifyEmail: sendReplyEmail,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to update inquiry");
      notify(
        "ok",
        out.emailResult?.ok
          ? "Inquiry updated & SMTP email sent."
          : "Inquiry updated in database."
      );
      setActiveInquiry(null);
      setReplyText("");
      loadAll();
    } catch (err) {
      notify("err", err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "COMMAND" },
    { id: "inquiries", label: "Inquiries & CRM", icon: Inbox, badge: overview?.stats.newInquiries || 0, group: "COMMAND" },
    { id: "ent_finance", label: "General Ledger & Accounting", icon: Receipt, group: "ENTERPRISE CORE" },
    { id: "ent_okr", label: "Strategic OKRs & Goals", icon: Activity, group: "ENTERPRISE CORE" },
    { id: "ent_engineering", label: "DevOps & Engineering Ops", icon: Cpu, group: "ENTERPRISE CORE" },
    { id: "ent_projects", label: "Sprint Kanban & Project OS", icon: FolderKanban, group: "ENTERPRISE CORE" },
    { id: "ent_knowledge", label: "ADRs & Knowledge Wiki", icon: BookOpen, group: "ENTERPRISE CORE" },
    { id: "erp_tree", label: "Org Tree & Field Heads", icon: Network, group: "ERP & FIELD WINGS" },
    { id: "erp_commits", label: "Git Commits & Tasks", icon: GitBranch, group: "ERP & FIELD WINGS" },
    { id: "erp_datasets", label: "Bangla Corpus & R&D", icon: AudioLines, group: "ERP & FIELD WINGS" },
    { id: "erp_marketing", label: "Product Marketing", icon: Megaphone, group: "ERP & FIELD WINGS" },
    { id: "erp_interns", label: "Internships & Fellows", icon: GraduationCap, group: "ERP & FIELD WINGS" },
    { id: "ops_projects", label: "Client Projects", icon: FolderKanban, group: "OPERATIONS & FINANCE" },
    { id: "ops_tickets", label: "Support Desk", icon: LifeBuoy, group: "OPERATIONS & FINANCE" },
    { id: "ops_billing", label: "Finance & Invoices", icon: Receipt, group: "OPERATIONS & FINANCE" },
    { id: "cms_copy", label: "Frontend Copy", icon: Globe, group: "LIVE WEBSITE CMS" },
    { id: "cms_products", label: "Products Lab", icon: Boxes, badge: cms?.products.length || 0, group: "LIVE WEBSITE CMS" },
    { id: "cms_services", label: "Engineering Services", icon: Cpu, badge: cms?.services.length || 0, group: "LIVE WEBSITE CMS" },
    { id: "cms_work", label: "Work Showcase", icon: Edit3, group: "LIVE WEBSITE CMS" },
    { id: "cms_blog", label: "Blog & Research", icon: BookOpen, group: "LIVE WEBSITE CMS" },
    { id: "integrations", label: "SMTP, SMS & Google", icon: KeyRound, group: "INFRASTRUCTURE" },
    { id: "users", label: "Users & RBAC", icon: Users, badge: users.length, group: "INFRASTRUCTURE" },
  ];

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <DashboardShell
      user={user}
      roleLabel="ADMIN"
      title={navItems.find((n) => n.id === tab)?.label || "Admin Console"}
      subtitle="Full control over live frontend content, products, services, providers, and access."
      navItems={navItems}
      activeTab={tab}
      onTabChange={setTab}
      headerActions={
        <button type="button" className="cl-btn outline sm" onClick={loadAll} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync DB
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
                <span>TOTAL ACCOUNTS</span>
                <Users size={15} />
              </div>
              <div className="cl-kpi-val">{overview?.stats.users ?? "—"}</div>
              <div className="cl-kpi-sub">{overview?.stats.activeEmployees ?? 0} active employees</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>LIVE PRODUCTS</span>
                <Boxes size={15} />
              </div>
              <div className="cl-kpi-val">{overview?.stats.products ?? "—"}</div>
              <div className="cl-kpi-sub">Synced to homepage</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>ENGINEERING SERVICES</span>
                <Cpu size={15} />
              </div>
              <div className="cl-kpi-val">{overview?.stats.services ?? "—"}</div>
              <div className="cl-kpi-sub">Software to silicon</div>
            </div>
            <div className="cl-kpi">
              <div className="cl-kpi-top">
                <span>INQUIRIES</span>
                <Inbox size={15} />
              </div>
              <div className="cl-kpi-val">{overview?.stats.totalInquiries ?? "—"}</div>
              <div className="cl-kpi-sub">{overview?.stats.newInquiries ?? 0} awaiting review</div>
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>Recent Inquiries</h2>
                  <p>Incoming project leads from the website &amp; client portal</p>
                </div>
                <button type="button" className="cl-btn outline sm" onClick={() => setTab("inquiries")}>
                  View all
                </button>
              </div>
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Interest</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.recentInquiries || []).map((inq) => (
                      <tr key={inq.id}>
                        <td>
                          <strong>{inq.name}</strong>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{inq.email}</div>
                        </td>
                        <td>{inq.interest}</td>
                        <td>
                          <span className={`cl-pill ${inq.status === "new" ? "warn" : "mint"}`}>
                            {inq.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!overview?.recentInquiries || overview.recentInquiries.length === 0) && (
                      <tr>
                        <td colSpan={3} style={{ color: "var(--muted)" }}>
                          No inquiries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cl-card">
              <div className="cl-card-head">
                <div>
                  <h2>System Audit Log</h2>
                  <p>PostgreSQL activity across CMS, HR, and auth</p>
                </div>
                <Activity size={18} style={{ color: "var(--signal-deep)" }} />
              </div>
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Actor</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.auditLogs || []).slice(0, 8).map((a) => (
                      <tr key={a.id}>
                        <td className="mono" style={{ fontSize: 11.5 }}>{a.action}</td>
                        <td>{a.actor_name || "System"}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "cms_copy" && copyDraft && (
        <form className="cl-card" onSubmit={saveSiteCopy}>
          <div className="cl-card-head">
            <div>
              <h2>Live Frontend Copy Editor</h2>
              <p>Changes save directly to PostgreSQL and update the public homepage immediately.</p>
            </div>
            <button type="submit" className="cl-btn mint" disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Publish Changes
            </button>
          </div>

          <div className="cl-form-grid">
            <div className="cl-field">
              <label>Hero Eyebrow Badge</label>
              <input
                className="cl-input"
                value={copyDraft.heroBadge}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroBadge: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Hero Title Line 1</label>
              <input
                className="cl-input"
                value={copyDraft.heroTitleLine1}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroTitleLine1: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Hero Title Line 2</label>
              <input
                className="cl-input"
                value={copyDraft.heroTitleLine2}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroTitleLine2: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Hero Italic Accent Word</label>
              <input
                className="cl-input"
                value={copyDraft.heroTitleAccent}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroTitleAccent: e.target.value })}
              />
            </div>
            <div className="cl-field full">
              <label>Hero Subheadline</label>
              <textarea
                rows={2}
                className="cl-textarea"
                value={copyDraft.heroDescription}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroDescription: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Primary CTA Label</label>
              <input
                className="cl-input"
                value={copyDraft.heroPrimaryCta}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroPrimaryCta: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Secondary CTA Label</label>
              <input
                className="cl-input"
                value={copyDraft.heroSecondaryCta}
                onChange={(e) => setCopyDraft({ ...copyDraft, heroSecondaryCta: e.target.value })}
              />
            </div>
            <div className="cl-field full">
              <label>Statement Banner Copy</label>
              <textarea
                rows={2}
                className="cl-textarea"
                value={copyDraft.statementBody}
                onChange={(e) => setCopyDraft({ ...copyDraft, statementBody: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Products Section Heading</label>
              <input
                className="cl-input"
                value={copyDraft.productsHeading}
                onChange={(e) => setCopyDraft({ ...copyDraft, productsHeading: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Services Section Heading</label>
              <input
                className="cl-input"
                value={copyDraft.servicesHeading}
                onChange={(e) => setCopyDraft({ ...copyDraft, servicesHeading: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Contact Section Heading</label>
              <input
                className="cl-input"
                value={copyDraft.contactHeading}
                onChange={(e) => setCopyDraft({ ...copyDraft, contactHeading: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label>Footer Tagline</label>
              <input
                className="cl-input"
                value={copyDraft.footerTagline}
                onChange={(e) => setCopyDraft({ ...copyDraft, footerTagline: e.target.value })}
              />
            </div>
            <div className="cl-field full">
              <label>Toolchain Marquee Chips (comma-separated)</label>
              <input
                className="cl-input"
                value={toolsText}
                onChange={(e) => setToolsText(e.target.value)}
              />
            </div>
          </div>
        </form>
      )}

      {tab === "cms_products" && (
        <div className="cl-grid-2">
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Products in Database</h2>
                <p>Rendered in the Product Lab section on the homepage</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(cms?.products || []).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong>{p.name}</strong>
                      <span className="cl-pill mint">{p.statusLabel}</span>
                      {!p.isPublished && <span className="cl-pill warn">Draft</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{p.tagline}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="cl-btn outline sm"
                      onClick={() =>
                        setProductDraft({ ...p, pointsText: (p.points || []).join("\n") })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cl-btn danger sm"
                      onClick={() => deleteCmsItem("product", p.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="cl-card" onSubmit={saveProduct}>
            <div className="cl-card-head">
              <div>
                <h2>{productDraft.id ? "Edit Product" : "Add New Product"}</h2>
                <p>Matches the existing Product Lab card design automatically</p>
              </div>
              {productDraft.id && (
                <button
                  type="button"
                  className="cl-btn outline sm"
                  onClick={() =>
                    setProductDraft({
                      name: "",
                      slug: "",
                      tagline: "",
                      summary: "",
                      status: "development",
                      statusLabel: "In development",
                      href: "",
                      pointsText: "",
                      icon: "GraduationCap",
                      sortOrder: cms?.products.length || 0,
                      isPublished: true,
                    })
                  }
                >
                  New
                </button>
              )}
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Product Name</label>
                <input
                  required
                  className="cl-input"
                  value={productDraft.name || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })}
                  placeholder="e.g. Porikkha"
                />
              </div>
              <div className="cl-field">
                <label>Slug</label>
                <input
                  className="cl-input"
                  value={productDraft.slug || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, slug: e.target.value })}
                  placeholder="porikkha"
                />
              </div>
              <div className="cl-field full">
                <label>Tagline</label>
                <input
                  required
                  className="cl-input"
                  value={productDraft.tagline || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, tagline: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Status</label>
                <select
                  className="cl-select"
                  value={productDraft.status || "development"}
                  onChange={(e) =>
                    setProductDraft({
                      ...productDraft,
                      status: e.target.value as "testing" | "development" | "live",
                    })
                  }
                >
                  <option value="testing">Testing</option>
                  <option value="development">Development</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Status Badge Label</label>
                <input
                  required
                  className="cl-input"
                  value={productDraft.statusLabel || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, statusLabel: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>External URL (Optional)</label>
                <input
                  className="cl-input"
                  value={productDraft.href || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, href: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="cl-field">
                <label>Icon</label>
                <select
                  className="cl-select"
                  value={productDraft.icon || "GraduationCap"}
                  onChange={(e) => setProductDraft({ ...productDraft, icon: e.target.value })}
                >
                  <option value="GraduationCap">GraduationCap</option>
                  <option value="ShieldCheck">ShieldCheck</option>
                  <option value="Cpu">Cpu</option>
                  <option value="Layers3">Layers3</option>
                  <option value="Sparkles">Sparkles</option>
                </select>
              </div>
              <div className="cl-field full">
                <label>Summary</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  value={productDraft.summary || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, summary: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>Key Bullet Points (one per line)</label>
                <textarea
                  rows={3}
                  className="cl-textarea"
                  value={productDraft.pointsText || ""}
                  onChange={(e) => setProductDraft({ ...productDraft, pointsText: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Plus size={15} /> {productDraft.id ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "cms_services" && (
        <div className="cl-grid-2">
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Engineering Services Stack</h2>
                <p>Displayed in the interactive dark stack rail on the homepage</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(cms?.services || []).map((s, idx) => (
                <div
                  key={s.id}
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
                    <div className="mono" style={{ fontSize: 10, color: "var(--signal-deep)" }}>
                      LAYER 0{idx + 1} · {s.layer.toUpperCase()}
                    </div>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{s.summary}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <button
                      type="button"
                      className="cl-btn outline sm"
                      onClick={() => setServiceDraft({ ...s, tagsText: (s.tags || []).join(", ") })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cl-btn danger sm"
                      onClick={() => deleteCmsItem("service", s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="cl-card" onSubmit={saveService}>
            <div className="cl-card-head">
              <div>
                <h2>{serviceDraft.id ? "Edit Service" : "Add Service Layer"}</h2>
                <p>Add or edit an engineering discipline</p>
              </div>
              {serviceDraft.id && (
                <button
                  type="button"
                  className="cl-btn outline sm"
                  onClick={() =>
                    setServiceDraft({
                      layer: "",
                      name: "",
                      summary: "",
                      tagsText: "",
                      imageUrl: "/services/software.png",
                      imageAlt: "",
                      icon: "Code2",
                      sortOrder: cms?.services.length || 0,
                      isPublished: true,
                    })
                  }
                >
                  New
                </button>
              )}
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Stack Layer</label>
                <input
                  required
                  className="cl-input"
                  value={serviceDraft.layer || ""}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, layer: e.target.value })}
                  placeholder="e.g. Silicon, Application"
                />
              </div>
              <div className="cl-field">
                <label>Service Name</label>
                <input
                  required
                  className="cl-input"
                  value={serviceDraft.name || ""}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, name: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>Summary</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  value={serviceDraft.summary || ""}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, summary: e.target.value })}
                />
              </div>
              <div className="cl-field full">
                <label>Capability Tags (comma-separated)</label>
                <input
                  className="cl-input"
                  value={serviceDraft.tagsText || ""}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, tagsText: e.target.value })}
                  placeholder="CUDA, Kernel optimization, Profiling"
                />
              </div>
              <div className="cl-field">
                <label>Background Art</label>
                <select
                  className="cl-select"
                  value={serviceDraft.imageUrl || "/services/software.png"}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, imageUrl: e.target.value })}
                >
                  <option value="/services/software.png">Software / AI</option>
                  <option value="/services/gpu.png">GPU Accelerator</option>
                  <option value="/services/iot.png">IoT Gateway</option>
                  <option value="/services/automation.png">PLC Automation</option>
                  <option value="/services/embedded.png">Embedded PCB</option>
                  <option value="/services/silicon.png">Silicon Wafer</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Icon</label>
                <select
                  className="cl-select"
                  value={serviceDraft.icon || "Code2"}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, icon: e.target.value })}
                >
                  <option value="Code2">Code2</option>
                  <option value="Cpu">Cpu</option>
                  <option value="Radio">Radio</option>
                  <option value="SlidersHorizontal">SlidersHorizontal</option>
                  <option value="CircuitBoard">CircuitBoard</option>
                  <option value="Layers3">Layers3</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Save size={15} /> {serviceDraft.id ? "Update Service" : "Add Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "cms_work" && (
        <div className="cl-grid-2">
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Selected Work / Case Studies</h2>
                <p>Shown in the dark Engineering in Practice section</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(cms?.projects || []).map((pr) => (
                <div
                  key={pr.id}
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
                    <span className="cl-pill dark" style={{ marginBottom: 6 }}>
                      {pr.kind}
                    </span>
                    <div>
                      <strong>{pr.title}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{pr.summary}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <button
                      type="button"
                      className="cl-btn outline sm"
                      onClick={() => setProjectDraft({ ...pr, tagsText: (pr.tags || []).join(", ") })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cl-btn danger sm"
                      onClick={() => deleteCmsItem("project", pr.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="cl-card" onSubmit={saveProject}>
            <div className="cl-card-head">
              <div>
                <h2>{projectDraft.id ? "Edit Case Study" : "Add Case Study"}</h2>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Title</label>
                <input
                  required
                  className="cl-input"
                  value={projectDraft.title || ""}
                  onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Kind</label>
                <select
                  className="cl-select"
                  value={projectDraft.kind || "Representative engagement"}
                  onChange={(e) => setProjectDraft({ ...projectDraft, kind: e.target.value })}
                >
                  <option value="Product">Product</option>
                  <option value="Representative engagement">Representative engagement</option>
                  <option value="Client case study">Client case study</option>
                </select>
              </div>
              <div className="cl-field full">
                <label>Summary</label>
                <textarea
                  required
                  rows={3}
                  className="cl-textarea"
                  value={projectDraft.summary || ""}
                  onChange={(e) => setProjectDraft({ ...projectDraft, summary: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Tags (comma-separated)</label>
                <input
                  className="cl-input"
                  value={projectDraft.tagsText || ""}
                  onChange={(e) => setProjectDraft({ ...projectDraft, tagsText: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>External Link (Optional)</label>
                <input
                  className="cl-input"
                  value={projectDraft.href || ""}
                  onChange={(e) => setProjectDraft({ ...projectDraft, href: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Save size={15} /> Save Work Item
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "integrations" && integrations && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* SMTP Provider */}
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} /> Email Provider (SMTP)
                </h2>
                <p>
                  Used for inquiry confirmations, replies, leave notifications, and welcome emails.
                  Passwords are encrypted with AES-256-GCM at rest.
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={integrations.smtp.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      smtp: { ...integrations.smtp, enabled: e.target.checked },
                    })
                  }
                />
                Enabled
              </label>
            </div>

            <div className="cl-form-grid">
              <div className="cl-field">
                <label>SMTP Host</label>
                <input
                  className="cl-input"
                  placeholder="smtp.resend.com / smtp.gmail.com"
                  value={integrations.smtp.host}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      smtp: { ...integrations.smtp, host: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>Port &amp; TLS</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="number"
                    className="cl-input"
                    value={integrations.smtp.port}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        smtp: { ...integrations.smtp, port: Number(e.target.value) },
                      })
                    }
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={integrations.smtp.secure}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          smtp: { ...integrations.smtp, secure: e.target.checked },
                        })
                      }
                    />
                    SSL (465)
                  </label>
                </div>
              </div>
              <div className="cl-field">
                <label>SMTP Username</label>
                <input
                  className="cl-input"
                  value={integrations.smtp.username}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      smtp: { ...integrations.smtp, username: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>
                  SMTP Password{" "}
                  {integrations.smtp.hasPassword ? `(Saved: ${integrations.smtp.passwordMasked})` : ""}
                </label>
                <input
                  type="password"
                  className="cl-input"
                  placeholder={integrations.smtp.hasPassword ? "Leave blank to keep existing" : "Enter SMTP password"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
              <div className="cl-field">
                <label>From Name</label>
                <input
                  className="cl-input"
                  value={integrations.smtp.fromName}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      smtp: { ...integrations.smtp, fromName: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>From Email</label>
                <input
                  className="cl-input"
                  placeholder="no-reply@choloklabs.com"
                  value={integrations.smtp.fromEmail}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      smtp: { ...integrations.smtp, fromEmail: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className="cl-btn primary" onClick={() => saveProvider("smtp")} disabled={saving}>
                <Save size={15} /> Save SMTP Settings
              </button>
              <input
                className="cl-input"
                style={{ maxWidth: 260 }}
                placeholder="recipient@example.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
              />
              <button type="button" className="cl-btn mint" onClick={() => testProvider("test_email")} disabled={saving}>
                <Send size={14} /> Send Test Email
              </button>
            </div>
          </div>

          {/* SMS Provider */}
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={18} /> SMS Provider
                </h2>
                <p>Configure Twilio, Vonage, or a custom HTTP SMS gateway for HR &amp; alert messaging.</p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={integrations.sms.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      sms: { ...integrations.sms, enabled: e.target.checked },
                    })
                  }
                />
                Enabled
              </label>
            </div>

            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Gateway Provider</label>
                <select
                  className="cl-select"
                  value={integrations.sms.provider}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      sms: {
                        ...integrations.sms,
                        provider: e.target.value as "twilio" | "vonage" | "webhook",
                      },
                    })
                  }
                >
                  <option value="twilio">Twilio</option>
                  <option value="vonage">Vonage (Nexmo)</option>
                  <option value="webhook">Custom HTTP Webhook</option>
                </select>
              </div>
              <div className="cl-field">
                <label>Account SID / API Key</label>
                <input
                  className="cl-input"
                  value={integrations.sms.accountSid}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      sms: { ...integrations.sms, accountSid: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>
                  Auth Token / Secret{" "}
                  {integrations.sms.hasAuthToken ? `(Saved: ${integrations.sms.authTokenMasked})` : ""}
                </label>
                <input
                  type="password"
                  className="cl-input"
                  placeholder={integrations.sms.hasAuthToken ? "Leave blank to keep existing" : "Enter token"}
                  value={smsToken}
                  onChange={(e) => setSmsToken(e.target.value)}
                />
              </div>
              <div className="cl-field">
                <label>From Number / Sender ID</label>
                <input
                  className="cl-input"
                  placeholder="+15551234567"
                  value={integrations.sms.fromNumber}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      sms: { ...integrations.sms, fromNumber: e.target.value },
                    })
                  }
                />
              </div>
              {integrations.sms.provider === "webhook" && (
                <div className="cl-field full">
                  <label>Custom Webhook Endpoint URL</label>
                  <input
                    className="cl-input"
                    placeholder="https://sms.yourprovider.com/v1/send"
                    value={integrations.sms.webhookUrl}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        sms: { ...integrations.sms, webhookUrl: e.target.value },
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className="cl-btn primary" onClick={() => saveProvider("sms")} disabled={saving}>
                <Save size={15} /> Save SMS Settings
              </button>
              <input
                className="cl-input"
                style={{ maxWidth: 240 }}
                placeholder="+15550001111"
                value={testSmsTo}
                onChange={(e) => setTestSmsTo(e.target.value)}
              />
              <button type="button" className="cl-btn mint" onClick={() => testProvider("test_sms")} disabled={saving}>
                <Send size={14} /> Send Test SMS
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={18} /> Sign in with Google (OAuth 2.0)
                </h2>
                <p>
                  When enabled, the &ldquo;Continue with Google&rdquo; button automatically appears on
                  /login and /register.
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={integrations.google_oauth.enabled}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      google_oauth: { ...integrations.google_oauth, enabled: e.target.checked },
                    })
                  }
                />
                Enabled
              </label>
            </div>

            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Google Client ID</label>
                <input
                  className="cl-input"
                  placeholder="xxxxx.apps.googleusercontent.com"
                  value={integrations.google_oauth.clientId}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      google_oauth: { ...integrations.google_oauth, clientId: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>
                  Google Client Secret{" "}
                  {integrations.google_oauth.hasClientSecret
                    ? `(Saved: ${integrations.google_oauth.clientSecretMasked})`
                    : ""}
                </label>
                <input
                  type="password"
                  className="cl-input"
                  placeholder={
                    integrations.google_oauth.hasClientSecret
                      ? "Leave blank to keep existing"
                      : "Enter Client Secret"
                  }
                  value={googleSecret}
                  onChange={(e) => setGoogleSecret(e.target.value)}
                />
              </div>
              <div className="cl-field">
                <label>Restrict Hosted Domain (Optional)</label>
                <input
                  className="cl-input"
                  placeholder="choloklabs.com (leave empty for any Google account)"
                  value={integrations.google_oauth.allowedDomain}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      google_oauth: { ...integrations.google_oauth, allowedDomain: e.target.value },
                    })
                  }
                />
              </div>
              <div className="cl-field">
                <label>Authorized Redirect URI (add to Google Cloud Console)</label>
                <input
                  readOnly
                  className="cl-input mono"
                  style={{ fontSize: 12 }}
                  value={`${origin}/api/auth/google/callback`}
                />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={integrations.google_oauth.allowSignup}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      google_oauth: { ...integrations.google_oauth, allowSignup: e.target.checked },
                    })
                  }
                />
                Allow automatic client account registration via Google
              </label>
              <button
                type="button"
                className="cl-btn primary"
                onClick={() => saveProvider("google_oauth")}
                disabled={saving}
              >
                <Save size={15} /> Save Google OAuth
              </button>
            </div>
          </div>

          {/* Delivery Logs */}
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Email &amp; SMS Delivery Logs</h2>
                <p>Real-time dispatch status from PostgreSQL</p>
              </div>
            </div>
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Recipient</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {notifLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="mono">{log.channel.toUpperCase()}</td>
                      <td>{log.recipient}</td>
                      <td>{log.provider}</td>
                      <td>
                        <span className={`cl-pill ${log.status === "sent" ? "mint" : "danger"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>
                        {log.error_message || log.subject}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {notifLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ color: "var(--muted)" }}>
                        No email or SMS dispatches recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="cl-grid-2">
          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>All Project Inquiries</h2>
                <p>Click an inquiry to respond or update status</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inquiries.map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => {
                    setActiveInquiry(inq);
                    setReplyText(inq.admin_reply || "");
                    setReplyStatus(inq.status === "new" ? "replied" : inq.status);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 12,
                    border:
                      activeInquiry?.id === inq.id
                        ? "1.5px solid var(--signal-deep)"
                        : "1px solid var(--line)",
                    background: activeInquiry?.id === inq.id ? "var(--mint-tint)" : "var(--paper)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{inq.name}</strong>
                    <span className={`cl-pill ${inq.status === "new" ? "warn" : "mint"}`}>
                      {inq.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {inq.email} {inq.company ? `· ${inq.company}` : ""} · {inq.interest}
                  </div>
                  <p style={{ fontSize: 13, marginTop: 6, color: "var(--ink)" }}>{inq.message}</p>
                </button>
              ))}
              {inquiries.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No inquiries submitted yet.</p>
              )}
            </div>
          </div>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>Inquiry Response</h2>
                <p>Reply directly and optionally dispatch via SMTP</p>
              </div>
            </div>
            {activeInquiry ? (
              <form onSubmit={submitInquiryReply} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "var(--paper)", fontSize: 13 }}>
                  <strong>{activeInquiry.name}</strong> ({activeInquiry.email})
                  <div className="mono" style={{ fontSize: 11, color: "var(--signal-deep)", marginTop: 4 }}>
                    INTEREST: {activeInquiry.interest}
                  </div>
                  <p style={{ marginTop: 8 }}>{activeInquiry.message}</p>
                </div>

                <div className="cl-field">
                  <label>Status</label>
                  <select
                    className="cl-select"
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="cl-field">
                  <label>Team Reply</label>
                  <textarea
                    rows={5}
                    className="cl-textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your engineering response or next steps..."
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={sendReplyEmail}
                    onChange={(e) => setSendReplyEmail(e.target.checked)}
                  />
                  Also send reply via configured SMTP email provider
                </label>

                <button type="submit" className="cl-btn primary" disabled={saving}>
                  <Send size={15} /> Save &amp; Send Reply
                </button>
              </form>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Select an inquiry from the left to view details and reply.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <form className="cl-card" onSubmit={createUser}>
            <div className="cl-card-head">
              <div>
                <h2>Create User Account</h2>
                <p>Provision Admin, HR, Employee, or Client portal accounts</p>
              </div>
            </div>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Full Name</label>
                <input
                  required
                  className="cl-input"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  className="cl-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Password (min. 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="cl-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="cl-field">
                <label>Role</label>
                <select
                  className="cl-select"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as "USER" | "EMPLOYEE" | "HR" | "ADMIN",
                    })
                  }
                >
                  <option value="USER">USER (Client)</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="cl-btn primary" disabled={saving}>
                <Plus size={15} /> Create Account
              </button>
            </div>
          </form>

          <div className="cl-card">
            <div className="cl-card-head">
              <div>
                <h2>All Users ({users.length})</h2>
                <p>Manage role assignments and account status</p>
              </div>
            </div>
            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Auth</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name}</strong>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                      </td>
                      <td>
                        <select
                          className="cl-select"
                          style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                          value={u.role}
                          onChange={(e) => updateUserRow(u.id, { role: e.target.value })}
                        >
                          <option value="USER">USER</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="HR">HR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        <span className="cl-pill">{u.has_google ? "Google + Email" : "Email"}</span>
                      </td>
                      <td>
                        <span className={`cl-pill ${u.status === "active" ? "mint" : "danger"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cl-btn outline sm"
                          onClick={() =>
                            updateUserRow(u.id, {
                              status: u.status === "active" ? "suspended" : "active",
                            })
                          }
                        >
                          {u.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "ent_finance" && <EnterpriseFinancePanel onNotify={notify} />}
      {tab === "ent_okr" && <EnterpriseOkrPanel onNotify={notify} />}
      {tab === "ent_engineering" && <EnterpriseEngineeringPanel onNotify={notify} />}
      {tab === "ent_projects" && <EnterpriseProjectPanel onNotify={notify} />}
      {tab === "ent_knowledge" && <EnterpriseKnowledgePanel authorName={user.fullName} onNotify={notify} />}
      {tab === "ops_projects" && <AdminOperationsPanel mode="projects" onNotify={notify} />}
      {tab === "ops_tickets" && <AdminOperationsPanel mode="tickets" onNotify={notify} />}
      {tab === "ops_billing" && <AdminOperationsPanel mode="billing" onNotify={notify} />}
      {tab === "cms_blog" && <AdminBlogPanel authorName={user.fullName} onNotify={notify} />}
      {tab === "erp_tree" && <ErpCommandPanel mode="org_tree" onNotify={notify} />}
      {tab === "erp_commits" && <ErpCommandPanel mode="commits" onNotify={notify} />}
      {tab === "erp_datasets" && <ErpCommandPanel mode="datasets" onNotify={notify} />}
      {tab === "erp_marketing" && <ErpCommandPanel mode="marketing" onNotify={notify} />}
      {tab === "erp_interns" && <ErpCommandPanel mode="interns" onNotify={notify} />}
    </DashboardShell>
  );
}
