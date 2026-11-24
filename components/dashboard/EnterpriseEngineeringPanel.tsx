"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  GitCommitHorizontal,
  Plus,
  ShieldAlert,
  Terminal,
  Zap,
  Clock,
  ExternalLink
} from "lucide-react";

interface Incident {
  id: string;
  incident_code: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3";
  service_affected: string;
  owner_name: string;
  status: string;
  root_cause: string;
  postmortem: string;
  started_at: string;
  resolved_at?: string;
}

interface Commit {
  id: string;
  commit_hash: string;
  repository: string;
  message: string;
  author_name: string;
  authored_at: string;
  employee_name: string;
}

export default function EnterpriseEngineeringPanel({
  onNotify,
}: {
  onNotify?: (type: "ok" | "err", msg: string) => void;
} = {}) {
  const [activeTab, setActiveTab] = useState<"dora" | "incidents" | "commits">("dora");
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [dora, setDora] = useState({
    deploymentFrequency: "4.2 deploys / week",
    leadTimeForChanges: "18.4 hours",
    changeFailureRate: "1.8%",
    meanTimeToRestore: "24 minutes",
    buildSuccessRate: "98.2%",
    activeServices: 8,
  });

  // New Incident Modal
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState<"SEV1" | "SEV2" | "SEV3">("SEV2");
  const [newService, setNewService] = useState("Core Platform");
  const [newRootCause, setNewRootCause] = useState("");

  const fetchEngData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/engineering");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        setCommits(data.commits || []);
        if (data.dora) setDora(data.dora);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngData();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/engineering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_incident",
          title: newTitle,
          severity: newSeverity,
          service_affected: newService,
          root_cause: newRootCause,
        }),
      });
      setCreateModal(false);
      setNewTitle("");
      setNewRootCause("");
      fetchEngData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      await fetch("/api/admin/engineering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_incident",
          id,
          postmortem: "Mitigated and verified on staging cluster.",
        }),
      });
      fetchEngData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub Tabs Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 16px",
          background: "rgba(11,18,34,0.7)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {(["dora", "incidents", "commits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === tab ? "rgba(94,242,200,0.15)" : "transparent",
                color: activeTab === tab ? "#5ef2c8" : "#94a3b8",
                border: activeTab === tab ? "1px solid rgba(94,242,200,0.3)" : "1px solid transparent",
              }}
            >
              {tab === "dora" && "DORA & Pipeline Metrics"}
              {tab === "incidents" && `Incident Ops (${incidents.filter((i) => i.status !== "resolved").length} active)`}
              {tab === "commits" && "Repository Commits"}
            </button>
          ))}
        </div>

        {activeTab === "incidents" && (
          <button
            onClick={() => setCreateModal(true)}
            className="cl-btn sm primary"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> Log Engineering Incident
          </button>
        )}
      </div>

      {/* DORA Metrics Tab */}
      {activeTab === "dora" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={14} color="#5ef2c8" /> Deployment Frequency
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{dora.deploymentFrequency}</div>
              <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>Standard Elite Tier</div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} color="#38bdf8" /> Lead Time for Changes
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{dora.leadTimeForChanges}</div>
              <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 4 }}>From commit to production</div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} color="#f97316" /> Change Failure Rate
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{dora.changeFailureRate}</div>
              <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>Well under 5% threshold</div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={14} color="#818cf8" /> Mean Time to Restore (MTTR)
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{dora.meanTimeToRestore}</div>
              <div style={{ fontSize: 11, color: "#818cf8", marginTop: 4 }}>High-reliability recovery</div>
            </div>
          </div>

          <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>
              Active CI/CD Pipelines &amp; Edge Build Status
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              Continuous integration builds running across Porikkha, BOLoy firmware toolchains, and dataset preprocessing clusters.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { repo: "choloklabs/porikkha-core", branch: "main", commit: "3a8f9c1", status: "Passing", time: "12m ago" },
                { repo: "choloklabs/boloy-edge-rtos", branch: "release/v1.2", commit: "9e2d40b", status: "Passing", time: "1h ago" },
                { repo: "choloklabs/bangla-speech-conformer", branch: "quantize-int4", commit: "7c12ba4", status: "Passing", time: "3h ago" }
              ].map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(15,23,42,0.6)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <GitBranch size={16} color="#818cf8" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{p.repo}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                      {p.branch}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>{p.commit}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399", background: "rgba(52,211,153,0.15)", padding: "2px 8px", borderRadius: 4 }}>
                      {p.status}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{p.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === "incidents" && (
        <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 14px" }}>
            Production Incidents &amp; Root Cause Postmortems
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {incidents.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b" }}>
                Zero active production incidents. All services operational.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    border: inc.status === "resolved" ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(248,113,113,0.3)",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: inc.severity === "SEV1" ? "#dc2626" : inc.severity === "SEV2" ? "#f97316" : "#eab308",
                          color: "#ffffff",
                        }}
                      >
                        {inc.severity}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                        [{inc.incident_code}] {inc.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: inc.status === "resolved" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                          color: inc.status === "resolved" ? "#34d399" : "#fca5a5",
                        }}
                      >
                        {inc.status.toUpperCase()}
                      </span>
                      {inc.status !== "resolved" && (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "#059669",
                            color: "#ffffff",
                            border: "none",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Resolve &amp; Close
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
                    Service: <strong style={{ color: "#cbd5e1" }}>{inc.service_affected}</strong> &bull; Lead: {inc.owner_name}
                  </div>
                  {inc.root_cause && (
                    <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                      Root Cause: {inc.root_cause}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Commits Tab */}
      {activeTab === "commits" && (
        <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 14px" }}>
            Synchronized Repository Commits
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Hash</th>
                  <th style={{ padding: "10px 12px" }}>Repository</th>
                  <th style={{ padding: "10px 12px" }}>Message</th>
                  <th style={{ padding: "10px 12px" }}>Author</th>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {commits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px 0", textAlign: "center", color: "#64748b" }}>
                      No commits synchronized yet. Sync via ERP panel or configure GitHub webhook.
                    </td>
                  </tr>
                ) : (
                  commits.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#818cf8" }}>{c.commit_hash.slice(0, 7)}</td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{c.repository}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{c.message}</td>
                      <td style={{ padding: "10px 12px" }}>{c.employee_name || c.author_name}</td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{new Date(c.authored_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Incident Modal */}
      {createModal && (
        <div
          onClick={() => setCreateModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 500,
              background: "#080e1a",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#ffffff" }}>Log Engineering Incident</h3>
            <form onSubmit={handleCreateIncident} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ingestion pipeline bottleneck during 48kHz audio batching"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="cl-input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="cl-label" style={{ fontSize: 12 }}>Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="cl-input"
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    <option value="SEV1">SEV1 (Critical Outage)</option>
                    <option value="SEV2">SEV2 (Degraded Performance)</option>
                    <option value="SEV3">SEV3 (Minor Flaw)</option>
                  </select>
                </div>
                <div>
                  <label className="cl-label" style={{ fontSize: 12 }}>Service Affected</label>
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="cl-input"
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </div>
              </div>

              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Initial Root Cause &amp; Observations</label>
                <textarea
                  rows={3}
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  className="cl-input"
                  placeholder="Describe initial symptoms and debugging observations..."
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="cl-btn sm outline"
                  style={{ background: "transparent", color: "var(--paper)" }}
                >
                  Cancel
                </button>
                <button type="submit" className="cl-btn sm primary" style={{ background: "#dc2626" }}>
                  Record Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
