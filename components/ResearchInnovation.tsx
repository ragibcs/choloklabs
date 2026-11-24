"use client";

import Link from "next/link";
import { ArrowUpRight, AudioLines, Cpu, Database, BookOpen, Sparkles } from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";
import { BorderBeam } from "@/components/ui/border-beam";
import type { BlogPost } from "@/lib/blog";

const researchTracks = [
  {
    code: "R&D — 01",
    icon: AudioLines,
    badge: "ACTIVE CORPUS",
    title: "Bangla Audio Corpus & Speech AI",
    summary:
      "Collecting, curating, and annotating dialect-diverse Bengali speech datasets across real-world acoustic environments for high-accuracy ASR, TTS, and voice intelligence.",
    metrics: ["Multi-dialect Bengali", "Phonetic & ASR curation", "Clean & noisy acoustics"],
    accentFrom: "#5ef2c8",
    accentTo: "#38bdf8",
  },
  {
    code: "R&D — 02",
    icon: Database,
    badge: "DATA ENGINEERING",
    title: "Domain-Specific Dataset Collection",
    summary:
      "End-to-end dataset design, human-in-the-loop verification, and synthetic augmentation for Bengali OCR, examination analytics, and industrial vision inspection.",
    metrics: ["Bengali OCR & NLP", "Industrial vision QA", "Verified annotations"],
    accentFrom: "#38bdf8",
    accentTo: "#5ef2c8",
  },
  {
    code: "R&D — 03",
    icon: Cpu,
    badge: "HARDWARE CO-DESIGN",
    title: "Edge AI & Silicon Prototyping",
    summary:
      "Quantized neural inference on compact GPUs and microcontrollers alongside FPGA and RISC-V architecture research for sub-millisecond industrial control.",
    metrics: ["INT8 / TensorRT", "RISC-V & FPGA", "Low-power firmware"],
    accentFrom: "#5ef2c8",
    accentTo: "#0b785c",
  },
] as const;

export default function ResearchInnovation({ posts }: { posts: BlogPost[] }) {
  return (
    <section id="research" className="ri-section" aria-labelledby="research-title">
      <div className="wrap">
        <div className="eyebrow" style={{ color: "var(--signal)" }}>
          <i style={{ background: "var(--signal)" }} />
          RESEARCH &amp; INNOVATION LAB
        </div>
        <div className="section-head" style={{ marginTop: 12 }}>
          <h2 id="research-title" style={{ color: "var(--paper)" }} data-split>
            Datasets, Bangla AI &amp; deep R&amp;D<span>.</span>
          </h2>
          <p style={{ color: "var(--mist)", maxWidth: 420 }} data-reveal-up>
            Beyond shipping products, we invest in foundational datasets — from dialect-rich Bangla
            audio corpora to industrial vision and edge-silicon benchmarks.
          </p>
        </div>

        <div className="ri-grid">
          {researchTracks.map((track, idx) => {
            const Icon = track.icon;
            return (
              <SpotlightCard
                key={track.code}
                theme="dark"
                spotlightColor="#5ef2c8"
                intensity={0.18}
                borderGlow={0.85}
                spotlightSize={280}
                className="ri-card"
                style={{
                  ["--spotlight-card-surface" as string]: "#0c191d",
                  ["--spotlight-card-border" as string]: "rgba(94, 242, 200, 0.16)",
                }}
              >
                <BorderBeam
                  size={130}
                  duration={9 + idx * 2}
                  delay={idx * 2.5}
                  colorFrom={track.accentFrom}
                  colorTo={track.accentTo}
                  borderWidth={1.5}
                />
                <div className="ri-top">
                  <span className="mono ri-code">{track.code}</span>
                  <span className="ri-badge">
                    <Sparkles size={11} /> {track.badge}
                  </span>
                </div>
                <div className="ri-icon">
                  <Icon size={22} />
                </div>
                <h3>{track.title}</h3>
                <p>{track.summary}</p>
                <ul className="ri-tags">
                  {track.metrics.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })}
        </div>

        <div className="ri-banner">
          <div>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: "1.6px", color: "var(--signal)" }}>
              OPEN COLLABORATION · DATASETS &amp; RESEARCH
            </span>
            <h3 style={{ marginTop: 6 }}>
              Partner with CholokLabs on Bangla speech corpora or custom AI datasets
            </h3>
            <p>
              Universities, AI labs, and enterprise teams can commission custom dataset collection,
              annotation workflows, or joint research publications.
            </p>
          </div>
          <a href="#contact" className="btn mint" style={{ borderRadius: 999, flexShrink: 0 }}>
            Collaborate with R&amp;D <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="ri-journal">
          <div className="ri-journal-head">
            <div>
              <div className="eyebrow" style={{ color: "var(--signal)" }}>
                <i style={{ background: "var(--signal)" }} />
                ENGINEERING JOURNAL &amp; BLOG
              </div>
              <h3>Latest research notes &amp; engineering dispatches</h3>
            </div>
            <Link href="/blog" className="btn ghost small" style={{ borderRadius: 999 }}>
              <BookOpen size={15} /> View all posts <ArrowUpRight size={15} />
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="ri-blog-grid">
              {posts.slice(0, 3).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="ri-blog-link">
                  <SpotlightCard
                    theme="dark"
                    spotlightColor="#38bdf8"
                    intensity={0.14}
                    borderGlow={0.75}
                    className="ri-blog-card"
                    style={{
                      ["--spotlight-card-surface" as string]: "#0c191d",
                      ["--spotlight-card-border" as string]: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <div className="ri-top">
                      <span className="mono ri-code" style={{ color: "var(--signal)" }}>
                        {post.category.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--mist-2)" }}>
                        {post.read_time}
                      </span>
                    </div>
                    <h4>{post.title}</h4>
                    <p>{post.excerpt}</p>
                    <div className="ri-blog-foot">
                      <span>{post.author_name}</span>
                      <span className="ri-read-more">
                        Read dispatch <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ri-blog-empty">
              <p>
                Research dispatches and technical write-ups on Bangla audio datasets, AI systems,
                and embedded engineering are published directly from CholokLabs OS.
              </p>
              <Link href="/blog" className="ri-read-more">
                Open Journal <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
