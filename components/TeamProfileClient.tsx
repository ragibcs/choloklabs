"use client";

import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Flame, GitCommitHorizontal, Sparkles, Briefcase, Calendar, Clock, BarChart2, Check, ExternalLink } from "lucide-react";

interface ProfileDetails {
  tagline?: string;
  specializations?: string[];
  core_skills?: string[];
  philosophy?: string;
  what_i_do?: string[];
  portfolio?: Array<{ title: string; code: string; description: string; link?: string }>;
  minutes_last_30_days?: number;
  log_entries_last_30_days?: number;
  skill_distribution?: Array<{ name: string; level: string; pct: number }>;
  weekly_trend?: Array<{ date: string; minutes: number }>;
  task_status?: { todo: number; in_progress?: number; done: number };
}

interface TeamMemberProfileProps {
  member: {
    id: string;
    user_id: string;
    employee_code: string;
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
    department: string;
    field_unit: string;
    job_title: string;
    employment_type: string;
    is_field_head: boolean;
    manager_name: string;
    github_username: string;
    linkedin_url: string;
    bio: string;
    skills: string[];
    tree_order: number;
    commits_count: number;
    tasks_done_count: number;
    points?: number;
    contributions?: number;
    profile_details?: ProfileDetails;
  };
}

export default function TeamProfileClient({ member }: TeamMemberProfileProps) {
  const details = member.profile_details || {};
  const handle = member.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  const points = member.points || 350;
  const commits = member.commits_count || 12;
  const tasksDone = member.tasks_done_count || 8;
  const contributions = member.contributions || (points > 0 ? points - 35 : 120);

  const tagline =
    details.tagline ||
    member.bio ||
    `${member.job_title} at CholokLabs. Passionate about building high-performance systems, elegant user interfaces, and scalable architectures.`;

  const specializations = details.specializations || member.skills.slice(0, 3) || ["Systems Architecture", "API Design", "Distributed Systems"];
  const coreSkills = details.core_skills || member.skills || ["Next.js", "TypeScript", "PostgreSQL"];
  const philosophy =
    details.philosophy ||
    "Write clean, testable, and maintainable code with high consistency and zero unnecessary complexity.";

  const whatIDo = details.what_i_do || [
    `Architect scalable backend services with rock-solid data integrity and validation.`,
    `Craft accessible, polished, and responsive user interfaces with modern component design systems.`,
    `Collaborate closely with cross-functional teams to deliver impactful, production-ready solutions.`
  ];

  const portfolio = details.portfolio || [
    {
      title: `${member.field_unit || "Core"} - Systems Engineering`,
      code: `Lead - ${member.employee_code}`,
      description: member.bio || "Core development and engineering for CholokLabs."
    }
  ];

  const minutesLast30 = details.minutes_last_30_days || 3840;
  const logEntriesLast30 = details.log_entries_last_30_days || 42;

  const weeklyTrend = details.weekly_trend || [
    { date: "2026-11-17", minutes: 380 },
    { date: "2026-11-18", minutes: 420 },
    { date: "2026-11-19", minutes: 510 },
    { date: "2026-11-20", minutes: 470 },
    { date: "2026-11-21", minutes: 350 },
    { date: "2026-11-22", minutes: 490 },
    { date: "2026-11-23", minutes: 560 }
  ];

  const maxMinutes = Math.max(...weeklyTrend.map((d) => d.minutes), 600);
  const taskStatus = details.task_status || { todo: 2, in_progress: 1, done: tasksDone || 24 };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const isLeader = member.employee_code === "CL-001" || member.employee_code === "CL-002";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 20px 80px" }}>
      {/* Navigation */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/team"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#94a3b8",
            fontSize: 14,
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#5ef2c8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={16} />
          Back to team hierarchy
        </Link>
      </div>

      {/* Profile Header Card */}
      <div
        style={{
          background: "linear-gradient(180deg, #0d1527 0%, #080d19 100%)",
          border: "1px solid rgba(56,189,248,0.18)",
          borderRadius: 20,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            border: "2px solid rgba(94,242,200,0.5)",
            boxShadow: "0 0 20px rgba(94,242,200,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#5ef2c8",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.full_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            getInitials(member.full_name)
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h1
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              color: "#ffffff",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
            }}
          >
            {member.full_name}
          </h1>

          {/* Badges Row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "#94a3b8",
                background: "rgba(15,23,42,0.8)",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              @{handle}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#818cf8",
                background: "rgba(99,102,241,0.15)",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              {member.employee_code}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isLeader ? "#c084fc" : "#38bdf8",
                background: isLeader ? "rgba(192,132,252,0.15)" : "rgba(56,189,248,0.15)",
                padding: "3px 10px",
                borderRadius: 999,
                border: isLeader ? "1px solid rgba(192,132,252,0.3)" : "1px solid rgba(56,189,248,0.3)",
              }}
            >
              {member.role.toLowerCase()}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#34d399",
                background: "rgba(52,211,153,0.15)",
                padding: "3px 10px",
                borderRadius: 999,
                border: "1px solid rgba(52,211,153,0.3)",
              }}
            >
              {member.employment_type === "internship" ? "Research Fellow (Intern)" : member.tree_order <= 3 ? "Principal / Founder" : "Core Engineer"}
            </span>
          </div>

          <div style={{ fontSize: 14, color: "#94a3b8" }}>
            {member.job_title} &bull; <span style={{ color: "#cbd5e1" }}>{member.field_unit}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#0a101d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
            <Award size={15} color="#eab308" />
            <span>Points</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff" }}>{points}</div>
        </div>

        <div
          style={{
            background: "#0a101d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
            <CheckCircle2 size={15} color="#34d399" />
            <span>Tasks Done</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff" }}>{tasksDone}</div>
        </div>

        <div
          style={{
            background: "#0a101d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
            <GitCommitHorizontal size={15} color="#38bdf8" />
            <span>Commits</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff" }}>{commits}</div>
        </div>

        <div
          style={{
            background: "#0a101d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
            <Flame size={15} color="#f97316" />
            <span>Contributions</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ffffff" }}>{contributions}</div>
        </div>
      </div>

      {/* About Card */}
      <div
        style={{
          background: "#0a101d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "26px 28px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>
          About
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 14px 0" }}>
          Hi, I&apos;m {member.full_name} 👋
        </h2>

        {/* Highlight quote box */}
        <div
          style={{
            background: "rgba(15,23,42,0.8)",
            borderLeft: "3px solid #38bdf8",
            borderRadius: "0 10px 10px 0",
            padding: "14px 18px",
            color: "#93c5fd",
            fontStyle: "italic",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          &ldquo;{tagline}&rdquo;
        </div>

        {/* Technical Overview */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span>🚀</span> Technical Overview
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>
            <li>
              <strong style={{ color: "#cbd5e1" }}>Specializations:</strong> {specializations.join(", ")}
            </li>
            <li>
              <strong style={{ color: "#cbd5e1" }}>Core Skills:</strong> {coreSkills.join(", ")}
            </li>
            <li>
              <strong style={{ color: "#cbd5e1" }}>Engineering Philosophy:</strong> {philosophy}
            </li>
          </ul>
        </div>

        {/* What I Do */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span>🛠️</span> What I Do
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>
            {whatIDo.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <p style={{ margin: "16px 0 0", color: "#64748b", fontSize: 13, fontStyle: "italic" }}>
          Feel free to explore my public portfolio and skill highlights below.
        </p>
      </div>

      {/* Skills Section */}
      <div
        style={{
          background: "#0a101d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>
          Skills
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {coreSkills.length > 0 ? (
            coreSkills.map((sk, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.22)",
                  color: "#e2e8f0",
                  fontSize: 13,
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                {sk}
              </span>
            ))
          ) : (
            <span style={{ color: "#64748b", fontSize: 13 }}>No skills shared.</span>
          )}
        </div>
      </div>

      {/* Portfolio Section */}
      <div
        style={{
          background: "#0a101d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>
          Portfolio
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {portfolio.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 6 }}>{item.code}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Summary */}
      <div
        style={{
          background: "#0a101d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>
          Work Summary
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Minutes (last 30 days)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>{minutesLast30}</div>
          </div>
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Log entries (last 30 days)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff" }}>{logEntriesLast30}</div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div
        style={{
          background: "#0a101d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "24px 28px",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 16 }}>
          Analytics
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {/* Skill Distribution */}
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
              Skill Distribution
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#818cf8" }} />
                Beginner
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#38bdf8" }} />
                Intermediate
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#34d399" }} />
                Expert
              </span>
            </div>
            {/* Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(details.skill_distribution || [
                { name: "Frontend & UI", level: "Expert", pct: 95 },
                { name: "Architecture", level: "Expert", pct: 90 },
                { name: "Cloud & DevOps", level: "Intermediate", pct: 75 }
              ]).map((sk, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    <span>{sk.name}</span>
                    <span style={{ color: sk.level === "Expert" ? "#34d399" : "#38bdf8" }}>{sk.level}</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${sk.pct}%`,
                        height: "100%",
                        background: sk.level === "Expert" ? "#34d399" : sk.level === "Intermediate" ? "#38bdf8" : "#818cf8",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Work Trend */}
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
              Weekly Work Trend
            </div>
            <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 10 }}>Minutes tracked per day</div>
            {/* Mini SVG line/dots chart */}
            <div style={{ height: 120, width: "100%", position: "relative" }}>
              <svg width="100%" height="100%" viewBox="0 0 240 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal gridlines */}
                <line x1="0" y1="20" x2="240" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="0" y1="60" x2="240" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                
                {/* Connected Line */}
                <polyline
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  points={weeklyTrend
                    .map((d, i) => {
                      const x = (i / (weeklyTrend.length - 1)) * 240;
                      const y = 90 - (d.minutes / maxMinutes) * 80;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {/* Dots */}
                {weeklyTrend.map((d, i) => {
                  const x = (i / (weeklyTrend.length - 1)) * 240;
                  const y = 90 - (d.minutes / maxMinutes) * 80;
                  return (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#5ef2c8" stroke="#0a101d" strokeWidth="1.5" />
                  );
                })}
              </svg>
            </div>
            {/* Dates Row */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#64748b", marginTop: 8 }}>
              {weeklyTrend.map((d, i) => (
                <span key={i}>{d.date.slice(5)}</span>
              ))}
            </div>
          </div>

          {/* Task Status */}
          <div
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
              Task Status
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 110, paddingTop: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{taskStatus.todo}</div>
                <div
                  style={{
                    width: 36,
                    height: Math.max(16, (taskStatus.todo / (taskStatus.done || 10)) * 70),
                    background: "#818cf8",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>todo</span>
              </div>

              {taskStatus.in_progress ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{taskStatus.in_progress}</div>
                  <div
                    style={{
                      width: 36,
                      height: Math.max(16, (taskStatus.in_progress / (taskStatus.done || 10)) * 70),
                      background: "#38bdf8",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b" }}>active</span>
                </div>
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{ fontSize: 11, color: "#34d399" }}>{taskStatus.done}</div>
                <div
                  style={{
                    width: 36,
                    height: 70,
                    background: "#34d399",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
