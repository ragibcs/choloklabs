# CHOLOKLABS ENTERPRISE OS — PROPOSED ARCHITECTURE

## 1. Architectural Principles

1. **Modular Monolith**: Keep execution fast, unified, and type-safe in a single Next.js / TypeScript / PostgreSQL architecture. Avoid premature microservices overhead.
2. **Unified Application Shell**: A shared, role-aware enterprise shell across all portals (`Admin`, `HR`, `Employee`, `Client`) featuring:
   - Universal Command Palette (`Cmd + K`)
   - Real-time in-app notification center
   - Deep obsidian bioluminescent design tokens with zero visual regressions
3. **Double-Entry General Ledger**: All financial events (invoices, payments, expense reimbursements, payroll runs) must create balanced debit and credit journal entries.
4. **Interconnected Enterprise Graph**:
   `Company OKR` → `Department Goal` → `Project` → `Milestone` → `Task` → `GitHub Commit` → `Deliverable`.
5. **Zero Fake Metrics**: Dashboards display actual aggregated data or transparent empty states.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            PUBLIC & CLIENT ACCESS TIER                            |
|    - Public Portal (/)          - Blog (/blog)             - Org Tree (/team)     |
|    - Team Profiles (/team/[id]) - Client Desk (/dashboard/user)                   |
+-----------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|                        ENTERPRISE APPLICATION SHELL                               |
|   - Universal Command Palette (Cmd+K)     - Real-Time Notification Center         |
|   - Role Switcher & Breadcrumbs           - Quick-Create Actions Drawer           |
+-----------------------------------------------------------------------------------+
       |                        |                         |                  |
+-------------+          +-------------+           +-------------+    +-------------+
|  Executive  |          |  People &   |           | Engineering |    | Financial & |
| Command OS  |          |   HRMS OS   |           | & DevOps OS |    | Accounting  |
+-------------+          +-------------+           +-------------+    +-------------+
       \                        |                         |                  /
        +-------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|                             CORE SERVICES & LOGIC                                 |
|  - Auth & RBAC Service         - Financial Ledger Service    - Audit Logger       |
|  - Project & Sprint Service    - Notification Dispatcher     - Workflow Engine    |
|  - Research & Dataset Service  - GitHub Integration Broker   - DORA Metrics Engine|
+-----------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|                          POSTGRESQL RELATIONAL STORAGE                            |
|  - Users & Sessions            - Employees & Leaves          - Chart of Accounts  |
|  - General Ledger Entries      - Projects & Tasks            - OKRs & Goals       |
|  - Notifications & Subscriptions                             - Audit Trail        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Extensions

To support the complete enterprise vision, the following relational models are added to `lib/db.ts`:

1. **Financial Management**:
   - `chart_of_accounts` (`code`, `name`, `type: ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE`, `currency`)
   - `journal_entries` (`entry_number`, `entry_date`, `narration`, `created_by`, `status`)
   - `journal_lines` (`entry_id`, `account_id`, `debit`, `credit`, `project_id`)
   - `expense_claims` (`employee_id`, `amount`, `category`, `receipt_url`, `status`, `approved_by`)

2. **Project & Task OS**:
   - `project_boards` (`project_id`, `name`, `status`)
   - `enterprise_tasks` (`project_id`, `milestone_id`, `title`, `description`, `assignee_id`, `priority`, `estimated_hours`, `actual_hours`, `status: todo | in_progress | review | done`)
   - `project_risks` (`project_id`, `severity`, `probability`, `description`, `mitigation_plan`)

3. **Engineering Intelligence & Incidents**:
   - `engineering_incidents` (`title`, `severity: SEV1 | SEV2 | SEV3`, `service`, `owner_id`, `status: open | investigating | resolved`, `postmortem`)
   - `deployment_events` (`service`, `commit_sha`, `environment`, `status`, `duration_seconds`)

4. **Company OKRs & Strategy**:
   - `company_objectives` (`title`, `year`, `quarter`, `owner_id`, `status`, `confidence_score`)
   - `key_results` (`objective_id`, `title`, `metric_type`, `target_value`, `current_value`, `unit`)

5. **Universal Communications & Notifications**:
   - `user_notifications` (`user_id`, `title`, `message`, `category`, `link_url`, `is_read`, `created_at`)

6. **Company Wiki & Knowledge Base**:
   - `knowledge_documents` (`slug`, `title`, `content`, `category: handbook | engineering | research | sop`, `author_id`, `is_confidential`, `version`)
