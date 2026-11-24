# CholokLabs Company OS

A unified, modern enterprise platform and interactive studio portal for **CholokLabs** — built with Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, Motion, and PostgreSQL (Neon).

---

## 🌟 Overview

CholokLabs Company OS combines the high-fidelity public product studio with four dedicated internal and client operating workspaces:

1. **Public Studio & Product Showcase** (`/`):
   - Dynamic Hero, Statement, and Catalog (Products, Services, Industries, Projects/Work, Principles, and Execution Steps).
   - Interactive Project Inquiry System with real-time feedback and direct engineering queueing.
   - High-performance UI powered by `@base-ui/react`, Framer Motion, Lenis smooth scrolling, GSAP, and Tailwind CSS.

2. **Admin OS & CMS Console** (`/dashboard/admin`):
   - Comprehensive operational overview and real-time studio KPIs.
   - Live visual CMS editor for homepage content, products, services, case studies, and engineering principles.
   - User directory and role-based access management (`ADMIN`, `HR`, `EMPLOYEE`, `USER`).
   - Integration credentials manager with AES-256-GCM encryption (SMTP Email, Twilio/Vonage/Webhook SMS, Google OAuth 2.0).
   - Inbound client inquiries triage and direct engineer response dispatch.
   - Centralized system audit logs.

3. **HR Operations & People Management** (`/dashboard/hr`):
   - Headcount analytics, department filtering, and employee directory.
   - Leave request management with approval workflows, review notes, and balance deductions.
   - Attendance monitoring and daily clock-in/out logs.
   - Monthly payroll processing and compensation tracking.
   - Company announcements with pinned priority and targeted audience distribution.
   - Team task delegation and tracking.

4. **Employee Workspace** (`/dashboard/employee`):
   - Single-click daily check-in / check-out with remote and on-site status notes.
   - Active task Kanban and status management (`todo`, `in_progress`, `review`, `done`).
   - Leave application submission with live annual/sick leave balance counters.
   - Personal payslips and compensation review.
   - Company broadcast board and profile management.

5. **Client Portal** (`/dashboard/user`):
   - Track submitted project scopes and review engineer replies.
   - Direct project inquiry dispatch with domain targeting.
   - Product exploration and early-access requests.

---

## 🚀 Quick Start

### 1. Requirements
- **Node.js**: v20+ (tested with v26)
- **pnpm**: v9+ (or corepack enabled)
- **PostgreSQL**: Neon or any standard PostgreSQL 15+ database

### 2. Environment Configuration
Create or edit `.env` in the root directory:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
APP_ENCRYPTION_KEY="64-character-hex-string-for-aes-256-gcm-secrets"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Installation & Run

```bash
# Install dependencies
pnpm install

# Type check
pnpm exec tsc --noEmit

# Production build
pnpm build

# Start production server
pnpm start

# Or start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Core Accounts

The platform automatically reconciles database migrations and provisions core leadership & HR accounts if not yet present (idempotent; never overwrites updated passwords):

| Role | Name | Email | Target Dashboard |
| :--- | :--- | :--- | :--- |
| **Founder (Admin)** | Ragib Hasan | `ragibhasan@choloklabs.tech` | `/dashboard/admin` |
| **Co-Founder (Admin)** | Rakibul Hasan | `rakibulhasan.swe@choloklabs.tech` | `/dashboard/admin` |
| **Head of HR** | Shariful Islam | `sharifulislam.hr@choloklabs.tech` | `/dashboard/hr` |

Initial passwords can be configured via `FOUNDER_INITIAL_PASSWORD`, `COFOUNDER_INITIAL_PASSWORD`, and `HR_INITIAL_PASSWORD` environment variables and changed anytime from the sidebar Account & Security modal.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Frontend**: React 19, TypeScript 5.7, Tailwind CSS v4, Lucide Icons, Shadcn UI
- **Animations**: Motion, GSAP 3, Lenis smooth scroll
- **Database**: PostgreSQL with `pg` connection pool and automatic schema reconciliation
- **Security**:
  - Secure HTTP-only cookies (`cl_session`)
  - Password hashing via Node.js native `scrypt` with random salt
  - Secrets encryption via `AES-256-GCM` with per-payload initialization vectors
- **Email & SMS Providers**: Nodemailer SMTP, Twilio API, Vonage API, and custom webhook relays
