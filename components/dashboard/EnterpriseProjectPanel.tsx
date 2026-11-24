"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Filter,
} from "lucide-react";

interface TaskItem {
  id: string;
  project_id: string | null;
  project_title?: string;
  title: string;
  description: string;
  assignee_id: string | null;
  assignee_name?: string;
  assignee_designation?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "review" | "done";
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
  labels: string[];
  created_at: string;
}

interface RiskItem {
  id: string;
  project_id: string;
  project_title?: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  mitigation_plan: string;
  status: "open" | "monitoring" | "mitigated" | "closed";
  created_at: string;
}

interface ProjectBrief {
  id: string;
  title: string;
  client_name?: string;
  status: string;
}

interface EmployeeBrief {
  id: string;
  full_name: string;
  designation: string;
  wing: string;
}

export default function EnterpriseProjectPanel({
  onNotify,
}: {
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<"kanban" | "risks">("kanban");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<ProjectBrief[]>([]);
  const [employees, setEmployees] = useState<EmployeeBrief[]>([]);
  const [loading, setLoading] = useState(true);

  // New task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    project_id: string;
    assignee_id: string;
    priority: TaskItem["priority"];
    estimated_hours: number;
    due_date: string;
  }>({
    title: "",
    description: "",
    project_id: "",
    assignee_id: "",
    priority: "medium",
    estimated_hours: 4,
    due_date: "",
  });

  // New risk modal
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [newRisk, setNewRisk] = useState<{
    project_id: string;
    title: string;
    severity: RiskItem["severity"];
    probability: RiskItem["probability"];
    mitigation_plan: string;
  }>({
    project_id: "",
    title: "",
    severity: "high",
    probability: "medium",
    mitigation_plan: "",
  });

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/tasks");
      if (!res.ok) throw new Error("Failed to load project operations");
      const d = await res.json();
      setTasks(d.tasks || []);
      setRisks(d.risks || []);
      setProjects(d.projects || []);
      setEmployees(d.employees || []);
    } catch (e) {
      console.error(e);
      onNotify("err", "Could not load Project OS data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveTask = async (taskId: string, nextStatus: TaskItem["status"]) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
      onNotify("ok", `Task transitioned to ${nextStatus.replace("_", " ")}`);
    } catch {
      onNotify("err", "Failed to update task status.");
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to create task");
      setShowTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        project_id: "",
        assignee_id: "",
        priority: "medium",
        estimated_hours: 4,
        due_date: "",
      });
      onNotify("ok", "Enterprise task scheduled in sprint backlog.");
      loadData();
    } catch {
      onNotify("err", "Failed to create task.");
    }
  };

  const createRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRisk.project_id || !newRisk.title) return;
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRisk, type: "risk" }),
      });
      if (!res.ok) throw new Error("Failed to register risk");
      setShowRiskModal(false);
      setNewRisk({
        project_id: "",
        title: "",
        severity: "high",
        probability: "medium",
        mitigation_plan: "",
      });
      onNotify("ok", "Project risk registered in governance ledger.");
      loadData();
    } catch {
      onNotify("err", "Failed to register risk.");
    }
  };

  const updateRiskStatus = async (riskId: string, status: RiskItem["status"]) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: riskId, type: "risk", status }),
      });
      if (!res.ok) throw new Error("Failed to update risk");
      setRisks((prev) =>
        prev.map((r) => (r.id === riskId ? { ...r, status } : r))
      );
      onNotify("ok", `Risk status marked as ${status}`);
    } catch {
      onNotify("err", "Failed to update risk.");
    }
  };

  const columns: Array<{ id: TaskItem["status"]; title: string; color: string }> = [
    { id: "todo", title: "Backlog / To-Do", color: "border-slate-700/60" },
    { id: "in_progress", title: "In Progress", color: "border-blue-500/40" },
    { id: "review", title: "Code & QA Review", color: "border-purple-500/40" },
    { id: "done", title: "Delivered & Verified", color: "border-emerald-500/40" },
  ];

  const totalEstimated = tasks.reduce((acc, t) => acc + Number(t.estimated_hours || 0), 0);
  const totalActual = tasks.reduce((acc, t) => acc + Number(t.actual_hours || 0), 0);
  const openRisks = risks.filter((r) => r.status === "open" || r.status === "monitoring").length;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="cl-kpi-grid">
        <div className="cl-kpi dark-kpi">
          <div className="cl-kpi-top">
            <span>ACTIVE SPRINTS & TASKS</span>
            <FolderKanban size={15} />
          </div>
          <div className="cl-kpi-val">{tasks.length}</div>
          <div className="cl-kpi-sub">{tasks.filter((t) => t.status === "done").length} completed</div>
        </div>

        <div className="cl-kpi">
          <div className="cl-kpi-top">
            <span>ESTIMATED VS ACTUAL EFFORT</span>
            <Clock size={15} />
          </div>
          <div className="cl-kpi-val">{totalEstimated}h / {totalActual}h</div>
          <div className="cl-kpi-sub">
            {totalEstimated > 0
              ? `${Math.round((totalActual / totalEstimated) * 100)}% burn rate`
              : "0% burn rate"}
          </div>
        </div>

        <div className="cl-kpi">
          <div className="cl-kpi-top">
            <span>ACTIVE RISK REGISTER</span>
            <AlertTriangle size={15} className="text-amber-400" />
          </div>
          <div className="cl-kpi-val text-amber-400">{openRisks}</div>
          <div className="cl-kpi-sub">{risks.length} total monitored risks</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("kanban")}
            className={`cl-btn sm ${subTab === "kanban" ? "primary" : "outline"}`}
          >
            <FolderKanban size={14} /> Sprint Kanban Board
          </button>
          <button
            type="button"
            onClick={() => setSubTab("risks")}
            className={`cl-btn sm ${subTab === "risks" ? "primary" : "outline"}`}
          >
            <ShieldAlert size={14} /> Risk & Mitigation Register
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === "kanban" ? (
            <button
              type="button"
              className="cl-btn primary sm"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={14} /> New Sprint Task
            </button>
          ) : (
            <button
              type="button"
              className="cl-btn primary sm"
              onClick={() => setShowRiskModal(true)}
            >
              <Plus size={14} /> Register Risk
            </button>
          )}
        </div>
      </div>

      {/* Subtab 1: Sprint Kanban Board */}
      {subTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#0b0f17]/80 border border-white/10 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {col.title}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 text-xs italic">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#121824] border border-white/5 hover:border-cyan-500/30 transition-all rounded-lg p-3 space-y-2 group shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                              task.priority === "urgent"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : task.priority === "high"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : task.priority === "medium"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.project_title && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {task.project_title}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-medium text-slate-200 line-clamp-2">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-500" />
                            {task.estimated_hours}h est
                          </span>
                          {task.assignee_name && (
                            <span className="flex items-center gap-1 font-medium text-cyan-400">
                              <User size={11} />
                              {task.assignee_name.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        {/* Status transition quick pills */}
                        <div className="flex items-center gap-1 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {col.id !== "todo" && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevStatus =
                                  col.id === "done"
                                    ? "review"
                                    : col.id === "review"
                                    ? "in_progress"
                                    : "todo";
                                moveTask(task.id, prevStatus);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400"
                            >
                              ← Back
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus =
                                  col.id === "todo"
                                    ? "in_progress"
                                    : col.id === "in_progress"
                                    ? "review"
                                    : "done";
                                moveTask(task.id, nextStatus);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 ml-auto"
                            >
                              Next <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 2: Risk Register */}
      {subTab === "risks" && (
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <h3 className="cl-card-title flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                Project Risk & Architectural Vulnerability Register
              </h3>
              <p className="cl-card-desc">
                Continuous risk matrix tracking across client deliverables, engineering deadlines, and compliance.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="cl-table w-full">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Risk Description</th>
                  <th>Severity</th>
                  <th>Probability</th>
                  <th>Mitigation Strategy</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {risks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                      No project risks currently open. Everything operating smoothly.
                    </td>
                  </tr>
                ) : (
                  risks.map((risk) => (
                    <tr key={risk.id}>
                      <td className="font-semibold text-slate-200">
                        {risk.project_title || "General Architecture"}
                      </td>
                      <td className="max-w-[260px] text-slate-300 font-medium">
                        {risk.title}
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${
                            risk.severity === "critical"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : risk.severity === "high"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {risk.severity}
                        </span>
                      </td>
                      <td className="text-xs uppercase text-slate-400">
                        {risk.probability}
                      </td>
                      <td className="max-w-[300px] text-xs text-slate-400">
                        {risk.mitigation_plan || "Pending strategy formulation"}
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            risk.status === "mitigated" || risk.status === "closed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {risk.status}
                        </span>
                      </td>
                      <td>
                        {risk.status !== "mitigated" && (
                          <button
                            type="button"
                            onClick={() => updateRiskStatus(risk.id, "mitigated")}
                            className="cl-btn sm outline text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            Mark Mitigated
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Sprint Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-cyan-400" /> New Sprint Task
            </h3>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Transformer encoder layer in Bangla ASR"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="cl-input w-full"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Acceptance Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Include technical specs, PR links, and DoD..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="cl-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Project</label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="cl-input w-full"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Assignee</label>
                  <select
                    value={newTask.assignee_id}
                    onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                    className="cl-input w-full"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as TaskItem["priority"],
                      })
                    }
                    className="cl-input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newTask.estimated_hours}
                    onChange={(e) =>
                      setNewTask({ ...newTask, estimated_hours: Number(e.target.value) })
                    }
                    className="cl-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="cl-btn outline sm"
                >
                  Cancel
                </button>
                <button type="submit" className="cl-btn primary sm">
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Risk */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f17] border border-amber-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-400" /> Register Architectural Risk
            </h3>
            <form onSubmit={createRisk} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Project *</label>
                <select
                  required
                  value={newRisk.project_id}
                  onChange={(e) => setNewRisk({ ...newRisk, project_id: e.target.value })}
                  className="cl-input w-full"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Risk Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model inference latency spike under concurrent requests"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  className="cl-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Severity</label>
                  <select
                    value={newRisk.severity}
                    onChange={(e) =>
                      setNewRisk({ ...newRisk, severity: e.target.value as RiskItem["severity"] })
                    }
                    className="cl-input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Probability</label>
                  <select
                    value={newRisk.probability}
                    onChange={(e) =>
                      setNewRisk({
                        ...newRisk,
                        probability: e.target.value as RiskItem["probability"],
                      })
                    }
                    className="cl-input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Mitigation Plan</label>
                <textarea
                  rows={3}
                  placeholder="Describe proactive caching, fallback microservices, or redundancy..."
                  value={newRisk.mitigation_plan}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigation_plan: e.target.value })}
                  className="cl-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRiskModal(false)}
                  className="cl-btn outline sm"
                >
                  Cancel
                </button>
                <button type="submit" className="cl-btn primary sm">
                  Register Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
