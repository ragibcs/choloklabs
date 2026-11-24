# CholokLabs Enterprise OS — Comprehensive Feature Directory

This document provides a complete, structured overview of all the features, portals, dashboards, workflows, and backend engines available in the **CholokLabs Company OS** platform.

---

## 1. Public Web Portal & Core Experience

- **High-Craft Bioluminescent Obsidian Aesthetics**:
  - Dark-obsidian responsive design system with custom CSS tokens (`--ink`, `--signal`, `--mist`, `--paper`).
  - ReactBits-inspired micro-interactions: `SpotlightCard`, `BorderBeam`, and Framer Motion spring physics.
- **Hero & Core Product Showcases**:
  - **Porikkha**: Distributed assessment, automated proctoring, and on-device exam integrity platform.
  - **BOLoy**: Realtime secure edge operating environment for low-power microcontroller silicon.
- **Research & Innovation Lab Wing**:
  - **Bangla Audio Corpus**: 5,000+ hour multi-dialect phonetically balanced acoustic dataset tracker covering 8 divisions of Bangladesh.
  - **Edge Silicon Acceleration**: RISC-V and ARM Micro-NPU dynamic 4-bit/8-bit integer quantization benchmarks for sub-15ms on-device ASR inference.
  - Research dataset token access and university collaboration portals.
- **Interactive Team Hierarchy Tree (`/team`)**:
  - Organic hierarchical node graph inspired by DIU CSE-Tech (`csetech.diu.edu.bd/about`).
  - Orange/amber dotted bezier curves (`stroke="#f97316" strokeDasharray="4 4"`) connecting leadership nodes down to the central bioluminescent **`CHOLOK-LABS`** emblem.
  - Canvas pan, drag, zoom in/out (`+` / `-`), view reset (`⤢`), and live search highlight.
  - Bento Directory Switcher to toggle between the interactive canvas and responsive card grid.
- **Dedicated Member Profiles (`/team/[id]`)**:
  - Dedicated pages (e.g. `/team/CL-001`, `/team/CL-002`, `/team/CL-003`).
  - Dark obsidian header card with glowing circular avatar, `@handle`, employee ID, role badge, and seniority badge.
  - 4 Key Metrics: **Points**, **Tasks Done**, **Commits**, **Contributions**.
  - **About Section**: Professional bio, highlight quote callout, **🚀 Technical Overview** (Specializations, Core Skills, Philosophy), and **🛠️ What I Do** responsibilities.
  - **Portfolio & Projects**: Active projects with role codes.
  - **Work Summary**: 30-day minute tracking and log entry counters.
  - **Interactive Analytics**:
    - **Skill Distribution** (Beginner, Intermediate, Expert visual bars).
    - **Weekly Work Trend** (Continuous SVG line chart with hoverable daily points).
    - **Task Status** (Bar chart breakdown: `todo`, `active`, `done`).
- **Engineering Journal & Blog (`/blog` and `/blog/[slug]`)**:
  - Markdown-rendered technical papers and research updates.
  - Categorized tagging, read-time calculation, author metadata, and search filters.
- **Inquiry & Lead Capture Engine**:
  - Dark-obsidian contact form with ReactBits animated border-beam hover states.
  - Direct database persistence in `inquiries` table with status tracking and receipt badges.
- **SEO & Search Indexing**:
  - Dynamic OpenGraph cards, Twitter cards, custom SVG brand favicon.
  - Automated XML sitemap generator (`/sitemap.xml`) indexing `/`, `/team`, `/blog`, and all articles.

---

## 2. Authentication, RBAC & Security Infrastructure

- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Complete executive control over ERP, financials, team tree, CMS, and operations.
  - `HR`: People operations, recruitment, employee records, standups, and payroll.
  - `EMPLOYEE`: Engineer & researcher workspace, daily check-ins, tasks, and commits.
  - `USER` / `CUSTOMER`: Client portal, milestone tracking, tickets, and invoices.
- **Cryptographic Security**:
  - Password hashing via multi-round Bcrypt / HMAC-SHA256 with timing-attack prevention.
  - Stateless JSON Web Tokens (JWT) stored in HTTP-Only, SameSite, Secure cookies.
  - Role-based automatic redirects to `/dashboard/admin`, `/dashboard/hr`, `/dashboard/employee`, or `/dashboard/user`.
- **Account & Security Modal**:
  - Self-service password updates and profile changes accessible directly from the dashboard header.

---

## 3. Executive Admin OS (`/dashboard/admin`)

- **Command Center KPI Overview**:
  - Real-time revenue, active client projects, unpaid invoices, monthly payroll burn, and open support tickets.
- **Unified ERP Command Console (`components/dashboard/ErpCommandPanel.tsx`)**:
  - **Org Hierarchy Manager**: Add new hires, appoint Field Heads, assign parent managers, and toggle public `/team` visibility.
  - **GitHub Commits & Work Tracker**:
    - Manual GitHub REST sync by username and repository.
    - Webhook receiver (`/api/webhooks/github`) to automatically credit push commits to employee profiles.
  - **Field Head Task Distribution**: Dispatch targeted deliverables directly to `Software`, `Silicon`, `Research`, `Marketing`, or `HR`.
  - **Bangla Audio Dataset Engine**: Track audio hours collected, target hours, and dataset status.
  - **Product Marketing Campaigns**: Track marketing spend, active campaign dates, and target impressions/conversions.
  - **University Fellowship & Internship Cohorts**: Review student cohorts, assigned university mentors, stipends, and performance.
- **Operations & Client Project Management**:
  - Project milestone creation, progress tracking (0-100%), and status flags (`planning`, `active`, `completed`).
- **Financials & Invoicing Console**:
  - Client invoice generation with auto-calculated totals, currency formatting, and payment status updates (`pending`, `paid`, `overdue`).
- **Support Ticket Resolution Queue**:
  - Client ticket triaging, priority assignments (`low`, `medium`, `high`, `urgent`), and ticket closure.
- **Blog & Technical Journal Publisher**:
  - Create, edit, tag, and publish research papers with live markdown rendering.

---

## 4. HR & People Operations Portal (`/dashboard/hr`)

- **Employee Roster & Record Administration**:
  - Create and manage employee profiles, departments, salary bands, and emergency contacts.
- **Recruitment & Job Openings Pipeline**:
  - Post new technical job requisitions (`/api/hr/jobs`).
  - Track open positions, applicant counts, and hiring pipelines.
- **Daily Async Standup Monitor**:
  - View daily remote standups across the entire company (Yesterday's work, today's goals, blockers).
- **Time Off & Leave Approval Engine**:
  - Review submitted annual, sick, or casual leave requests.
  - Automatic balance deductions upon approval.
- **Payroll & Compensation Management**:
  - Generate and inspect monthly payroll runs, base salary calculations, and payment disbursements.
- **Company Announcements Engine**:
  - Broadcast operational announcements across employee dashboards.

---

## 5. Employee Engineering Portal (`/dashboard/employee`)

- **Daily Check-In & Time Tracker**:
  - One-click daily attendance logging with active work duration calculation.
- **Async Daily Standup Logging**:
  - Structured daily submission: *What did you accomplish yesterday?*, *What are your goals today?*, *Are there any blockers?*
- **Git Commits & Deliverables Log**:
  - Sync personal GitHub commits and map them against active sprint deliverables.
- **Personal Sprint Task Board**:
  - Manage assigned tasks across `todo`, `in_progress`, and `done` columns.
- **Time Off Requests**:
  - Submit leave requests and inspect remaining annual and sick leave balances.
- **Compensation & Payslip History**:
  - Review disbursed monthly pay records and tax summaries.

---

## 6. Client & Customer Workspace (`/dashboard/user`)

- **Project Timeline & Milestones**:
  - Real-time client view of contracted software/hardware milestones, completion percentages, and active status.
- **Billing & Invoices**:
  - View itemized invoices, due dates, paid receipts, and outstanding balances.
- **Technical Support Desk**:
  - Open new support tickets with subject, category, and urgency level.
  - Track resolution status and direct engineer responses.
- **Project Brief & RFP Submissions**:
  - Submit new feature requirements and project briefs directly to the executive team.

---

## 7. Complete API Route Architecture

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate with email/password; issues secure session cookie |
| `/api/auth/register` | `POST` | Self-service client/customer account registration |
| `/api/auth/me` | `GET`, `PATCH` | Retrieve or update active user profile and credentials |
| `/api/auth/logout` | `POST` | Clear session cookies |
| `/api/team` | `GET` | Public organizational tree and member profiles with metrics |
| `/api/blog` | `GET` | Public engineering blog posts and research articles |
| `/api/admin/blog` | `GET`, `POST`, `PATCH`, `DELETE` | Authenticated Admin blog publisher and editor |
| `/api/admin/erp` | `GET`, `POST`, `PATCH`, `DELETE` | Unified ERP console (Org tree, GitHub sync, datasets, marketing, interns) |
| `/api/admin/operations` | `GET`, `POST`, `PATCH` | Client milestones, invoices, and ticket administration |
| `/api/webhooks/github` | `POST` | GitHub push event receiver to map commit authors to employee profiles |
| `/api/hr/overview` | `GET` | Headcount, active leaves, standup counts, and payroll summary |
| `/api/hr/employees` | `GET`, `POST`, `PATCH` | Employee onboarding, profile edits, and terminations |
| `/api/hr/leaves` | `GET`, `PATCH` | Employee leave approvals and balance adjustments |
| `/api/hr/payroll` | `GET`, `POST` | Monthly payroll calculation and disbursement runs |
| `/api/hr/jobs` | `GET`, `POST`, `PATCH` | Job requisitions and applicant pipeline tracking |
| `/api/employee/workspace` | `GET`, `POST` | Employee check-in, async standup submission, and task updates |
| `/api/user/workspace` | `GET`, `POST` | Client milestone tracking, ticket submissions, and invoice reviews |
| `/api/inquiry` | `POST` | Public contact form inquiry submission |
| `/api/health` | `GET` | Database connectivity, uptime, and database row counts |

---

## 8. Verified Leadership Credentials

| Official Email | Role | Passcode |
| :--- | :--- | :--- |
| `ragibhasan@choloklabs.tech` | `ADMIN` (Founder & Principal Systems Architect) | `CholokFounder#2026` |
| `rakibulhasan.swe@choloklabs.tech` | `ADMIN` (Co-Founder & Lead Software Engineer) | `CholokCoFounder#2026` |
| `sharifulislam.hr@choloklabs.tech` | `HR` (Head of HR & People Operations) | `CholokHR#2026` |
