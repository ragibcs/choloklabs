"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, CheckCircle2, AlertTriangle, Plus, Sparkles, RefreshCw } from "lucide-react";

interface KeyResult {
  id: string;
  title: string;
  metric_type: string;
  target_value: number;
  current_value: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  category: string;
  year: number;
  quarter: string;
  owner_name: string;
  confidence_score: number;
  status: string;
  key_results: KeyResult[];
}

export default function EnterpriseOkrPanel({
  onNotify,
}: {
  onNotify?: (type: "ok" | "err", msg: string) => void;
} = {}) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Research & AI");
  const [newQuarter, setNewQuarter] = useState("Q1");
  const [newConfidence, setNewConfidence] = useState(0.85);

  const fetchOkrs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/okr");
      if (res.ok) {
        const data = await res.json();
        setObjectives(data.objectives || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOkrs();
  }, []);

  const handleUpdateKrValue = async (krId: string, currentVal: number) => {
    try {
      await fetch("/api/admin/okr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_kr_value",
          kr_id: krId,
          current_value: currentVal,
        }),
      });
      fetchOkrs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/okr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_objective",
          title: newTitle,
          category: newCategory,
          quarter: newQuarter,
          confidence_score: newConfidence,
        }),
      });
      setCreateModal(false);
      setNewTitle("");
      fetchOkrs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 20px",
          background: "rgba(11,18,34,0.7)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Company Objectives &amp; Strategic Key Results (OKRs)
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
            Transparent execution alignment connecting company strategy to engineering sprints and datasets.
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="cl-btn sm primary"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> New Strategic Objective
        </button>
      </div>

      {/* Objectives Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {objectives.map((obj) => (
          <div
            key={obj.id}
            style={{
              background: "#090f1d",
              padding: "22px 24px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(94,242,200,0.15)",
                      color: "#5ef2c8",
                    }}
                  >
                    {obj.quarter} {obj.year}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(56,189,248,0.15)",
                      color: "#38bdf8",
                    }}
                  >
                    {obj.category}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    Owner: <strong style={{ color: "#cbd5e1" }}>{obj.owner_name}</strong>
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  {obj.title}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Confidence Score</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#5ef2c8" }}>
                    {(Number(obj.confidence_score) * 100).toFixed(0)}%
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: obj.status === "on_track" ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)",
                    color: obj.status === "on_track" ? "#34d399" : "#fb923c",
                  }}
                >
                  {obj.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Key Results List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                Key Results ({obj.key_results.length})
              </div>
              {obj.key_results.map((kr) => {
                const pct = Math.min(100, Math.round((Number(kr.current_value) / Number(kr.target_value)) * 100));
                return (
                  <div
                    key={kr.id}
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{kr.title}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                        <span>
                          {Number(kr.current_value).toLocaleString()} / {Number(kr.target_value).toLocaleString()} {kr.unit}
                        </span>
                        <span style={{ color: "#5ef2c8", fontSize: 12 }}>({pct}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: pct >= 80 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #38bdf8, #818cf8)",
                          borderRadius: 3,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* New Objective Modal */}
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
              border: "1px solid rgba(94,242,200,0.3)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#ffffff" }}>New Strategic Company Objective</h3>
            <form onSubmit={handleCreateObjective} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Objective Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expand Multi-Dialect Bangla Audio Corpus to 10,000 Hours"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="cl-input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="cl-label" style={{ fontSize: 12 }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="cl-input"
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    <option value="Research & AI">Research & AI</option>
                    <option value="Product Engineering">Product Engineering</option>
                    <option value="Edge Silicon">Edge Silicon</option>
                    <option value="Talent & People">Talent & People</option>
                    <option value="Commercialization">Commercialization</option>
                  </select>
                </div>
                <div>
                  <label className="cl-label" style={{ fontSize: 12 }}>Quarter</label>
                  <select
                    value={newQuarter}
                    onChange={(e) => setNewQuarter(e.target.value)}
                    className="cl-input"
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    <option value="Q1">Q1 2026</option>
                    <option value="Q2">Q2 2026</option>
                    <option value="Q3">Q3 2026</option>
                    <option value="Q4">Q4 2026</option>
                    <option value="Annual">Annual 2026</option>
                  </select>
                </div>
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
                <button type="submit" className="cl-btn sm primary">
                  Create Objective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
