import { Pool, type QueryResultRow } from "pg";
import { hashPassword } from "./crypto";
import {
  industries as defaultIndustries,
  principles as defaultPrinciples,
  products as defaultProducts,
  projects as defaultProjects,
  services as defaultServices,
  site as defaultSite,
  steps as defaultSteps,
  tools as defaultTools,
} from "@/content/site";

declare global {
  // eslint-disable-next-line no-var
  var __cholokPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __cholokSchemaReady: Promise<void> | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__cholokPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    globalThis.__cholokPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }
  return globalThis.__cholokPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  await ensureSchema();
  return getPool().query<T>(text, params);
}

export async function rawQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}

const SERVICE_MEDIA = [
  ["/services/software.png", "Glass panes etched with interface wireframes and neural network diagrams", "Code2"],
  ["/services/gpu.png", "Close-up of a graphics accelerator heatsink lit from within", "Cpu"],
  ["/services/iot.png", "Industrial IoT gateway with signal rings rising above it", "Radio"],
  ["/services/automation.png", "PLC modules on a DIN rail inside a control cabinet", "SlidersHorizontal"],
  ["/services/embedded.png", "Black circuit board with a microcontroller and fine traces", "CircuitBoard"],
  ["/services/silicon.png", "Silicon wafer covered with a grid of chip dies", "Layers3"],
] as const;

const INDUSTRY_META = [
  { icon: "GraduationCap", flag: "HOME OF PORIKKHA", layers: ["Application", "Acceleration"] },
  { icon: "Factory", flag: "", layers: ["Automation", "Connectivity", "Acceleration"] },
  { icon: "Wheat", flag: "", layers: ["Automation", "Connectivity"] },
  { icon: "Zap", flag: "", layers: ["Connectivity", "Firmware"] },
  { icon: "Truck", flag: "", layers: ["Connectivity", "Firmware", "Application"] },
  { icon: "ShieldCheck", flag: "", layers: ["Application", "Firmware"] },
] as const;

const PROJECT_ART = [
  ["/services/software.png", "Glass panes etched with interface wireframes"],
  ["/services/automation.png", "PLC modules inside a control cabinet"],
  ["/services/gpu.png", "Graphics accelerator heatsink lit from within"],
] as const;

async function runMigrationsAndSeed() {
  const pool = getPool();

  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'EMPLOYEE', 'HR', 'ADMIN')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      google_id TEXT UNIQUE,
      avatar_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS integration_settings (
      key TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      secrets_encrypted TEXT,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
      recipient TEXT NOT NULL,
      subject TEXT DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
      error_message TEXT DEFAULT '',
      provider TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cms_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'development' CHECK (status IN ('testing', 'development', 'live')),
      status_label TEXT NOT NULL DEFAULT 'In development',
      href TEXT DEFAULT '',
      points JSONB NOT NULL DEFAULT '[]'::jsonb,
      icon TEXT NOT NULL DEFAULT 'GraduationCap',
      sort_order INT NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cms_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      layer TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      image_url TEXT NOT NULL DEFAULT '/services/software.png',
      image_alt TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'Code2',
      sort_order INT NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cms_industries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      note TEXT NOT NULL,
      layers JSONB NOT NULL DEFAULT '[]'::jsonb,
      flag TEXT DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'Factory',
      sort_order INT NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS cms_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'Representative engagement',
      summary TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      href TEXT DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '/services/software.png',
      image_alt TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS cms_principles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cms_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT DEFAULT '',
      interest TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'replied', 'closed')),
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      admin_reply TEXT DEFAULT '',
      replied_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      employee_code TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL DEFAULT 'Engineering',
      job_title TEXT NOT NULL DEFAULT 'Systems Engineer',
      employment_type TEXT NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
      salary_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
      hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
      manager_name TEXT DEFAULT '',
      annual_leave_balance INT NOT NULL DEFAULT 18,
      sick_leave_balance INT NOT NULL DEFAULT 10,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'unpaid')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days INT NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      review_note TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      work_date DATE NOT NULL DEFAULT CURRENT_DATE,
      clock_in TIMESTAMPTZ,
      clock_out TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'remote', 'half_day')),
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(employee_id, work_date)
    );

    CREATE TABLE IF NOT EXISTS payroll_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      period_month TEXT NOT NULL,
      base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
      bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
      deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
      net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
      paid_at TIMESTAMPTZ,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(employee_id, period_month)
    );

    CREATE TABLE IF NOT EXISTS employee_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      due_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'employees', 'hr')),
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS client_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Software & AI',
      status TEXT NOT NULL DEFAULT 'discovery' CHECK (status IN ('discovery', 'design', 'building', 'testing', 'delivered')),
      progress INT NOT NULL DEFAULT 10 CHECK (progress >= 0 AND progress <= 100),
      budget_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
      lead_name TEXT DEFAULT 'Ragib Hasan',
      target_date DATE,
      summary TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS client_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_number TEXT NOT NULL UNIQUE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
      due_date DATE,
      paid_at TIMESTAMPTZ,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Technical Support',
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      message TEXT NOT NULL,
      admin_reply TEXT DEFAULT '',
      replied_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hr_job_openings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'Engineering',
      location TEXT NOT NULL DEFAULT 'Dhaka / Remote',
      employment_type TEXT NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
      salary_range TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
      applicants_count INT NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employee_standups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      work_date DATE NOT NULL DEFAULT CURRENT_DATE,
      completed TEXT NOT NULL,
      planned TEXT NOT NULL,
      blockers TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(employee_id, work_date)
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Research & Innovation',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      cover_image TEXT DEFAULT '',
      author_name TEXT NOT NULL DEFAULT 'Ragib Hasan',
      author_role TEXT NOT NULL DEFAULT 'Founder, CholokLabs',
      read_time TEXT NOT NULL DEFAULT '4 min read',
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employee_commits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      task_id UUID REFERENCES employee_tasks(id) ON DELETE SET NULL,
      repo_name TEXT NOT NULL DEFAULT 'choloklabs/core',
      branch TEXT NOT NULL DEFAULT 'main',
      commit_sha TEXT NOT NULL,
      commit_message TEXT NOT NULL,
      commit_url TEXT DEFAULT '',
      additions INT NOT NULL DEFAULT 0,
      deletions INT NOT NULL DEFAULT 0,
      pr_status TEXT NOT NULL DEFAULT 'merged',
      ci_status TEXT NOT NULL DEFAULT 'passed',
      committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      product_target TEXT NOT NULL DEFAULT 'Porikkha',
      channel TEXT NOT NULL DEFAULT 'Social & Content',
      owner_name TEXT DEFAULT '',
      budget_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
      leads_count INT NOT NULL DEFAULT 0,
      conversions_count INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'paused', 'completed')),
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intern_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      university TEXT NOT NULL DEFAULT '',
      field_unit TEXT NOT NULL DEFAULT 'Engineering',
      cohort TEXT NOT NULL DEFAULT '2026 Cohort',
      mentor_name TEXT NOT NULL DEFAULT 'Ragib Hasan',
      project_title TEXT NOT NULL DEFAULT '',
      progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      performance_score INT NOT NULL DEFAULT 85 CHECK (performance_score >= 0 AND performance_score <= 100),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'certified', 'dropped')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS research_datasets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Bangla Audio Corpus',
      lead_name TEXT NOT NULL DEFAULT 'Ragib Hasan',
      target_samples INT NOT NULL DEFAULT 10000,
      collected_samples INT NOT NULL DEFAULT 0,
      verified_samples INT NOT NULL DEFAULT 0,
      unit_label TEXT NOT NULL DEFAULT 'audio clips',
      status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('planning', 'collecting', 'annotating', 'verified', 'published')),
      description TEXT DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
      currency TEXT NOT NULL DEFAULT 'BDT',
      balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
      description TEXT DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_number TEXT NOT NULL UNIQUE,
      entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
      narration TEXT NOT NULL,
      reference TEXT DEFAULT '',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'void')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS journal_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
      debit NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
      credit NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
      description TEXT DEFAULT '',
      project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expense_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      claim_number TEXT NOT NULL UNIQUE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Travel & Field R&D',
      amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
      currency TEXT NOT NULL DEFAULT 'BDT',
      receipt_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'reimbursed')),
      approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS enterprise_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      estimated_hours NUMERIC(6,1) NOT NULL DEFAULT 0,
      actual_hours NUMERIC(6,1) NOT NULL DEFAULT 0,
      due_date DATE,
      labels JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_risks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low', 'medium', 'high')),
      mitigation_plan TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'mitigated', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS company_objectives (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Company',
      year INT NOT NULL DEFAULT 2026,
      quarter TEXT NOT NULL DEFAULT 'Q1' CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
      owner_name TEXT NOT NULL DEFAULT 'Ragib Hasan',
      confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.85,
      status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'behind', 'at_risk', 'achieved')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS key_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      objective_id UUID NOT NULL REFERENCES company_objectives(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      metric_type TEXT NOT NULL DEFAULT 'numeric' CHECK (metric_type IN ('numeric', 'percentage', 'currency', 'boolean')),
      target_value NUMERIC(14,2) NOT NULL,
      current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '%',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'task', 'finance', 'incident', 'leave', 'security')),
      link_url TEXT DEFAULT '',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'engineering' CHECK (category IN ('engineering', 'architecture', 'research', 'sop', 'handbook')),
      content TEXT NOT NULL,
      author_name TEXT NOT NULL DEFAULT 'Ragib Hasan',
      version INT NOT NULL DEFAULT 1,
      is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS engineering_incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'SEV2' CHECK (severity IN ('SEV1', 'SEV2', 'SEV3')),
      service_affected TEXT NOT NULL DEFAULT 'Core Platform',
      owner_name TEXT NOT NULL DEFAULT 'Rakibul Hasan',
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved')),
      root_cause TEXT DEFAULT '',
      postmortem TEXT DEFAULT '',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS crm_deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      deal_code TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      pipeline_stage TEXT NOT NULL DEFAULT 'discovery' CHECK (pipeline_stage IN ('discovery', 'proposal', 'negotiation', 'won', 'lost')),
      value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
      currency TEXT NOT NULL DEFAULT 'BDT',
      probability_pct INT NOT NULL DEFAULT 50,
      expected_close_date DATE,
      owner_name TEXT NOT NULL DEFAULT 'Shariful Islam',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Reconcile any pre-existing tables to ensure all expected columns exist
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    UPDATE users SET full_name = COALESCE(full_name, name, 'User') WHERE full_name IS NULL OR full_name = '';

    ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code TEXT;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Engineering';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT 'Systems Engineer';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'full-time';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_monthly NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_name TEXT DEFAULT '';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_balance INT NOT NULL DEFAULT 18;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_leave_balance INT NOT NULL DEFAULT 10;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS parent_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS field_unit TEXT NOT NULL DEFAULT 'Engineering';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_field_head BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS github_username TEXT DEFAULT '';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_public_team BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS tree_order INT NOT NULL DEFAULT 0;
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
    UPDATE employees SET salary_monthly = COALESCE(base_salary, 0) WHERE salary_monthly = 0 AND base_salary > 0;
    UPDATE employees SET annual_leave_balance = COALESCE(leave_balance_days, 18) WHERE annual_leave_balance = 18 AND leave_balance_days IS NOT NULL;

    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS task_code TEXT DEFAULT '';
    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS field_unit TEXT DEFAULT 'Engineering';
    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS evidence_url TEXT DEFAULT '';
    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days INT NOT NULL DEFAULT 1;
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS review_note TEXT DEFAULT '';

    ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS period_month TEXT;
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS bonus NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS deductions NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS net_pay NUMERIC(12,2) NOT NULL DEFAULT 0;
    ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_emp_period_month ON payroll_records (employee_id, period_month);
    UPDATE payroll_records SET period_month = pay_period WHERE period_month IS NULL AND pay_period IS NOT NULL;
    UPDATE payroll_records SET base_salary = base_amount WHERE base_salary = 0 AND base_amount > 0;
    UPDATE payroll_records SET bonus = bonus_amount WHERE bonus = 0 AND bonus_amount > 0;
    UPDATE payroll_records SET net_pay = net_amount WHERE net_pay = 0 AND net_amount > 0;

    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS employee_id UUID;
    ALTER TABLE employee_tasks ADD COLUMN IF NOT EXISTS assigned_by UUID;
    UPDATE employee_tasks et SET employee_id = e.id FROM employees e WHERE et.employee_id IS NULL AND et.assignee_user_id = e.user_id;

    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS author_id UUID;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE announcements SET author_id = author_user_id WHERE author_id IS NULL AND author_user_id IS NOT NULL;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_tasks' AND column_name = 'assignee_user_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE employee_tasks ALTER COLUMN assignee_user_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_logs' AND column_name = 'user_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE attendance_logs ALTER COLUMN user_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'user_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE leave_requests ALTER COLUMN user_id DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' AND column_name = 'pay_period' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE payroll_records ALTER COLUMN pay_period DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' AND column_name = 'base_amount' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE payroll_records ALTER COLUMN base_amount DROP NOT NULL;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' AND column_name = 'net_amount' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE payroll_records ALTER COLUMN net_amount DROP NOT NULL;
      END IF;
    END $$;
  `);

  // Seed default site_settings if missing
  const { rows: settingsCheck } = await pool.query("SELECT key FROM site_settings WHERE key = 'homepage'");
  if (settingsCheck.length === 0) {
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ('homepage', $1::jsonb) ON CONFLICT (key) DO NOTHING`,
      [
        JSON.stringify({
          siteName: defaultSite.name,
          heroBadge: "PRODUCT & ENGINEERING STUDIO",
          heroTitleLine1: "From software",
          heroTitleLine2: "to",
          heroTitleAccent: "silicon.",
          heroDescription:
            "We build intelligent products and engineer the systems behind them — from AI applications to embedded hardware.",
          heroPrimaryCta: "Explore products",
          heroSecondaryCta: "Our services",
          statementEyebrow: "WHY CHOLOKLABS",
          statementBody:
            "We ship our own products and engineer for ambitious teams. One studio, from the interface you touch to the transistor underneath.",
          productsHeading: "Our products",
          productsSubheading: "Independent products, built and maintained by the CholokLabs team.",
          servicesHeading: "Across the stack",
          industriesHeading: "Where we build",
          industriesSubheading:
            "Six sectors where software meets the physical world, and where our layers usually combine.",
          workHeading: "Engineering in practice",
          workSubheading:
            "One product we run ourselves and two engagements that show how the layers fit together.",
          aboutHeading: "One engineering team",
          aboutSubheading:
            "Digital and physical work designed together, by the people who will hand it over.",
          contactHeading: "Tell us what you want to build",
          contactSubheading:
            "Describe the problem, the site or the product idea. We read every inquiry and reply with questions and next steps.",
          footerTagline: "Product and engineering studio. From software to silicon.",
          tools: [...defaultTools],
        }),
      ]
    );
  }

  // Seed products if empty
  const { rows: prodCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_products");
  if (Number(prodCount[0].count) === 0) {
    for (let i = 0; i < defaultProducts.length; i++) {
      const p = defaultProducts[i];
      await pool.query(
        `INSERT INTO cms_products (slug, name, tagline, summary, status, status_label, href, points, icon, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10) ON CONFLICT (slug) DO NOTHING`,
        [
          p.slug,
          p.name,
          p.tagline,
          p.summary,
          p.status,
          p.statusLabel,
          p.href || "",
          JSON.stringify(p.points),
          i === 0 ? "GraduationCap" : "ShieldCheck",
          i,
        ]
      );
    }
  }

  // Seed services if empty
  const { rows: svcCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_services");
  if (Number(svcCount[0].count) === 0) {
    for (let i = 0; i < defaultServices.length; i++) {
      const s = defaultServices[i];
      const meta = SERVICE_MEDIA[i] ?? SERVICE_MEDIA[0];
      await pool.query(
        `INSERT INTO cms_services (layer, name, summary, tags, image_url, image_alt, icon, sort_order)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)`,
        [s.layer, s.name, s.summary, JSON.stringify(s.tags), meta[0], meta[1], meta[2], i]
      );
    }
  }

  // Seed industries if empty
  const { rows: indCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_industries");
  if (Number(indCount[0].count) === 0) {
    for (let i = 0; i < defaultIndustries.length; i++) {
      const ind = defaultIndustries[i];
      const meta = INDUSTRY_META[i] ?? INDUSTRY_META[0];
      await pool.query(
        `INSERT INTO cms_industries (name, note, layers, flag, icon, sort_order)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
        [ind.name, ind.note, JSON.stringify(meta.layers), meta.flag, meta.icon, i]
      );
    }
  }

  // Seed projects if empty
  const { rows: projCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_projects");
  if (Number(projCount[0].count) === 0) {
    for (let i = 0; i < defaultProjects.length; i++) {
      const pr = defaultProjects[i];
      const art = PROJECT_ART[i] ?? PROJECT_ART[0];
      await pool.query(
        `INSERT INTO cms_projects (title, kind, summary, tags, href, image_url, image_alt, sort_order)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)`,
        [pr.title, pr.kind, pr.summary, JSON.stringify(pr.tags), pr.href || "", art[0], art[1], i]
      );
    }
  }

  // Seed principles & steps if empty
  const { rows: prinCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_principles");
  if (Number(prinCount[0].count) === 0) {
    for (let i = 0; i < defaultPrinciples.length; i++) {
      await pool.query(`INSERT INTO cms_principles (title, body, sort_order) VALUES ($1, $2, $3)`, [
        defaultPrinciples[i].title,
        defaultPrinciples[i].body,
        i,
      ]);
    }
  }

  const { rows: stepCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cms_steps");
  if (Number(stepCount[0].count) === 0) {
    for (let i = 0; i < defaultSteps.length; i++) {
      await pool.query(`INSERT INTO cms_steps (title, body, sort_order) VALUES ($1, $2, $3)`, [
        defaultSteps[i].title,
        defaultSteps[i].body,
        i,
      ]);
    }
  }

  // Seed default integration rows
  await pool.query(`
    INSERT INTO integration_settings (key, enabled, config_json)
    VALUES
      ('smtp', FALSE, '{"host":"","port":587,"secure":false,"username":"","fromName":"CholokLabs","fromEmail":"no-reply@choloklabs.tech"}'::jsonb),
      ('sms', FALSE, '{"provider":"twilio","accountSid":"","fromNumber":"","webhookUrl":""}'::jsonb),
      ('google_oauth', FALSE, '{"clientId":"","allowSignup":true,"allowedDomain":""}'::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `);

  // Provision core leadership & HR accounts if not yet created (idempotent — never overwrites passwords)
  const coreAccounts = [
    {
      email: "ragibhasan@choloklabs.tech",
      fullName: "Ragib Hasan",
      role: "ADMIN",
      initialPassword: process.env.FOUNDER_INITIAL_PASSWORD || "CholokFounder#2026",
      code: "CL-001",
      department: "Executive & Architecture",
      jobTitle: "Founder & Principal Systems Architect",
      managerName: "Board",
    },
    {
      email: "rakibulhasan.swe@choloklabs.tech",
      fullName: "Rakibul Hasan",
      role: "ADMIN",
      initialPassword: process.env.COFOUNDER_INITIAL_PASSWORD || "CholokCoFounder#2026",
      code: "CL-002",
      department: "Software Engineering",
      jobTitle: "Co-Founder & Lead Software Engineer",
      managerName: "Ragib Hasan",
    },
    {
      email: "sharifulislam.hr@choloklabs.tech",
      fullName: "Shariful Islam",
      role: "HR",
      initialPassword: process.env.HR_INITIAL_PASSWORD || "CholokHR#2026",
      code: "CL-003",
      department: "Human Resources & Operations",
      jobTitle: "Head of HR",
      managerName: "Ragib Hasan",
    },
  ] as const;

  for (const acc of coreAccounts) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [acc.email]
    );
    let userId: string;
    if (existing.rows.length === 0) {
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, full_name, phone, role, status)
         VALUES ($1, $2, $3, '', $4, 'active')
         RETURNING id`,
        [acc.email, hashPassword(acc.initialPassword), acc.fullName, acc.role]
      );
      userId = inserted.rows[0].id;
    } else {
      userId = existing.rows[0].id;
    }

    await pool.query(
      `INSERT INTO employees (user_id, employee_code, department, job_title, employment_type, salary_monthly, currency, manager_name)
       VALUES ($1, $2, $3, $4, 'full-time', 0, 'USD', $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, acc.code, acc.department, acc.jobTitle, acc.managerName]
    );
  }

  // Enrich core leadership & HR org-tree metadata idempotently if bio/skills not set yet
  await pool.query(`
    UPDATE employees
    SET field_unit = 'Executive & Architecture',
        is_field_head = TRUE,
        is_public_team = TRUE,
        tree_order = 1,
        bio = CASE WHEN COALESCE(bio, '') = '' THEN 'Founder & Principal Systems Architect leading CholokLabs across AI/ML, Bangla speech research, embedded systems, and silicon architecture.' ELSE bio END,
        skills = CASE WHEN jsonb_array_length(COALESCE(skills, '[]'::jsonb)) = 0 THEN '["Systems Architecture", "AI & ML", "Embedded & Silicon", "Bangla Audio Corpus", "Cloud & DevOps"]'::jsonb ELSE skills END
    WHERE employee_code = 'CL-001';

    UPDATE employees
    SET field_unit = 'Software & Product Engineering',
        is_field_head = TRUE,
        is_public_team = TRUE,
        tree_order = 2,
        parent_employee_id = COALESCE(parent_employee_id, (SELECT id FROM employees WHERE employee_code = 'CL-001' LIMIT 1)),
        bio = CASE WHEN COALESCE(bio, '') = '' THEN 'Co-Founder & Lead Software Engineer architecting Porikkha, BOLoy, distributed backends, and full-stack product platforms.' ELSE bio END,
        skills = CASE WHEN jsonb_array_length(COALESCE(skills, '[]'::jsonb)) = 0 THEN '["Full-Stack Engineering", "Next.js & TypeScript", "Distributed Systems", "Porikkha", "BOLoy Security"]'::jsonb ELSE skills END
    WHERE employee_code = 'CL-002';

    UPDATE employees
    SET field_unit = 'HR & People Operations',
        is_field_head = TRUE,
        is_public_team = TRUE,
        tree_order = 3,
        parent_employee_id = COALESCE(parent_employee_id, (SELECT id FROM employees WHERE employee_code = 'CL-001' LIMIT 1)),
        bio = CASE WHEN COALESCE(bio, '') = '' THEN 'Head of HR & Operations overseeing talent acquisition, university internship cohorts, people operations, and organizational culture.' ELSE bio END,
        skills = CASE WHEN jsonb_array_length(COALESCE(skills, '[]'::jsonb)) = 0 THEN '["People Operations", "Talent & Recruitment", "Internship Program", "Org Development"]'::jsonb ELSE skills END
    WHERE employee_code = 'CL-003';
  `);

  // Seed foundational CholokLabs R&D dataset trackers if empty
  const { rows: dsCount } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM research_datasets");
  if (Number(dsCount[0].count) === 0) {
    await pool.query(`
      INSERT INTO research_datasets (code, name, category, lead_name, target_samples, collected_samples, verified_samples, unit_label, status, description)
      VALUES
        ('CL-CORPUS-BN01', 'Bangla Multi-Dialect Audio Corpus', 'Bangla Audio Corpus', 'Ragib Hasan', 25000, 0, 0, 'audio clips', 'collecting', 'Dialect-diverse Bengali speech recordings across real-world acoustic environments for ASR and TTS.'),
        ('CL-CORPUS-OCR02', 'Porikkha Bengali STEM & Handwritten Exam Corpus', 'Vision & OCR Dataset', 'Rakibul Hasan', 15000, 0, 0, 'annotated pages', 'collecting', 'Structured Bengali & English assessment scripts for automated grading and OCR evaluation.'),
        ('CL-CORPUS-IOT03', 'Industrial Line Defect & Telemetry Dataset', 'Edge AI & IIoT', 'Ragib Hasan', 10000, 0, 0, 'sensor frames', 'planning', 'High-speed camera frames and PLC telemetry packets for edge defect detection.')
      ON CONFLICT (code) DO NOTHING;
    `);
  }
}

export async function ensureSchema(): Promise<void> {
  if (!globalThis.__cholokSchemaReady) {
    globalThis.__cholokSchemaReady = runMigrationsAndSeed().catch((err) => {
      globalThis.__cholokSchemaReady = undefined;
      throw err;
    });
  }
  return globalThis.__cholokSchemaReady;
}
