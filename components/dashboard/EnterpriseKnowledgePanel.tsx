"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Plus,
  Shield,
  Tag,
  Calendar,
  User,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface KnowledgeDoc {
  id: string;
  slug: string;
  title: string;
  category: "engineering" | "architecture" | "research" | "sop" | "handbook";
  content: string;
  author_name: string;
  version: number;
  is_confidential: boolean;
  tags: string[];
  updated_at: string;
}

export default function EnterpriseKnowledgePanel({
  authorName,
  onNotify,
}: {
  authorName?: string;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // New doc modal
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState<{
    slug: string;
    title: string;
    category: KnowledgeDoc["category"];
    content: string;
    tagsText: string;
    is_confidential: boolean;
  }>({
    slug: "",
    title: "",
    category: "architecture",
    content: "",
    tagsText: "",
    is_confidential: false,
  });

  const loadDocs = async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      if (!res.ok) throw new Error("Failed to load documents");
      const d = await res.json();
      const loaded: KnowledgeDoc[] = d.documents || [];
      setDocs(loaded);
      if (loaded.length > 0 && !selectedDoc) {
        setSelectedDoc(loaded[0]);
      }
    } catch {
      onNotify("err", "Could not load knowledge wiki.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const saveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.slug || !newDoc.title || !newDoc.content) return;
    try {
      const tags = newDoc.tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newDoc.slug,
          title: newDoc.title,
          category: newDoc.category,
          content: newDoc.content,
          tags,
          is_confidential: newDoc.is_confidential,
        }),
      });
      if (!res.ok) throw new Error("Failed to save document");
      setShowModal(false);
      setNewDoc({
        slug: "",
        title: "",
        category: "architecture",
        content: "",
        tagsText: "",
        is_confidential: false,
      });
      onNotify("ok", "Document committed to Knowledge Wiki.");
      loadDocs();
    } catch {
      onNotify("err", "Failed to save document.");
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesCat = categoryFilter === "all" || d.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="cl-kpi-grid">
        <div className="cl-kpi dark-kpi">
          <div className="cl-kpi-top">
            <span>TOTAL ARCHIVED DOCUMENTS</span>
            <BookOpen size={15} />
          </div>
          <div className="cl-kpi-val">{docs.length}</div>
          <div className="cl-kpi-sub">
            {docs.filter((d) => d.category === "architecture").length} ADRs,{" "}
            {docs.filter((d) => d.category === "sop").length} SOPs
          </div>
        </div>

        <div className="cl-kpi">
          <div className="cl-kpi-top">
            <span>CONFIDENTIAL ASSETS</span>
            <Shield size={15} className="text-amber-400" />
          </div>
          <div className="cl-kpi-val text-amber-400">
            {docs.filter((d) => d.is_confidential).length}
          </div>
          <div className="cl-kpi-sub">Encrypted internal policies</div>
        </div>

        <div className="cl-kpi">
          <div className="cl-kpi-top">
            <span>GOVERNANCE & STANDARDS</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <div className="cl-kpi-val text-emerald-400">v{Math.max(...docs.map((d) => d.version), 1)}.0</div>
          <div className="cl-kpi-sub">ISO/IEC standard compliance</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "architecture", "engineering", "research", "sop", "handbook"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold border transition-all ${
                categoryFilter === cat
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search wiki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cl-input pl-8 py-1 text-xs w-48"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="cl-btn primary sm"
          >
            <Plus size={14} /> New Document / ADR
          </button>
        </div>
      </div>

      {/* Main Grid: Document List on Left, Viewer on Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Document List */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="cl-card text-center py-12 text-slate-500 text-xs">
              No documents found matching criteria.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedDoc?.id === doc.id
                    ? "bg-[#141d2e] border-cyan-500/50 shadow-md"
                    : "bg-[#0b0f17]/90 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {doc.category}
                  </span>
                  {doc.is_confidential && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <Shield size={10} /> Confidential
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">{doc.title}</h4>
                <div className="text-[11px] font-mono text-slate-500 mb-2">{doc.slug}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <User size={11} className="text-slate-500" />
                    {doc.author_name}
                  </span>
                  <span>v{doc.version}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Document Viewer */}
        <div className="md:col-span-2">
          {selectedDoc ? (
            <div className="cl-card">
              <div className="cl-card-head border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {selectedDoc.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      /{selectedDoc.slug}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      Revision v{selectedDoc.version}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-500" /> Author: {selectedDoc.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" /> Updated:{" "}
                      {new Date(selectedDoc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 py-3 border-b border-white/5">
                  {selectedDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Markdown Content Reader */}
              <div className="pt-4 text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                {selectedDoc.content}
              </div>
            </div>
          ) : (
            <div className="cl-card text-center py-20 text-slate-500">
              Select a document to read
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Document */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-cyan-400" /> Commit Document / ADR to Wiki
            </h3>
            <form onSubmit={saveDoc} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Document Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="adr-002-webrtc-audio"
                    value={newDoc.slug}
                    onChange={(e) => setNewDoc({ ...newDoc, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="cl-input w-full font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newDoc.category}
                    onChange={(e) =>
                      setNewDoc({
                        ...newDoc,
                        category: e.target.value as KnowledgeDoc["category"],
                      })
                    }
                    className="cl-input w-full"
                  >
                    <option value="architecture">Architecture Decision Record (ADR)</option>
                    <option value="engineering">Engineering Specification</option>
                    <option value="research">R&D & Dataset Corpus Paper</option>
                    <option value="sop">Standard Operating Procedure (SOP)</option>
                    <option value="handbook">Company Handbook</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADR-002: Real-Time Audio Streaming Architecture"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="cl-input w-full"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Content (Markdown) *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="# Context&#10;&#10;Describe architectural decision or standard operating procedure..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  className="cl-input w-full font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="audio, webrtc, asr, architecture"
                    value={newDoc.tagsText}
                    onChange={(e) => setNewDoc({ ...newDoc, tagsText: e.target.value })}
                    className="cl-input w-full text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="confidential_chk"
                    checked={newDoc.is_confidential}
                    onChange={(e) => setNewDoc({ ...newDoc, is_confidential: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <label htmlFor="confidential_chk" className="text-xs text-slate-300 cursor-pointer">
                    Mark as Confidential Enterprise Asset
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cl-btn outline sm"
                >
                  Cancel
                </button>
                <button type="submit" className="cl-btn primary sm">
                  Publish to Wiki
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
