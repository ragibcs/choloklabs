"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Command,
  FileText,
  FolderKanban,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Users,
  Upload,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { resizeImageFile } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  group?: string;
}

interface SearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardShell({
  user,
  roleLabel,
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  headerActions,
  children,
}: {
  user: SessionUser;
  roleLabel: string;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Command Palette State (Cmd + K)
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Notification Center State
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Quick Account modal
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
    currentPassword: "",
    newPassword: "",
  });

  // Close notification drawer when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notifOpen]);

  // Global Keyboard shortcut listener for Cmd/Ctrl + K and window resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
        setAccountOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mark all notifications as read
  async function markAllNotificationsRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Non-blocking
    }
  }

  // Live search handler
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch {
        // Non-blocking
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleLogout() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountSaving(true);
    setAccountMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          avatarUrl: profileForm.avatarUrl,
          ...(profileForm.newPassword
            ? {
                currentPassword: profileForm.currentPassword,
                newPassword: profileForm.newPassword,
              }
            : {}),
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not update account.");
      setProfileForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      setAccountMsg({ type: "ok", text: "Account & security settings saved." });
      router.refresh();
    } catch (err) {
      setAccountMsg({ type: "err", text: err instanceof Error ? err.message : "Update failed." });
    } finally {
      setAccountSaving(false);
    }
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  let lastGroup: string | undefined;

  const portalLinks =
    user.role === "ADMIN"
      ? [
          { href: "/dashboard/admin", label: "Executive Console" },
          { href: "/dashboard/hr", label: "HRMS & People" },
          { href: "/dashboard/employee", label: "Engineering Workspace" },
          { href: "/dashboard/user", label: "Client Portal" },
        ]
      : user.role === "HR"
      ? [
          { href: "/dashboard/hr", label: "HRMS Console" },
          { href: "/dashboard/employee", label: "My Workspace" },
        ]
      : [];

  return (
    <div className="cl-shell cl-app">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="cl-mobile-backdrop cl-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={sidebarOpen ? "cl-sidebar open" : "cl-sidebar"}>
        <div className="cl-side-head">
          <Link className="brand" href="/" style={{ fontSize: 20 }}>
            <svg width="26" height="28" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
              <path d="M17 1 2 10v16l15 9 7-4-15-9v-8l15-9zm9 6-14 8v5l14 8 7-4-14-8 14-8-5-2z" />
            </svg>
            <span>
              Cholok<span className="brand-light">Labs</span>
            </span>
          </Link>
          <button
            className="cl-mobile-toggle cl-btn sm outline"
            style={{ background: "transparent", color: "var(--paper)", borderColor: "#ffffff24" }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="cl-side-role">
          <i className="cl-pulse-dot" />
          ENTERPRISE OS · {roleLabel}
        </div>

        <nav className="cl-side-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showGroup = item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id}>
                {showGroup && <div className="cl-nav-group">{item.group}</div>}
                <button
                  type="button"
                  className={isActive ? "cl-nav-item active" : "cl-nav-item"}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="cl-nav-active-pill"
                      className="cl-nav-active-bg"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={17} className="cl-nav-icon" />
                  <span className="cl-nav-label">{item.label}</span>
                  {item.badge !== undefined && item.badge !== 0 && (
                    <span className="cl-nav-badge">{item.badge}</span>
                  )}
                </button>
              </div>
            );
          })}

          {portalLinks.length > 0 && (
            <>
              <div className="cl-nav-group">SWITCH PORTAL</div>
              {portalLinks.map((portal) => {
                const isCurrent = pathname === portal.href;
                return (
                  <Link
                    key={portal.href}
                    href={portal.href}
                    className={isCurrent ? "cl-nav-item cl-portal-current" : "cl-nav-item"}
                    style={{ fontSize: 13 }}
                  >
                    <span className="cl-nav-label">{portal.label}</span>
                    <ArrowUpRight size={14} style={{ marginLeft: "auto", opacity: isCurrent ? 1 : 0.65 }} />
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="cl-side-foot">
          <Link
            href="/"
            className="cl-nav-item"
            style={{ border: "1px solid #ffffff1a", fontSize: 13 }}
          >
            <span className="cl-nav-label">View Live Website</span>
            <ArrowUpRight size={15} style={{ marginLeft: "auto", color: "var(--signal)" }} />
          </Link>

          <button
            type="button"
            className="cl-user-chip cl-user-chip-btn"
            onClick={() => {
              setAccountMsg(null);
              setAccountOpen(true);
            }}
            title="Account & Password Settings"
          >
            <div className="cl-avatar" style={{ overflow: "hidden", padding: 0 }}>
              {(profileForm.avatarUrl || user.avatarUrl) ? (
                <img
                  src={profileForm.avatarUrl || user.avatarUrl}
                  alt={user.fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials || "CL"
              )}
            </div>
            <div className="cl-user-meta">
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
            </div>
            <KeyRound size={14} style={{ color: "var(--mist-2)", flexShrink: 0 }} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="cl-nav-item"
            style={{ color: "#fca5a5" }}
          >
            <LogOut size={16} />
            <span>{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="cl-main">
        <header className="cl-topbar">
          <div className="cl-topbar-left">
            <button
              type="button"
              className="cl-mobile-toggle cl-btn sm outline"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={16} />
            </button>
            <div className="cl-topbar-headings">
              <div className="cl-topbar-eyebrow">
                <i className="cl-pulse-dot-sm" />
                {roleLabel} COMMAND CENTER
              </div>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={title}
                  className="cl-topbar-title"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  {title}
                </motion.h1>
              </AnimatePresence>
              {subtitle && (
                <div className="cl-topbar-sub" title={subtitle}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="cl-topbar-right">
            {/* Universal Command Palette Trigger */}
            <button
              type="button"
              className="cl-topbar-search-btn"
              onClick={() => setCmdOpen(true)}
              title="Open Command Palette (⌘K)"
            >
              <Search size={14} className="cl-search-icon" />
              <span className="cl-search-text">Search OS...</span>
              <kbd className="cl-search-kbd">⌘K</kbd>
            </button>

            {/* Notification Bell with Badge */}
            <div ref={notifRef} className="cl-topbar-notif-wrap">
              <button
                type="button"
                className={`cl-topbar-icon-btn ${notifOpen ? "active" : ""}`}
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Notification Center"
              >
                <Bell size={16} />
                {unreadCount > 0 && <span className="cl-notif-badge-dot" />}
              </button>

              {/* Notification Dropdown Drawer */}
              {notifOpen && (
                <div className="cl-notif-dropdown">
                  <div className="cl-notif-header">
                    <div className="cl-notif-title">
                      Notifications {unreadCount > 0 && <span className="cl-notif-count">({unreadCount})</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="cl-notif-mark-read"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="cl-notif-list">
                    {notifications.length === 0 ? (
                      <div className="cl-notif-empty">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`cl-notif-item ${n.is_read ? "read" : "unread"}`}
                          onClick={() => {
                            if (n.link_url) {
                              setNotifOpen(false);
                              router.push(n.link_url);
                            }
                          }}
                        >
                          <div className="cl-notif-item-top">
                            <span className="cl-notif-item-title">{n.title}</span>
                            <span className="cl-notif-item-time">
                              {new Date(n.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="cl-notif-item-msg">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="cl-date-chip">
              <Calendar size={13} />
              {todayLabel}
            </span>
            {headerActions && <div className="cl-topbar-custom-actions">{headerActions}</div>}
          </div>
        </header>

        <main className="cl-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="cl-tab-stage"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Universal Command Palette Modal */}
      {cmdOpen && (
        <div
          onClick={() => setCmdOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "12vh",
            paddingInline: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 640,
              background: "#080e1a",
              border: "1px solid rgba(94,242,200,0.3)",
              borderRadius: 18,
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Search size={18} color="#5ef2c8" />
              <input
                autoFocus
                type="text"
                placeholder="Search projects, tasks, employees, documents, datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: 15,
                }}
              />
              <kbd
                style={{
                  background: "rgba(255,255,255,0.08)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results Area */}
            <div style={{ maxHeight: 380, overflowY: "auto", padding: 8 }}>
              {searchLoading ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  Searching verified records...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCmdOpen(false);
                      router.push(item.url);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: selectedIndex === idx ? "rgba(94,242,200,0.12)" : "transparent",
                      border: selectedIndex === idx ? "1px solid rgba(94,242,200,0.3)" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{item.title}</span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(56,189,248,0.15)",
                              color: "#38bdf8",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{item.subtitle}</div>
                    </div>
                    <ArrowRight size={14} color="#5ef2c8" style={{ opacity: selectedIndex === idx ? 1 : 0.3 }} />
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No matching records found.
                </div>
              ) : (
                <div style={{ padding: "16px 20px", color: "#64748b", fontSize: 12 }}>
                  Type to search across employees, projects, tasks, invoices, research datasets, and technical documentation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account & Password Settings Modal */}
      {accountOpen && (
        <div
          className="cl-modal-backdrop"
          onClick={() => setAccountOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="cl-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "var(--ink-2)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--paper)" }}>Account &amp; Security</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--mist)" }}>
                  {user.email} &bull; <strong style={{ color: "var(--signal)" }}>{user.role}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="cl-btn sm outline"
                style={{ background: "transparent", color: "var(--paper)" }}
              >
                <X size={15} />
              </button>
            </div>

            {accountMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 14,
                  background: accountMsg.type === "ok" ? "rgba(94,242,200,0.12)" : "rgba(248,113,113,0.12)",
                  color: accountMsg.type === "ok" ? "#5ef2c8" : "#fca5a5",
                  border: accountMsg.type === "ok" ? "1px solid rgba(94,242,200,0.3)" : "1px solid rgba(248,113,113,0.3)",
                }}
              >
                {accountMsg.text}
              </div>
            )}

            <form onSubmit={saveAccount} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Profile Photo / Avatar Upload */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg, rgba(94,242,200,0.2), rgba(56,189,248,0.2))", border: "2px solid rgba(94,242,200,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--signal)" }}>{initials || "CL"}</span>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--paper)" }}>Profile Photo</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label className="cl-btn sm primary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 10px" }}>
                      <Upload size={12} /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const base64 = await resizeImageFile(file, 400, 400, 0.85);
                            setProfileForm((prev) => ({ ...prev, avatarUrl: base64 }));
                          } catch {
                            setAccountMsg({ type: "err", text: "Could not process image file." });
                          }
                        }}
                      />
                    </label>
                    {profileForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, avatarUrl: "" }))}
                        className="cl-btn sm outline"
                        style={{ color: "#fca5a5", borderColor: "rgba(248,113,113,0.3)", padding: "4px 8px", fontSize: 12 }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="cl-input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="cl-input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--signal)" }}>
                  Change Password (optional)
                </span>
              </div>

              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Current Password</label>
                <input
                  type="password"
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="cl-input"
                  placeholder="Required only when changing password"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>New Password</label>
                <input
                  type="password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="cl-input"
                  placeholder="At least 8 characters"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setAccountOpen(false)}
                  className="cl-btn sm outline"
                  style={{ background: "transparent", color: "var(--paper)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="cl-btn sm primary"
                >
                  {accountSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
