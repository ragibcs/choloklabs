"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { motion } from "motion/react";

const OAUTH_ERRORS: Record<string, string> = {
  google_disabled: "Google sign-in is not enabled by the administrator yet.",
  oauth_state_invalid: "OAuth security check failed. Please try again.",
  google_token_failed: "Google authentication failed. Check Client ID & Secret in Admin Settings.",
  google_domain_restricted: "Your Google account domain is not permitted for this workspace.",
  google_signup_disabled: "New account creation via Google is disabled. Contact an administrator.",
  account_suspended: "Your account is currently suspended.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errKey = params.get("error");
    if (errKey && OAUTH_ERRORS[errKey]) {
      setError(OAUTH_ERRORS[errKey]);
    }
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(Boolean(d.googleEnabled)))
      .catch(() => {});
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo || "/dashboard");
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
            <i /> CHOLOKLABS COMPANY OS
          </span>
          <h1>
            One studio.
            <br />
            Every <em>layer.</em>
          </h1>
          <p style={{ color: "var(--mist)", maxWidth: 420, fontSize: 16 }}>
            Sign in to access the Admin Console, HR Operations, Employee Workspace, or Client Portal —
            backed by PostgreSQL.
          </p>
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "var(--mono)", fontSize: 11, color: "var(--mist-2)" }}>
          <span>01 / ADMIN CMS &amp; PROVIDERS</span>
          <span>02 / HR &amp; PAYROLL</span>
          <span>03 / EMPLOYEE OPS</span>
          <span>04 / CLIENT PORTAL</span>
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
            PORTAL AUTHENTICATION
          </div>
          <h2 style={{ fontSize: 28, letterSpacing: "-0.04em", fontWeight: 600, marginBottom: 6 }}>
            Sign in to CholokLabs
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22 }}>
            You will be routed automatically to your role workspace.
          </p>

          {error && (
            <div className="cl-alert err" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          {googleEnabled && (
            <>
              <a
                href="/api/auth/google"
                className="cl-btn outline"
                style={{ width: "100%", padding: "11px 16px", marginBottom: 16 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "var(--muted)", fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span className="mono">OR EMAIL</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="cl-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="cl-input"
                placeholder="name@choloklabs.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="cl-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
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
                  Signing in <Loader2 size={16} className="animate-spin" />
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--muted)" }}>New client?</span>
            <Link href="/register" style={{ fontWeight: 600, color: "var(--signal-deep)" }}>
              Create an account →
            </Link>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11.5,
              color: "var(--muted)",
            }}
          >
            <Lock size={12} />
            <span>Protected by encrypted HTTP-only sessions</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
