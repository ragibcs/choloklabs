'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, LayoutDashboard, LogIn, Menu, X } from 'lucide-react'
import { nav } from '@/content/site'

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="CholokLabs home">
      <svg width="32" height="34" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
        <path d="M17 1 2 10v16l15 9 7-4-15-9v-8l15-9zm9 6-14 8v5l14 8 7-4-14-8 14-8-5-2z" />
      </svg>
      <span>
        Cholok<span className="brand-light">Labs</span>
      </span>
    </Link>
  )
}

export default function StudioHeader({
  dashboardHref = null,
  userRole = null,
}: {
  dashboardHref?: string | null
  userRole?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="cl-site-header">
      <div className="wrap bar">
        <Brand />
        <nav className={open ? 'nav open' : 'nav'} aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              href={n.href}
              onClick={() => setOpen(false)}
              key={n.label}
              className="nav-link"
            >
              {n.label}
            </Link>
          ))}
          {/* Mobile action buttons inside open drawer */}
          <div className="nav-mobile-actions">
            {dashboardHref ? (
              <Link
                className="btn small"
                href={dashboardHref}
                onClick={() => setOpen(false)}
                style={{
                  background: 'var(--signal)',
                  color: 'var(--ink)',
                  borderRadius: '100px',
                  gap: 7,
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <LayoutDashboard size={15} /> {userRole === 'ADMIN' ? 'Admin OS' : 'Dashboard'}
              </Link>
            ) : (
              <Link
                className="btn dark small"
                href="/login"
                onClick={() => setOpen(false)}
                style={{ gap: 7, justifyContent: 'center', width: '100%' }}
              >
                <LogIn size={15} /> Sign in
              </Link>
            )}
            <a
              className="btn small"
              href="/#contact"
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                gap: 7,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              Let&apos;s talk <ArrowUpRight size={16} />
            </a>
          </div>
        </nav>
        <div className="header-actions" style={{ gap: 10 }}>
          {dashboardHref ? (
            <Link
              className="btn small cl-btn-header"
              href={dashboardHref}
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--signal)',
                color: 'var(--ink)',
                borderRadius: '100px',
                gap: 7,
              }}
            >
              <LayoutDashboard size={15} /> {userRole === 'ADMIN' ? 'Admin OS' : 'Dashboard'}
            </Link>
          ) : (
            <Link
              className="btn dark small cl-btn-header"
              href="/login"
              onClick={() => setOpen(false)}
              style={{ gap: 7 }}
            >
              <LogIn size={15} /> Sign in
            </Link>
          )}
          <a className="btn dark small cl-btn-header-talk" href="/#contact" onClick={() => setOpen(false)}>
            Let&apos;s talk <ArrowUpRight size={16} />
          </a>
          <button
            className="menu"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
