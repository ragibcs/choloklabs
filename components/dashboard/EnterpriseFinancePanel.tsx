"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck
} from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  description: string;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  narration: string;
  status: string;
  created_by_name: string;
  lines: Array<{
    id: string;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
}

interface ExpenseClaim {
  id: string;
  claim_number: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  employee_name: string;
  employee_code: string;
}

export default function EnterpriseFinancePanel({
  onNotify,
}: {
  onNotify?: (type: "ok" | "err", msg: string) => void;
} = {}) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "coa" | "journal" | "expenses">("overview");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  // New Journal Entry Modal State
  const [createModal, setCreateModal] = useState(false);
  const [narration, setNarration] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([
    { account_id: "", debit: 0, credit: 0 },
    { account_id: "", debit: 0, credit: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setEntries(data.entries || []);
        setExpenses(data.expenses || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const totalDebits = lines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
  const totalCredits = lines.reduce((acc, l) => acc + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setErrorMsg("Total debits must equal total credits.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          entry_date: entryDate,
          narration,
          lines,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create journal entry");
      setCreateModal(false);
      setNarration("");
      setLines([
        { account_id: "", debit: 0, credit: 0 },
        { account_id: "", debit: 0, credit: 0 },
      ]);
      fetchFinanceData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveExpense = async (id: string, status: "approved" | "rejected" | "reimbursed") => {
    try {
      await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_expense_status",
          id,
          status,
        }),
      });
      fetchFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 16px",
          background: "rgba(11,18,34,0.7)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {(["overview", "coa", "journal", "expenses"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: activeSubTab === tab ? "rgba(94,242,200,0.15)" : "transparent",
                color: activeSubTab === tab ? "#5ef2c8" : "#94a3b8",
                border: activeSubTab === tab ? "1px solid rgba(94,242,200,0.3)" : "1px solid transparent",
              }}
            >
              {tab === "overview" && "Executive Summary"}
              {tab === "coa" && "Chart of Accounts"}
              {tab === "journal" && "General Ledger"}
              {tab === "expenses" && "Expense Claims"}
            </button>
          ))}
        </div>

        {activeSubTab === "journal" && (
          <button
            onClick={() => setCreateModal(true)}
            className="cl-btn sm primary"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> New Journal Entry
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeSubTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} color="#34d399" /> Total Recognized Revenue
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                BDT {summary.totalRevenue.toLocaleString()}
              </div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingDown size={14} color="#f87171" /> Operating Expenses
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                BDT {summary.totalExpenses.toLocaleString()}
              </div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={14} color="#5ef2c8" /> Net Profit Margin
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: summary.netProfit >= 0 ? "#5ef2c8" : "#fca5a5" }}>
                BDT {summary.netProfit.toLocaleString()}
              </div>
            </div>

            <div style={{ background: "#090f1d", padding: "18px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} color="#818cf8" /> Total Assets (Bank & Inventory)
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                BDT {summary.totalAssets.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Ledger Snapshot */}
          <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 14px" }}>
              Recent General Ledger Postings
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Entry #</th>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Narration</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 5).map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                      <td style={{ padding: "10px 12px", color: "#818cf8", fontWeight: 600 }}>{e.entry_number}</td>
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{e.entry_date}</td>
                      <td style={{ padding: "10px 12px" }}>{e.narration}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "2px 8px", borderRadius: 4 }}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chart of Accounts Tab */}
      {activeSubTab === "coa" && (
        <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 14px" }}>
            Enterprise Chart of Accounts
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Code</th>
                  <th style={{ padding: "10px 12px" }}>Account Name</th>
                  <th style={{ padding: "10px 12px" }}>Classification</th>
                  <th style={{ padding: "10px 12px" }}>Balance</th>
                  <th style={{ padding: "10px 12px" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#818cf8" }}>{acc.code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{acc.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background:
                            acc.type === "ASSET" ? "rgba(56,189,248,0.15)" :
                            acc.type === "REVENUE" ? "rgba(52,211,153,0.15)" :
                            acc.type === "EXPENSE" ? "rgba(248,113,113,0.15)" : "rgba(168,85,247,0.15)",
                          color:
                            acc.type === "ASSET" ? "#38bdf8" :
                            acc.type === "REVENUE" ? "#34d399" :
                            acc.type === "EXPENSE" ? "#f87171" : "#c084fc",
                        }}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                      BDT {Number(acc.balance).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{acc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* General Ledger Tab */}
      {activeSubTab === "journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: "#090f1d",
                padding: "18px 20px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#818cf8", marginRight: 10 }}>
                    {entry.entry_number}
                  </span>
                  <span style={{ fontSize: 13, color: "#cbd5e1" }}>{entry.narration}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748b" }}>
                  <span>{entry.entry_date}</span>
                  <span>&bull;</span>
                  <span>By {entry.created_by_name}</span>
                </div>
              </div>

              {/* Entry Lines */}
              <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: 8, padding: "8px 12px" }}>
                {entry.lines.map((line) => (
                  <div
                    key={line.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      padding: "4px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>
                      [{line.account_code}] {line.account_name}
                    </span>
                    <span style={{ color: line.debit > 0 ? "#34d399" : "#38bdf8", fontWeight: 600 }}>
                      {line.debit > 0 ? `Debit: BDT ${Number(line.debit).toLocaleString()}` : `Credit: BDT ${Number(line.credit).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Claims Tab */}
      {activeSubTab === "expenses" && (
        <div style={{ background: "#090f1d", padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", margin: "0 0 14px" }}>
            Employee Expense Claims &amp; Reimbursements
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Claim #</th>
                  <th style={{ padding: "10px 12px" }}>Employee</th>
                  <th style={{ padding: "10px 12px" }}>Title &amp; Category</th>
                  <th style={{ padding: "10px 12px" }}>Amount</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "#64748b" }}>
                      No active expense claims recorded.
                    </td>
                  </tr>
                ) : (
                  expenses.map((ex) => (
                    <tr key={ex.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                      <td style={{ padding: "10px 12px", color: "#818cf8", fontWeight: 600 }}>{ex.claim_number}</td>
                      <td style={{ padding: "10px 12px" }}>{ex.employee_name} ({ex.employee_code})</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div>{ex.title}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{ex.category}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>BDT {Number(ex.amount).toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: ex.status === "approved" ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)",
                            color: ex.status === "approved" ? "#34d399" : "#fb923c",
                          }}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {ex.status === "submitted" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleApproveExpense(ex.id, "approved")}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#059669",
                                color: "#ffffff",
                                border: "none",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveExpense(ex.id, "rejected")}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          </div>
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

      {/* New Journal Entry Modal */}
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
              maxWidth: 580,
              background: "#080e1a",
              border: "1px solid rgba(94,242,200,0.3)",
              borderRadius: 18,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#ffffff" }}>New Balanced Journal Entry</h3>

            {errorMsg && (
              <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.15)", color: "#fca5a5", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateEntry} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="cl-label" style={{ fontSize: 12 }}>Entry Narration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Porikkha Enterprise Deployment Q1 Milestone Payment"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="cl-input"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              {/* Journal Lines */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Debits &amp; Credits</span>
                {lines.map((l, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      required
                      value={l.account_id}
                      onChange={(e) => {
                        const newL = [...lines];
                        newL[idx].account_id = e.target.value;
                        setLines(newL);
                      }}
                      className="cl-input"
                      style={{ flex: 2 }}
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Debit"
                      value={l.debit || ""}
                      onChange={(e) => {
                        const newL = [...lines];
                        newL[idx].debit = Number(e.target.value);
                        setLines(newL);
                      }}
                      className="cl-input"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      placeholder="Credit"
                      value={l.credit || ""}
                      onChange={(e) => {
                        const newL = [...lines];
                        newL[idx].credit = Number(e.target.value);
                        setLines(newL);
                      }}
                      className="cl-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>

              {/* Balance Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: isBalanced ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", borderRadius: 8, fontSize: 12 }}>
                <span>Total Debits: BDT {totalDebits.toLocaleString()}</span>
                <span>Total Credits: BDT {totalCredits.toLocaleString()}</span>
                <span style={{ color: isBalanced ? "#34d399" : "#f87171", fontWeight: 700 }}>
                  {isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="cl-btn sm outline"
                  style={{ background: "transparent", color: "var(--paper)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isBalanced}
                  className="cl-btn sm primary"
                >
                  {submitting ? "Posting..." : "Post to General Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
