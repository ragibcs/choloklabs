const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Seeding full CholokLabs team tree and profile data...');

  // 1. Update Core Leadership
  const ragibProfile = {
    tagline: 'Founder & Principal Systems Architect at CholokLabs. Passionate about building high-performance systems, elegant user interfaces, and scalable architectures.',
    specializations: ['Systems Architecture', 'Bangla Speech Corpus & DSP', 'Clean Code & API Design', 'Edge Silicon Acceleration'],
    core_skills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Rust', 'Python', 'RISC-V', 'Audio DSP'],
    philosophy: 'Write clean, testable, and maintainable code with high consistency and zero unnecessary complexity.',
    what_i_do: [
      'Architect scalable edge and cloud backend microservices with strict type safety and sub-millisecond dispatch.',
      'Lead the CholokLabs Bangla Speech Corpus initiative across 8 divisions with 5,000+ hours acoustic audio.',
      'Direct core product engineering teams across Porikkha adaptive proctoring and BOLoy edge OS.',
      'Collaborate closely with cross-functional research wings to deliver impactful, production-ready deep-tech solutions.'
    ],
    portfolio: [
      { title: 'CholokLabs Bangla Speech Corpus & Edge Silicon', code: 'Lead - CL-001', description: '5,000+ hours multi-dialect acoustic dataset with RISC-V edge silicon inference pipeline.' },
      { title: 'Porikkha - Distributed Assessment & Proctoring Engine', code: 'Architect - CL-001', description: 'Adaptive proctoring engine with on-device computer vision and tamper resistance.' },
      { title: 'BOLoy - Realtime Secure Edge Operating Environment', code: 'Lead - CL-001', description: 'Low-footprint realtime OS for constrained microcontroller hardware.' }
    ],
    minutes_last_30_days: 4320,
    log_entries_last_30_days: 48,
    skill_distribution: [
      { name: 'Systems Architecture', level: 'Expert', pct: 96 },
      { name: 'Speech AI & DSP', level: 'Expert', pct: 92 },
      { name: 'Distributed Backends', level: 'Expert', pct: 90 },
      { name: 'Edge Silicon', level: 'Intermediate', pct: 84 }
    ],
    weekly_trend: [
      { date: '2026-11-17', minutes: 480 },
      { date: '2026-11-18', minutes: 520 },
      { date: '2026-11-19', minutes: 610 },
      { date: '2026-11-20', minutes: 580 },
      { date: '2026-11-21', minutes: 420 },
      { date: '2026-11-22', minutes: 590 },
      { date: '2026-11-23', minutes: 640 }
    ],
    task_status: { todo: 2, in_progress: 3, done: 42 }
  };

  await pool.query(
    `UPDATE employees SET
      points = 450,
      contributions = 315,
      tree_order = 1,
      profile_details = $1
     WHERE employee_code = 'CL-001'`,
    [JSON.stringify(ragibProfile)]
  );

  const rakibulProfile = {
    tagline: 'Co-Founder & Lead Software Engineer at CholokLabs. Specialist in reactive full-stack architectures, high-load microservices, and design systems.',
    specializations: ['Full-Stack Engineering', 'Distributed Cloud', 'Security Architecture', 'Design Systems'],
    core_skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'Go'],
    philosophy: 'Build rock-solid products where frontend craft meets uncompromising distributed systems reliability.',
    what_i_do: [
      'Lead the software engineering wing building the core web and mobile interfaces for all CholokLabs systems.',
      'Maintain high performance benchmarks across cloud APIs with sub-50ms p99 response times.',
      'Design reusable UI components, animations, and micro-interactions for the company product lineup.'
    ],
    portfolio: [
      { title: 'Porikkha Web & Realtime Engine', code: 'Lead SWE - CL-002', description: 'Realtime proctoring frontend and distributed WebSocket communication layer.' },
      { title: 'CholokLabs Company OS & Admin Console', code: 'Lead SWE - CL-002', description: 'All-in-one company management dashboard and client portal.' }
    ],
    minutes_last_30_days: 3840,
    log_entries_last_30_days: 44,
    skill_distribution: [
      { name: 'Full-Stack Web', level: 'Expert', pct: 95 },
      { name: 'System Design', level: 'Expert', pct: 88 },
      { name: 'Cloud Infrastructure', level: 'Intermediate', pct: 82 },
      { name: 'UI/UX & Animation', level: 'Expert', pct: 90 }
    ],
    weekly_trend: [
      { date: '2026-11-17', minutes: 450 },
      { date: '2026-11-18', minutes: 490 },
      { date: '2026-11-19', minutes: 540 },
      { date: '2026-11-20', minutes: 510 },
      { date: '2026-11-21', minutes: 390 },
      { date: '2026-11-22', minutes: 560 },
      { date: '2026-11-23', minutes: 600 }
    ],
    task_status: { todo: 1, in_progress: 2, done: 35 }
  };

  await pool.query(
    `UPDATE employees SET
      points = 390,
      contributions = 280,
      tree_order = 2,
      profile_details = $1
     WHERE employee_code = 'CL-002'`,
    [JSON.stringify(rakibulProfile)]
  );

  const sharifulProfile = {
    tagline: 'Head of HR & People Operations at CholokLabs. Empowering engineers, university talent, and researchers through structured growth and culture.',
    specializations: ['Talent Strategy', 'University Partnerships', 'Engineering Culture', 'Operations'],
    core_skills: ['People Operations', 'Technical Recruitment', 'Internship Fellowship', 'Labor Compliance'],
    philosophy: 'Great engineering thrives when exceptional individuals are supported with clear direction, trust, and psychological safety.',
    what_i_do: [
      'Oversee end-to-end recruitment pipelines for research fellows, core engineers, and interns.',
      'Partner with leading universities for research dataset collection and internship placements.',
      'Maintain daily async standup accountability, employee well-being, and performance appraisals.'
    ],
    portfolio: [
      { title: 'CholokLabs University Fellowship Program', code: 'Head of HR - CL-003', description: 'Multi-campus student internship and researcher incubation initiative.' },
      { title: 'Engineering Performance & Async Work Tracker', code: 'Lead - CL-003', description: 'Remote workforce tracking, daily milestones, and transparent evaluation matrix.' }
    ],
    minutes_last_30_days: 3100,
    log_entries_last_30_days: 38,
    skill_distribution: [
      { name: 'People Operations', level: 'Expert', pct: 94 },
      { name: 'Recruitment & Talent', level: 'Expert', pct: 92 },
      { name: 'University Relations', level: 'Expert', pct: 90 },
      { name: 'Compliance & Legal', level: 'Intermediate', pct: 80 }
    ],
    weekly_trend: [
      { date: '2026-11-17', minutes: 360 },
      { date: '2026-11-18', minutes: 400 },
      { date: '2026-11-19', minutes: 430 },
      { date: '2026-11-20', minutes: 390 },
      { date: '2026-11-21', minutes: 320 },
      { date: '2026-11-22', minutes: 410 },
      { date: '2026-11-23', minutes: 460 }
    ],
    task_status: { todo: 2, in_progress: 1, done: 28 }
  };

  await pool.query(
    `UPDATE employees SET
      points = 320,
      contributions = 195,
      tree_order = 3,
      profile_details = $1
     WHERE employee_code = 'CL-003'`,
    [JSON.stringify(sharifulProfile)]
  );

  // Get Ragib's employee ID
  const { rows: ragibRows } = await pool.query("SELECT id FROM employees WHERE employee_code = 'CL-001'");
  const ragibEmpId = ragibRows[0].id;
  const { rows: rakibulRows } = await pool.query("SELECT id FROM employees WHERE employee_code = 'CL-002'");
  const rakibulEmpId = rakibulRows[0].id;
  const { rows: sharifulRows } = await pool.query("SELECT id FROM employees WHERE employee_code = 'CL-003'");
  const sharifulEmpId = sharifulRows[0].id;

  // Additional Team Members to populate the exact tree
  const teamNodes = [
    // Left Branch: Frontend, Mobile & UI/UX (reports to Rakibul Hasan CL-002)
    {
      code: 'CL-004',
      name: 'Tanvir Ahmed',
      email: 'tanvir.eng@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Senior Frontend Architect',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: rakibulEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'Frontend Architect',
      skills: ['React', 'Next.js', 'WebGL', 'Tailwind', 'Performance Optimization'],
      bio: 'Senior Frontend Architect leading component architecture, responsive design systems, and WebGL visualizations.',
      tree_order: 10,
      points: 290,
      contributions: 140
    },
    {
      code: 'CL-005',
      name: 'Sourav Kundu',
      email: 'sourav.ui@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Lead UI/UX Designer',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: rakibulEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'UI/UX Lead',
      skills: ['Figma', 'Design Systems', 'Micro-Interactions', 'User Testing', 'Prototyping'],
      bio: 'Lead UI/UX Designer crafting the dark bioluminescent design language and accessibility standards across CholokLabs products.',
      tree_order: 11,
      points: 260,
      contributions: 110
    },
    {
      code: 'CL-006',
      name: 'MD Shakhawat Hossain',
      email: 'shakhawat.swe@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Full-Stack Engineer',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: rakibulEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'Full-Stack SWE',
      skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'REST APIs'],
      bio: 'Full-Stack Engineer specializing in resilient database transactions and client workspace portal features.',
      tree_order: 12,
      points: 240,
      contributions: 95
    },
    {
      code: 'CL-007',
      name: 'Joyanta Kumar',
      email: 'joyanta.dev@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Mobile Applications Lead',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: rakibulEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'Mobile Lead',
      skills: ['Flutter', 'React Native', 'Android NDK', 'Offline-First', 'SQLite'],
      bio: 'Mobile Applications Lead delivering low-latency offline sync and field collection apps for the speech corpus.',
      tree_order: 13,
      points: 210,
      contributions: 85
    },
    {
      code: 'CL-008',
      name: 'Rifat Ara Ananya',
      email: 'rifat.design@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Product Designer',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: rakibulEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'Product Designer',
      skills: ['Visual Design', 'Wireframing', 'User Research', 'Typography'],
      bio: 'Product Designer focused on making complex AI research tools and hardware status dashboards intuitive for humans.',
      tree_order: 14,
      points: 195,
      contributions: 70
    },

    // Right Branch: Embedded, Silicon & Speech AI (reports to Ragib Hasan CL-001)
    {
      code: 'CL-019',
      name: 'Ahsan Habib',
      email: 'ahsan.silicon@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Lead Silicon & Edge Architect',
      department: 'Embedded & Hardware Engineering',
      field_unit: 'Embedded & Silicon Architecture',
      parent_id: ragibEmpId,
      manager_name: 'Ragib Hasan',
      badge: 'Silicon Architect',
      skills: ['RISC-V', 'Verilog', 'Edge AI', 'C/C++', 'Micro-NPU Acceleration'],
      bio: 'Lead Silicon & Edge Architect driving hardware acceleration pipelines for on-device quantized Conformer speech models.',
      tree_order: 20,
      points: 340,
      contributions: 210
    },
    {
      code: 'CL-020',
      name: 'MD Sazzadul Islam',
      email: 'sazzad.dsp@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Senior Audio DSP Engineer',
      department: 'Embedded & Hardware Engineering',
      field_unit: 'Embedded & Silicon Architecture',
      parent_id: ragibEmpId,
      manager_name: 'Ahsan Habib',
      badge: 'DSP Engineer',
      skills: ['Digital Signal Processing', 'Noise Cancellation', 'Beamforming', 'Python', 'C++'],
      bio: 'Senior Audio DSP Engineer architecting 48kHz dual-mic acoustic filtering and acoustic noise subtraction.',
      tree_order: 21,
      points: 285,
      contributions: 130
    },
    {
      code: 'CL-021',
      name: 'MD Riazul Islam',
      email: 'riazul.ai@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Speech AI & ASR Engineer',
      department: 'Research & Innovation',
      field_unit: 'Research & Innovation Wing',
      parent_id: ragibEmpId,
      manager_name: 'Ragib Hasan',
      badge: 'Speech AI Lead',
      skills: ['Conformer', 'Transformer ASR', 'PyTorch', 'Bangla Phonetics', 'Quantization'],
      bio: 'Speech AI Engineer training end-to-end ASR models on the CholokLabs 5,000+ hour multi-dialect Bangla corpus.',
      tree_order: 22,
      points: 295,
      contributions: 155
    },
    {
      code: 'CL-022',
      name: 'Shakil Ahmed',
      email: 'shakil.sys@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Systems & DevOps Engineer',
      department: 'Software Engineering',
      field_unit: 'Software & Product Engineering',
      parent_id: ragibEmpId,
      manager_name: 'Rakibul Hasan',
      badge: 'DevOps Lead',
      skills: ['Kubernetes', 'Linux Kernel', 'CI/CD', 'Docker', 'Prometheus', 'WireGuard'],
      bio: 'Systems & DevOps Engineer managing high-availability GPU training clusters and zero-trust private infrastructure.',
      tree_order: 23,
      points: 270,
      contributions: 125
    },
    {
      code: 'CL-023',
      name: 'Zubayer Hossain',
      email: 'zubayer.sec@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Edge Security Engineer',
      department: 'Embedded & Hardware Engineering',
      field_unit: 'Embedded & Silicon Architecture',
      parent_id: ragibEmpId,
      manager_name: 'Ahsan Habib',
      badge: 'Security Lead',
      skills: ['Cryptography', 'Secure Boot', 'Rust', 'Hardware Root of Trust', 'Penetration Testing'],
      bio: 'Edge Security Engineer ensuring hardware-enforced tamper resistance and encrypted firmware attestations on BOLoy.',
      tree_order: 24,
      points: 250,
      contributions: 105
    },

    // Center Column: Operations & Field Heads (reports to Shariful Islam CL-003)
    {
      code: 'CL-010',
      name: 'MD Golam Kibria',
      email: 'kibria.ops@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Operations & QA Coordinator',
      department: 'Human Resources & Operations',
      field_unit: 'HR & People Operations',
      parent_id: sharifulEmpId,
      manager_name: 'Shariful Islam',
      badge: 'Operations Lead',
      skills: ['QA Automation', 'Process Engineering', 'Incident Response', 'Agile'],
      bio: 'Operations & QA Coordinator driving team-wide delivery standards and automated test coverage across releases.',
      tree_order: 30,
      points: 230,
      contributions: 90
    },
    {
      code: 'CL-011',
      name: 'Masuda Akter',
      email: 'masuda.hr@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'People Operations Specialist',
      department: 'Human Resources & Operations',
      field_unit: 'HR & People Operations',
      parent_id: sharifulEmpId,
      manager_name: 'Shariful Islam',
      badge: 'People Ops',
      skills: ['Onboarding', 'Talent Curation', 'Async Workflows', 'Event Coordination'],
      bio: 'People Operations Specialist facilitating smooth onboarding, university outreach sessions, and developer workshops.',
      tree_order: 31,
      points: 205,
      contributions: 75
    },
    {
      code: 'CL-012',
      name: 'MD Nahidul Islam',
      email: 'nahidul.mkt@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'Product Marketing & Growth Head',
      department: 'Marketing & Commercialization',
      field_unit: 'Marketing & Commercialization',
      parent_id: sharifulEmpId,
      manager_name: 'Shariful Islam',
      badge: 'Marketing Head',
      skills: ['Product Marketing', 'Developer Relations', 'Growth Analytics', 'Content Strategy'],
      bio: 'Product Marketing & Growth Head leading developer adoption campaigns for Porikkha, BOLoy, and open-source datasets.',
      tree_order: 32,
      points: 215,
      contributions: 80
    },

    // Bottom Level (Under Emblem): University Research & Fellowship Lead (reports to Shariful Islam CL-003)
    {
      code: 'CL-013',
      name: 'MD Sazed Sheikh',
      email: 'sazed.fellow@choloklabs.tech',
      role: 'EMPLOYEE',
      job_title: 'University Fellowship & Research Lead',
      department: 'Research & Innovation',
      field_unit: 'Research & Innovation Wing',
      parent_id: sharifulEmpId,
      manager_name: 'Shariful Islam',
      badge: 'Fellowship Lead',
      skills: ['Research Mentorship', 'Phonetic Labeling', 'Acoustic Corpus', 'Academic Outreach'],
      bio: 'University Fellowship & Research Lead bridging academia with industry R&D across top universities in Bangladesh.',
      tree_order: 40,
      points: 260,
      contributions: 115
    }
  ];

  for (const node of teamNodes) {
    // Check if user exists
    let userId;
    const { rows: uRows } = await pool.query('SELECT id FROM users WHERE email = $1', [node.email]);
    if (uRows.length > 0) {
      userId = uRows[0].id;
    } else {
      const { rows: newU } = await pool.query(
        `INSERT INTO users (email, full_name, role, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [node.email, node.name, node.role]
      );
      userId = newU[0].id;
    }

    const memberProfile = {
      tagline: `${node.job_title} at CholokLabs. ${node.bio}`,
      specializations: node.skills.slice(0, 3),
      core_skills: node.skills,
      philosophy: 'Deliver reliable, high-craft engineering solutions with zero compromise on precision.',
      what_i_do: [
        `Lead technical execution for ${node.field_unit}.`,
        `Collaborate with cross-functional leadership on scalable engineering deliverables.`,
        `Mentor university interns and research fellows.`
      ],
      portfolio: [
        { title: `CholokLabs Core Initiative - ${node.field_unit}`, code: `${node.badge} - ${node.code}`, description: node.bio }
      ],
      minutes_last_30_days: 2400 + Math.floor(Math.random() * 1200),
      log_entries_last_30_days: 25 + Math.floor(Math.random() * 20),
      skill_distribution: [
        { name: node.skills[0] || 'Core Engineering', level: 'Expert', pct: 90 },
        { name: node.skills[1] || 'Systems', level: 'Expert', pct: 85 },
        { name: node.skills[2] || 'Architecture', level: 'Intermediate', pct: 80 }
      ],
      weekly_trend: [
        { date: '2026-11-17', minutes: 350 },
        { date: '2026-11-18', minutes: 390 },
        { date: '2026-11-19', minutes: 420 },
        { date: '2026-11-20', minutes: 380 },
        { date: '2026-11-21', minutes: 310 },
        { date: '2026-11-22', minutes: 400 },
        { date: '2026-11-23', minutes: 430 }
      ],
      task_status: { todo: 2, in_progress: 2, done: 18 }
    };

    // Upsert employee
    await pool.query(
      `INSERT INTO employees (
        user_id, employee_code, department, job_title, employment_type, status,
        base_salary, salary_monthly, location, hire_date, leave_balance_days,
        annual_leave_balance, sick_leave_balance, parent_employee_id, field_unit,
        is_field_head, bio, skills, is_public_team, tree_order, manager_name,
        points, contributions, profile_details
      )
      VALUES (
        $1, $2, $3, $4, 'full-time', 'active',
        90000, 90000, 'Dhaka, Bangladesh', NOW(), 15,
        15, 10, $5, $6,
        true, $7, $8, true, $9, $10,
        $11, $12, $13
      )
      ON CONFLICT (employee_code) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        department = EXCLUDED.department,
        job_title = EXCLUDED.job_title,
        parent_employee_id = EXCLUDED.parent_employee_id,
        field_unit = EXCLUDED.field_unit,
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        tree_order = EXCLUDED.tree_order,
        manager_name = EXCLUDED.manager_name,
        points = EXCLUDED.points,
        contributions = EXCLUDED.contributions,
        profile_details = EXCLUDED.profile_details`,
      [
        userId, node.code, node.department, node.job_title,
        node.parent_id, node.field_unit, node.bio, JSON.stringify(node.skills),
        node.tree_order, node.manager_name, node.points, node.contributions,
        JSON.stringify(memberProfile)
      ]
    );
  }

  // Get Sazed Sheikh's ID for interns
  const { rows: sazedRows } = await pool.query("SELECT id FROM employees WHERE employee_code = 'CL-013'");
  const sazedEmpId = sazedRows[0].id;

  // Fellows & Interns fan out at the bottom
  const internNodes = [
    { code: 'CL-014', name: 'Zahid Hasan Shanto', email: 'shanto.intern@choloklabs.tech', role: 'EMPLOYEE', job_title: 'Speech Corpus Fellow', dept: 'Research & Innovation', field: 'Research & Innovation Wing', badge: 'Research Fellow', skills: ['Speech Annotation', 'Praat', 'Bangla Dialects'], order: 51 },
    { code: 'CL-015', name: 'MD Easin Mia', email: 'easin.intern@choloklabs.tech', role: 'EMPLOYEE', job_title: 'Edge AI & DSP Intern', dept: 'Embedded & Hardware Engineering', field: 'Embedded & Silicon Architecture', badge: 'Edge AI Intern', skills: ['C++', 'TensorFlow Lite', 'Microcontrollers'], order: 52 },
    { code: 'CL-016', name: 'Shishir Islam', email: 'shishir.intern@choloklabs.tech', role: 'EMPLOYEE', job_title: 'Porikkha Platform Intern', dept: 'Software Engineering', field: 'Software & Product Engineering', badge: 'SWE Intern', skills: ['React', 'Next.js', 'Tailwind'], order: 53 },
    { code: 'CL-017', name: 'Sumaiya Yasmin', email: 'sumaiya.fellow@choloklabs.tech', role: 'EMPLOYEE', job_title: 'Linguistic Annotation Fellow', dept: 'Research & Innovation', field: 'Research & Innovation Wing', badge: 'Research Fellow', skills: ['Phonetics', 'Orthography', 'Audio Curation'], order: 54 },
    { code: 'CL-018', name: 'Zaria Sadaf Khan', email: 'zaria.silicon@choloklabs.tech', role: 'EMPLOYEE', job_title: 'Silicon Hardware Intern', dept: 'Embedded & Hardware Engineering', field: 'Embedded & Silicon Architecture', badge: 'Silicon Intern', skills: ['Verilog', 'FPGA', 'Logic Design'], order: 55 }
  ];

  for (const node of internNodes) {
    let userId;
    const { rows: uRows } = await pool.query('SELECT id FROM users WHERE email = $1', [node.email]);
    if (uRows.length > 0) {
      userId = uRows[0].id;
    } else {
      const { rows: newU } = await pool.query(
        `INSERT INTO users (email, full_name, role, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [node.email, node.name, node.role]
      );
      userId = newU[0].id;
    }

    const memberProfile = {
      tagline: `${node.job_title} at CholokLabs. Passionate university researcher working on deep-tech Bangla NLP & edge systems.`,
      specializations: node.skills,
      core_skills: node.skills,
      philosophy: 'Learn rapidly, execute meticulously, and contribute to cutting-edge open science.',
      what_i_do: [
        `Conduct dataset collection and audio validation experiments.`,
        `Collaborate with research leads on model benchmarks and documentation.`,
        `Participate in daily engineering standups and sprint retrospectives.`
      ],
      portfolio: [
        { title: `CholokLabs University Fellowship - ${node.job_title}`, code: `${node.badge} - ${node.code}`, description: 'Research fellowship work on Bangla speech datasets and edge compute benchmarks.' }
      ],
      minutes_last_30_days: 1800 + Math.floor(Math.random() * 600),
      log_entries_last_30_days: 20 + Math.floor(Math.random() * 10),
      skill_distribution: [
        { name: node.skills[0], level: 'Intermediate', pct: 75 },
        { name: node.skills[1], level: 'Beginner', pct: 65 }
      ],
      weekly_trend: [
        { date: '2026-11-17', minutes: 240 },
        { date: '2026-11-18', minutes: 280 },
        { date: '2026-11-19', minutes: 300 },
        { date: '2026-11-20', minutes: 260 },
        { date: '2026-11-21', minutes: 210 },
        { date: '2026-11-22', minutes: 290 },
        { date: '2026-11-23', minutes: 310 }
      ],
      task_status: { todo: 2, in_progress: 1, done: 10 }
    };

    await pool.query(
      `INSERT INTO employees (
        user_id, employee_code, department, job_title, employment_type, status,
        base_salary, salary_monthly, location, hire_date, leave_balance_days,
        annual_leave_balance, sick_leave_balance, parent_employee_id, field_unit,
        is_field_head, bio, skills, is_public_team, tree_order, manager_name,
        points, contributions, profile_details
      )
      VALUES (
        $1, $2, $3, $4, 'internship', 'active',
        30000, 30000, 'Dhaka, Bangladesh', NOW(), 10,
        10, 5, $5, $6,
        false, $7, $8, true, $9, 'MD Sazed Sheikh',
        140, 65, $10
      )
      ON CONFLICT (employee_code) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        department = EXCLUDED.department,
        job_title = EXCLUDED.job_title,
        parent_employee_id = EXCLUDED.parent_employee_id,
        field_unit = EXCLUDED.field_unit,
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        tree_order = EXCLUDED.tree_order,
        manager_name = EXCLUDED.manager_name,
        points = EXCLUDED.points,
        contributions = EXCLUDED.contributions,
        profile_details = EXCLUDED.profile_details`,
      [
        userId, node.code, node.dept, node.job_title,
        sazedEmpId, node.field, `University Fellow and Research Intern at CholokLabs working on ${node.skills.join(', ')}.`,
        JSON.stringify(node.skills), node.order, JSON.stringify(memberProfile)
      ]
    );
  }

  console.log('Successfully seeded 19 realistic team nodes with full tree hierarchy and profile details!');
  await pool.end();
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
