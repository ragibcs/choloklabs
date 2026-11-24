"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.googleEnabled)))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo || "/dashboard/user");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="cl-auth-wrap">
      <div className="cl-auth-left">
        <Link className="brand" href="/">
          <svg width="32" height="34" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
            <path d="M17 1 2 10v16l15 9 7-4-15-9v-8l15-9zm9 6-14 8v5l14 8 7-4-14-8 14-8-5-2z" />
          </svg>
          <span>
            Cholok<span className="brand-light">Labs</span>
          </span>
        </Link>
        <div>
          <span className="studio-badge">
            <i /> CLIENT &amp; PARTNER PORTAL
          </span>
          <h1>
            Build with
            <br />
            our <em>engineers.</em>
          </h1>
          <p style={{ color: "var(--mist)", maxWidth: 420, fontSize: 16 }}>
            Create your CholokLabs account to submit project specs, track engineering milestones, and
            access Porikkha &amp; BOLoy releases.
          </p>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--mist-2)" }}>
          CHOLOKLABS · FROM SOFTWARE TO SILICON
        </div>
      </div>

      <div className="cl-auth-right">
        <motion.div
          className="cl-auth-card"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eyebrow" style={{ color: "var(--signal-deep)", marginBottom: 10 }}>
            <i style={{ background: "var(--signal-deep)" }} />
            CREATE ACCOUNT
          </div>
          <h2 style={{ fontSize: 26, letterSpacing: "-0.04em", fontWeight: 600, marginBottom: 6 }}>
            Join CholokLabs Portal
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
            Get instant access to your client dashboard.
          </p>

          {error && (
            <div className="cl-alert err" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          {googleEnabled && (
            <>
              <a
                href="/api/auth/google"
                className="cl-btn outline"
                style={{ width: "100%", padding: "11px 16px", marginBottom: 14 }}
              >
                Continue with Google
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, color: "var(--muted)", fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span className="mono">OR EMAIL</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="cl-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                required
                className="cl-input"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="cl-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="phone">Phone (Optional)</label>
              <input
                id="phone"
                className="cl-input"
                placeholder="+880 1XXX-XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="password">Password (min. 8 characters)</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className="cl-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cl-btn primary"
              style={{ width: "100%", padding: "12px 18px", marginTop: 4 }}
            >
              {loading ? (
                <>
                  Creating account <Loader2 size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--muted)" }}>Already have an account?</span>
            <Link href="/login" style={{ fontWeight: 600, color: "var(--signal-deep)" }}>
              Sign in →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
