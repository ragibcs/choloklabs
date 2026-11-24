"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { inquiryInterests as defaultInterests } from "@/content/site";
import Magnet from "@/components/Magnet";
import SpotlightCard from "@/components/SpotlightCard";
import { BorderBeam } from "@/components/ui/border-beam";

type State = "idle" | "sending" | "sent" | "error";

const nextSteps = [
  ["Direct engineering review", "An engineer or researcher from the relevant layer reads every inquiry."],
  ["Focused discovery questions", "We reply with concise technical questions on your site, dataset, or hardware."],
  ["Scoped first milestone", "A concrete architecture and delivery plan before any build begins."],
] as const;

export function Contact({
  heading = "Tell us what you want to build",
  subheading = "Describe the problem, dataset collaboration, or product idea. We read every inquiry and reply with clear next steps.",
  interests,
}: {
  heading?: string;
  subheading?: string;
  interests?: string[];
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const interestList = interests && interests.length > 0 ? interests : [...defaultInterests];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Something went wrong.");
      }
      setReceiptId(body.id || "");
      form.reset();
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <section id="contact" className="ct-section" aria-labelledby="contact-title">
      <div className="wrap ct-layout">
        <div className="ct-intro">
          <div className="eyebrow"><i />START A PROJECT OR R&amp;D</div>
          <h2 id="contact-title" data-split>{heading}<span>.</span></h2>
          <p data-reveal-up>{subheading}</p>
          <ol className="ct-next" data-stagger>
            {nextSteps.map(([title, body], i) => (
              <li key={title}>
                <span className="mono ct-next-num">0{i + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <SpotlightCard
          theme="dark"
          spotlightColor="#5ef2c8"
          intensity={0.14}
          borderGlow={0.85}
          spotlightSize={360}
          className="ct-panel"
          style={{
            ["--spotlight-card-surface" as string]: "#0c181c",
            ["--spotlight-card-border" as string]: "rgba(94, 242, 200, 0.2)",
          }}
        >
          <BorderBeam
            size={180}
            duration={10}
            colorFrom="#5ef2c8"
            colorTo="#38bdf8"
            borderWidth={1.5}
          />
          {state === "sent" ? (
            <div role="status" className="ct-sent">
              <CheckCircle2 size={40} aria-hidden="true" />
              <h3>Inquiry received</h3>
              <p>
                Thank you for reaching out to CholokLabs. Our engineering team has queued your brief
                and will reply to your email shortly.
              </p>
              {receiptId && (
                <div className="mono" style={{ fontSize: 11, color: "var(--mist-2)", padding: "6px 10px", borderRadius: 8, background: "#ffffff0a", border: "1px solid #ffffff16" }}>
                  REF: {receiptId.slice(0, 8).toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => setState("idle")} className="ct-ghost">
                Send another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="ct-form" noValidate={false}>
              <div className="ct-form-head">
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: "1.6px", color: "var(--signal)" }}>
                  PROJECT &amp; RESEARCH BRIEF
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--mist-2)" }}>
                  AVG REPLY &lt; 24H
                </span>
              </div>

              <div className="ct-row">
                <div className="ct-field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    className="ct-input"
                  />
                </div>
                <div className="ct-field">
                  <label htmlFor="email">Work Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="ct-input"
                  />
                </div>
              </div>

              <div className="ct-row">
                <div className="ct-field">
                  <label htmlFor="company">
                    Organization <span className="ct-opt">(optional)</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    autoComplete="organization"
                    placeholder="Company, lab, or university"
                    className="ct-input"
                  />
                </div>
                <div className="ct-field">
                  <label htmlFor="interest">Topic / Layer</label>
                  <div className="ct-select">
                    <select id="interest" name="interest" required defaultValue="" className="ct-input">
                      <option value="" disabled>Select an area...</option>
                      {interestList.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="ct-field">
                <label htmlFor="message">Project or Dataset Details</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Describe your product idea, Bangla audio/dataset requirement, or hardware/software stack..."
                  className="ct-input ct-textarea"
                />
              </div>

              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor="website">
                  Website
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              {state === "error" && (
                <p role="alert" className="ct-error">{error}</p>
              )}

              <div className="ct-actions">
                <Magnet padding={40} magnetStrength={4} wrapperClassName="ct-magnet">
                  <button type="submit" disabled={state === "sending"} className="ct-submit">
                    {state === "sending" ? (
                      <>Sending <Loader2 size={16} className="animate-spin" aria-hidden="true" /></>
                    ) : (
                      <>Send inquiry <ArrowRight size={16} aria-hidden="true" /></>
                    )}
                  </button>
                </Magnet>
                <span className="ct-note">
                  <ShieldCheck size={14} style={{ display: "inline", marginRight: 5, color: "var(--signal)" }} />
                  Private &amp; NDA-ready. Never shared with third parties.
                </span>
              </div>
            </form>
          )}
        </SpotlightCard>
      </div>
    </section>
  );
}
