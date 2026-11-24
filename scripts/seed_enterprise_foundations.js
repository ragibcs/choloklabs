const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Migrating and seeding foundational enterprise records...');

  // 1. Seed Chart of Accounts
  const coa = [
    { code: '1010', name: 'Cash & Bank Reserves', type: 'ASSET', desc: 'Operating checking and reserve bank accounts' },
    { code: '1020', name: 'Accounts Receivable', type: 'ASSET', desc: 'Client invoices and billables pending collection' },
    { code: '1050', name: 'Silicon & Hardware Inventory', type: 'ASSET', desc: 'RISC-V development boards, sensors, and lab equipment' },
    { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', desc: 'Vendor bills and compute infrastructure invoices' },
    { code: '2020', name: 'Accrued Payroll & Benefits', type: 'LIABILITY', desc: 'Monthly engineering salaries and compensation' },
    { code: '3010', name: 'Paid-in Founder Capital', type: 'EQUITY', desc: 'Founder capital & shareholder equity' },
    { code: '3020', name: 'Retained Earnings', type: 'EQUITY', desc: 'Cumulative operational net profit' },
    { code: '4010', name: 'Enterprise Software Solutions', type: 'REVENUE', desc: 'Porikkha and custom enterprise system engineering contracts' },
    { code: '4020', name: 'Edge Silicon & Licensing', type: 'REVENUE', desc: 'BOLoy edge runtime and quantized model deployment royalties' },
    { code: '4030', name: 'Research Grants & Corpus Subsidies', type: 'REVENUE', desc: 'Bangla Audio Corpus research funding and grants' },
    { code: '5010', name: 'Engineering Salaries & Payroll', type: 'EXPENSE', desc: 'Core engineering, research fellow, and HR compensation' },
    { code: '5020', name: 'Cloud Infrastructure & GPU Compute', type: 'EXPENSE', desc: 'Training clusters, database hosting, and CDN bandwidth' },
    { code: '5030', name: 'Hardware Prototyping & Lab Tools', type: 'EXPENSE', desc: 'Audio recording dynamic microphones and electronics' }
  ];

  for (const acc of coa) {
    await pool.query(
      `INSERT INTO chart_of_accounts (code, name, type, currency, description)
       VALUES ($1, $2, $3, 'BDT', $4)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [acc.code, acc.name, acc.type, acc.desc]
    );
  }
  console.log('Chart of Accounts seeded.');

  // 2. Seed Company Objectives & Key Results
  const { rows: objCount } = await pool.query('SELECT COUNT(*) FROM company_objectives');
  if (Number(objCount[0].count) === 0) {
    const { rows: obj1 } = await pool.query(
      `INSERT INTO company_objectives (title, category, year, quarter, owner_name, confidence_score, status)
       VALUES ('Achieve Multi-Dialect Bangla Speech Corpus Milestone & Edge Quantization', 'Research & AI', 2026, 'Q1', 'Ragib Hasan', 0.90, 'on_track')
       RETURNING id`
    );
    const obj1Id = obj1[0].id;

    await pool.query(
      `INSERT INTO key_results (objective_id, title, metric_type, target_value, current_value, unit)
       VALUES
         ($1, 'Collect and verify 5,000+ hours of acoustic audio across 8 divisions', 'numeric', 5000, 1850, 'hours'),
         ($1, 'Quantize Conformer ASR model for RISC-V edge NPU under 15ms latency', 'numeric', 15, 14.2, 'ms'),
         ($1, 'Phonetic alignment accuracy on dialect test set', 'percentage', 95.0, 93.4, '%')`,
      [obj1Id]
    );

    const { rows: obj2 } = await pool.query(
      `INSERT INTO company_objectives (title, category, year, quarter, owner_name, confidence_score, status)
       VALUES ('Scale Porikkha Assessment Engine Enterprise Adoption', 'Product Engineering', 2026, 'Q1', 'Rakibul Hasan', 0.85, 'on_track')
       RETURNING id`
    );
    const obj2Id = obj2[0].id;

    await pool.query(
      `INSERT INTO key_results (objective_id, title, metric_type, target_value, current_value, unit)
       VALUES
         ($1, 'Concurrent proctored candidate capacity', 'numeric', 10000, 6500, 'candidates'),
         ($1, 'WebRTC proctoring streaming latency', 'numeric', 100, 68, 'ms'),
         ($1, 'System availability & uptime SLA', 'percentage', 99.95, 99.98, '%')`,
      [obj2Id]
    );
    console.log('Company OKRs and Key Results seeded.');
  }

  // 3. Seed Knowledge Base Documents
  const docs = [
    {
      slug: 'adr-001-unified-modular-monolith',
      title: 'ADR-001: Next.js App Router & PostgreSQL Monolith Architecture',
      category: 'architecture',
      content: '# ADR-001: Next.js App Router & PostgreSQL Monolith Architecture\n\n## Status\nAccepted\n\n## Context\nCholokLabs operates a fast-paced deep-tech platform spanning speech datasets, embedded hardware benchmarks, and client platforms. Splitting into disparate microservices prematurely introduces network serialization overhead, distributed transaction failures, and deployment complexity.\n\n## Decision\nWe consolidate core capabilities into a unified Next.js App Router monolith with Neon PostgreSQL as the single source of truth. Core domains (Finance, HRMS, Projects, Datasets) communicate via internal TypeScript services and strictly typed SQL transactions.\n\n## Consequences\n- Sub-50ms query dispatch.\n- Single transactional boundaries with zero dual-write inconsistencies.\n- Unified deployment and monitoring.',
      author: 'Ragib Hasan',
      tags: ['Architecture', 'ADR', 'Next.js', 'PostgreSQL']
    },
    {
      slug: 'sop-001-bangla-speech-audio-recording',
      title: 'SOP-001: Acoustic Speech Dataset Collection & Quality Validation',
      category: 'research',
      content: '# SOP-001: Acoustic Speech Dataset Collection & Quality Validation\n\n## Objective\nTo ensure consistent 48kHz 24-bit audio capture with standardized microphone placement and noise floor calibration.\n\n## Equipment Checklist\n1. Dynamic vocal cardioid transducer (near-field).\n2. 4-capsule boundary array microphone (far-field ambient).\n3. USB audio interface with balanced XLR preamps (+48V phantom power disabled for dynamics).\n\n## Validation Criteria\n- Peak signal level: -6dBFS to -3dBFS.\n- SNR > 42dB in silent room calibration.\n- Minimum utterance duration: 1.2s; Maximum: 14.0s.',
      author: 'Ragib Hasan',
      tags: ['SOP', 'Audio Corpus', 'DSP', 'Speech AI']
    }
  ];

  for (const doc of docs) {
    await pool.query(
      `INSERT INTO knowledge_documents (slug, title, category, content, author_name, tags)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, title = EXCLUDED.title`,
      [doc.slug, doc.title, doc.category, doc.content, doc.author, JSON.stringify(doc.tags)]
    );
  }
  console.log('Knowledge documents seeded.');

  // 4. Seed Welcome Notifications for Leadership
  const { rows: users } = await pool.query('SELECT id, full_name FROM users');
  for (const u of users) {
    await pool.query(
      `INSERT INTO user_notifications (user_id, title, message, category, link_url)
       VALUES
         ($1, 'Welcome to CholokLabs Enterprise OS', 'Your unified command center, OKR tracking, and financial ledgers are now active.', 'system', '/dashboard/admin'),
         ($1, 'Q1 2026 Strategy & OKRs Published', 'Review active strategic milestones for the Bangla Audio Corpus and Porikkha.', 'task', '/dashboard/admin')
       ON CONFLICT DO NOTHING`,
      [u.id]
    );
  }
  console.log('Notifications initialized.');

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
