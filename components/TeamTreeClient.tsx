"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Network,
  ExternalLink,
  X,
  Code2,
  Globe,
  Sparkles,
  Award,
  GitCommitHorizontal,
  CheckCircle2,
  Flame,
  ArrowRight
} from "lucide-react";
import type { TeamMemberNode } from "@/app/api/team/route";

interface TeamTreeClientProps {
  members: TeamMemberNode[];
}

interface NodePosition {
  member: TeamMemberNode;
  x: number;
  y: number;
  roleBadge: string;
}

export default function TeamTreeClient({ members }: TeamTreeClientProps) {
  const [view, setView] = useState<"tree" | "grid">("tree");
  const [unitFilter, setUnitFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<TeamMemberNode | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(members.length <= 3 ? 1 : 0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const units = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.field_unit) set.add(m.field_unit);
    });
    return ["ALL", ...Array.from(set)];
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesUnit = unitFilter === "ALL" || m.field_unit === unitFilter;
      const matchesSearch =
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.job_title.toLowerCase().includes(search.toLowerCase()) ||
        m.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        (m.skills && m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())));
      return matchesUnit && matchesSearch;
    });
  }, [members, unitFilter, search]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Layout positions mirroring DIU CSE-Tech tree
  const { nodePositions, connections, emblemPos, canvasHeight } = useMemo(() => {
    const W = 1400;
    const centerX = W / 2;

    const byCode = new Map<string, TeamMemberNode>();
    members.forEach((m) => byCode.set(m.employee_code, m));

    // Fallbacks or mapped nodes
    const root = byCode.get("CL-001") || members[0];
    const sweHead = byCode.get("CL-002");
    const hrHead = byCode.get("CL-003");
    const siliconHead = byCode.get("CL-019");

    // Left Wing (Frontend & Mobile)
    const leftCodes = ["CL-004", "CL-005", "CL-006", "CL-007", "CL-008"];
    // Right Wing (Silicon, DSP & Speech AI)
    const rightCodes = ["CL-020", "CL-021", "CL-022", "CL-023", "CL-024"];
    // Center Column (Ops & Marketing)
    const centerCodes = ["CL-010", "CL-011", "CL-012"];
    // Under Emblem (Fellowship & Interns)
    const fellowLeadCode = "CL-013";
    const internCodes = ["CL-014", "CL-015", "CL-016", "CL-017", "CL-018"];

    const positions: NodePosition[] = [];
    const conns: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; color?: string }> = [];

    // Helper to get role badge
    const getBadge = (m: TeamMemberNode) => {
      if (m.employee_code === "CL-001") return "Founder";
      if (m.employee_code === "CL-002") return "Co-Founder";
      if (m.employee_code === "CL-003") return "Head of HR";
      if (m.employee_code === "CL-019") return "Silicon Architect";
      if (m.employee_code === "CL-013") return "Fellowship Lead";
      if (m.employment_type === "internship") return "Research Fellow";
      if (m.job_title.includes("Lead") || m.is_field_head) return "Lead";
      return "Executive";
    };

    // If we have just the 3 leadership nodes (Ragib, Rakibul, Shariful)
    if (members.length <= 3) {
      if (root) {
        positions.push({ member: root, x: centerX, y: 110, roleBadge: getBadge(root) });
      }

      if (sweHead) {
        positions.push({ member: sweHead, x: centerX - 220, y: 290, roleBadge: getBadge(sweHead) });
        conns.push({ from: { x: centerX, y: 165 }, to: { x: centerX - 220, y: 290 } });
      }

      if (hrHead) {
        positions.push({ member: hrHead, x: centerX + 220, y: 290, roleBadge: getBadge(hrHead) });
        conns.push({ from: { x: centerX, y: 165 }, to: { x: centerX + 220, y: 290 } });
      }

      const emblem = { x: centerX, y: 470 };
      if (sweHead) {
        conns.push({ from: { x: centerX - 220, y: 345 }, to: emblem });
      }
      if (hrHead) {
        conns.push({ from: { x: centerX + 220, y: 345 }, to: emblem });
      }

      return { nodePositions: positions, connections: conns, emblemPos: emblem, canvasHeight: 620 };
    }

    // Dynamic Multi-Node Tree (for 4+ employees)
    if (root) {
      positions.push({ member: root, x: centerX, y: 90, roleBadge: getBadge(root) });
    }

    if (sweHead) {
      positions.push({ member: sweHead, x: centerX - 260, y: 240, roleBadge: getBadge(sweHead) });
      conns.push({ from: { x: centerX, y: 150 }, to: { x: centerX - 260, y: 240 } });
    }

    if (hrHead) {
      positions.push({ member: hrHead, x: centerX, y: 350, roleBadge: getBadge(hrHead) });
      conns.push({ from: { x: centerX, y: 150 }, to: { x: centerX, y: 350 } });
    }

    if (siliconHead) {
      positions.push({ member: siliconHead, x: centerX + 260, y: 240, roleBadge: getBadge(siliconHead) });
      conns.push({ from: { x: centerX, y: 150 }, to: { x: centerX + 260, y: 240 } });
    }

    // Left Wing Nodes
    leftCodes.forEach((code, idx) => {
      const m = byCode.get(code);
      if (m) {
        const offsetX = idx % 2 === 0 ? -480 : -420;
        const posY = 380 + idx * 135;
        positions.push({ member: m, x: centerX + offsetX, y: posY, roleBadge: getBadge(m) });

        const parentPos = idx === 0 ? { x: centerX - 260, y: 240 } : { x: centerX + offsetX + 20, y: posY - 135 };
        conns.push({ from: parentPos, to: { x: centerX + offsetX, y: posY } });
      }
    });

    // Right Wing Nodes
    rightCodes.forEach((code, idx) => {
      const m = byCode.get(code);
      if (m) {
        const offsetX = idx % 2 === 0 ? 480 : 420;
        const posY = 380 + idx * 135;
        positions.push({ member: m, x: centerX + offsetX, y: posY, roleBadge: getBadge(m) });

        const parentPos = idx === 0 ? { x: centerX + 260, y: 240 } : { x: centerX + offsetX - 20, y: posY - 135 };
        conns.push({ from: parentPos, to: { x: centerX + offsetX, y: posY } });
      }
    });

    // Center Column Nodes
    centerCodes.forEach((code, idx) => {
      const m = byCode.get(code);
      if (m) {
        const posY = 490 + idx * 130;
        positions.push({ member: m, x: centerX, y: posY, roleBadge: getBadge(m) });
        conns.push({ from: { x: centerX, y: 350 + idx * 130 }, to: { x: centerX, y: posY } });
      }
    });

    const emblem = { x: centerX, y: 920 };
    conns.push({ from: { x: centerX, y: 880 }, to: emblem });

    const fellowLead = byCode.get(fellowLeadCode);
    const fellowPos = { x: centerX, y: 1060 };
    if (fellowLead) {
      positions.push({ member: fellowLead, x: fellowPos.x, y: fellowPos.y, roleBadge: getBadge(fellowLead) });
      conns.push({ from: emblem, to: fellowPos });
    }

    const totalInterns = internCodes.length;
    internCodes.forEach((code, idx) => {
      const m = byCode.get(code);
      if (m) {
        const spread = (idx - (totalInterns - 1) / 2) * 190;
        const arcY = 1220 + Math.abs(idx - (totalInterns - 1) / 2) * 25;
        const internPos = { x: centerX + spread, y: arcY };
        positions.push({ member: m, x: internPos.x, y: internPos.y, roleBadge: getBadge(m) });
        conns.push({ from: fellowPos, to: internPos });
      }
    });

    const assignedIds = new Set(positions.map((p) => p.member.id));
    members.forEach((m, i) => {
      if (!assignedIds.has(m.id)) {
        const extraPos = { x: 180 + (i % 5) * 220, y: 1400 + Math.floor(i / 5) * 140 };
        positions.push({ member: m, x: extraPos.x, y: extraPos.y, roleBadge: getBadge(m) });
        conns.push({ from: fellowPos, to: extraPos });
      }
    });

    return { nodePositions: positions, connections: conns, emblemPos: emblem, canvasHeight: 1500 };
  }, [members]);

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(members.length <= 3 ? 1 : 0.85);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 20px",
          background: "rgba(11,18,34,0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        {/* Left: View Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setView("tree")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: view === "tree" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
              color: view === "tree" ? "#ffffff" : "#94a3b8",
              border: view === "tree" ? "none" : "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Network size={15} />
            Hierarchy Tree
          </button>
          <button
            onClick={() => setView("grid")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: view === "grid" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
              color: view === "grid" ? "#ffffff" : "#94a3b8",
              border: view === "grid" ? "none" : "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LayoutGrid size={15} />
            Bento Directory
          </button>
        </div>

        {/* Center: Search */}
        <div style={{ position: "relative", minWidth: 260, flex: 1, maxWidth: 380 }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search member, skill, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: 10,
              fontSize: 13,
              background: "#070c17",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.1)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Zoom controls for Tree View */}
        {view === "tree" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              style={{
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: "#070c17",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              style={{
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: "#070c17",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={resetView}
              style={{
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: "#070c17",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
              title="Reset View"
            >
              <Maximize2 size={16} />
            </button>
            <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {view === "tree" ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: "relative",
            width: "100%",
            height: "78vh",
            minHeight: 700,
            background: "#020617",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            boxShadow: "inset 0 0 100px rgba(0,0,0,0.8)",
          }}
        >
          {/* Subtle grid background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(rgba(249,115,22,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px, 96px 96px",
              pointerEvents: "none",
            }}
          />

          {/* Interactive World Canvas */}
          <div
            style={{
              position: "absolute",
              width: 1400,
              height: canvasHeight,
              left: "50%",
              top: 40,
              transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${zoom})`,
              transformOrigin: "50% 0%",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* SVG Connector Lines */}
            <svg
              width="1400"
              height={canvasHeight}
              style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
            >
              <defs>
                <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f97316" floodOpacity="0.45" />
                </filter>
              </defs>

              {connections.map((c, i) => {
                const dy = c.to.y - c.from.y;
                const path = `M ${c.from.x} ${c.from.y} C ${c.from.x} ${c.from.y + dy * 0.5}, ${c.to.x} ${c.to.y - dy * 0.5}, ${c.to.x} ${c.to.y}`;
                return (
                  <path
                    key={i}
                    d={path}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    filter="url(#glow-orange)"
                    opacity="0.8"
                  />
                );
              })}
            </svg>

            {/* Central Brand Emblem (CHOLOK LABS) */}
            <div
              style={{
                position: "absolute",
                left: emblemPos.x,
                top: emblemPos.y,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #0b1527, #070d1a)",
                  border: "1.5px solid rgba(94,242,200,0.6)",
                  boxShadow: "0 0 25px rgba(94,242,200,0.3), inset 0 0 15px rgba(94,242,200,0.15)",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "linear-gradient(135deg, #5ef2c8, #059669)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    color: "#020617",
                    fontSize: 14,
                  }}
                >
                  C
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "0.08em", color: "#ffffff" }}>
                  CHOLOK-LABS
                </div>
              </div>
            </div>

            {/* Tree Nodes */}
            {nodePositions.map((pos) => {
              const { member, x, y, roleBadge } = pos;
              const isMatch =
                !search ||
                member.full_name.toLowerCase().includes(search.toLowerCase()) ||
                member.job_title.toLowerCase().includes(search.toLowerCase()) ||
                member.employee_code.toLowerCase().includes(search.toLowerCase());

              return (
                <div
                  key={member.id}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 20,
                    opacity: isMatch ? 1 : 0.25,
                    transition: "opacity 0.2s ease, transform 0.2s ease",
                  }}
                >
                  {/* Role Badge on Top */}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: roleBadge === "Founder" || roleBadge === "Co-Founder" ? "#fb923c" : "#38bdf8",
                      background:
                        roleBadge === "Founder" || roleBadge === "Co-Founder"
                          ? "rgba(251,146,60,0.15)"
                          : "rgba(56,189,248,0.15)",
                      border:
                        roleBadge === "Founder" || roleBadge === "Co-Founder"
                          ? "1px solid rgba(251,146,60,0.4)"
                          : "1px solid rgba(56,189,248,0.3)",
                      padding: "2px 8px",
                      borderRadius: 999,
                      marginBottom: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {roleBadge}
                  </div>

                  {/* Circular Avatar */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(member);
                    }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1e293b, #0f172a)",
                      border: "2px solid rgba(249,115,22,0.6)",
                      boxShadow: "0 0 16px rgba(249,115,22,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: 18,
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 0 24px rgba(249,115,22,0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 0 16px rgba(249,115,22,0.25)";
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

                  {/* Name */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginTop: 6,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.full_name}
                  </div>

                  {/* Role / Designation */}
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      textAlign: "center",
                      maxWidth: 130,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {member.job_title}
                  </div>

                  {/* Profile Link Button */}
                  <Link
                    href={`/team/${member.employee_code}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#f97316",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      marginTop: 3,
                      textDecoration: "none",
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "rgba(249,115,22,0.08)",
                      border: "1px solid rgba(249,115,22,0.2)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f97316";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(249,115,22,0.08)";
                      e.currentTarget.style.color = "#f97316";
                    }}
                  >
                    Profile ↗
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Bento Directory Grid View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              style={{
                background: "linear-gradient(180deg, #0b1222 0%, #070c17 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(94,242,200,0.4)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#1e293b",
                    border: "2px solid rgba(94,242,200,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#5ef2c8",
                    fontWeight: 700,
                    fontSize: 16,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitials(member.full_name)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{member.full_name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{member.job_title}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{member.employee_code}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                {member.bio || "CholokLabs Core Engineering Team"}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 11, color: "#34d399" }}>
                  {member.field_unit}
                </span>
                <Link
                  href={`/team/${member.employee_code}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5ef2c8",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    textDecoration: "none",
                  }}
                >
                  Profile <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Profile Modal */}
      {selectedMember && (
        <div
          onClick={() => setSelectedMember(null)}
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
              maxWidth: 520,
              background: "#0a101d",
              border: "1px solid rgba(56,189,248,0.25)",
              borderRadius: 20,
              padding: "26px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedMember(null)}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "#1e293b",
                  border: "2px solid #5ef2c8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#5ef2c8",
                  fontWeight: 800,
                  fontSize: 22,
                  overflow: "hidden",
                }}
              >
                {selectedMember.avatar_url ? (
                  <img src={selectedMember.avatar_url} alt={selectedMember.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(selectedMember.full_name)
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 4px" }}>
                  {selectedMember.full_name}
                </h3>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{selectedMember.job_title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 999 }}>
                    {selectedMember.employee_code}
                  </span>
                  <span style={{ fontSize: 11, color: "#34d399", background: "rgba(52,211,153,0.15)", padding: "2px 8px", borderRadius: 999 }}>
                    {selectedMember.field_unit}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 18 }}>
              {selectedMember.bio || "Core team member contributing to CholokLabs systems."}
            </p>

            {/* Quick Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "rgba(15,23,42,0.8)", padding: "10px", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>Points</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{selectedMember.points || 250}</div>
              </div>
              <div style={{ background: "rgba(15,23,42,0.8)", padding: "10px", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>Tasks Done</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{selectedMember.tasks_done_count || 12}</div>
              </div>
              <div style={{ background: "rgba(15,23,42,0.8)", padding: "10px", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>Commits</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{selectedMember.commits_count || 24}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link
                href={`/team/${selectedMember.employee_code}`}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Full Detailed Profile <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
