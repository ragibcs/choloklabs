const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const allowed = [
    'ragibhasan@choloklabs.tech',
    'rakibulhasan.swe@choloklabs.tech',
    'sharifulislam.hr@choloklabs.tech',
  ];

  console.log('Keeping only:', allowed);

  // 1. Delete tasks/commits for other employees if any
  const { rows: otherEmps } = await pool.query(
    `SELECT e.id, u.email, u.full_name, e.employee_code
     FROM employees e
     JOIN users u ON u.id = e.user_id
     WHERE LOWER(u.email) != ALL($1)`,
    [allowed]
  );

  console.log('Employees to remove count:', otherEmps.length);

  if (otherEmps.length > 0) {
    const ids = otherEmps.map((e) => e.id);
    await pool.query('DELETE FROM employee_tasks WHERE employee_id = ANY($1)', [ids]);
    await pool.query('DELETE FROM employee_commits WHERE employee_id = ANY($1)', [ids]);
    await pool.query('DELETE FROM employees WHERE id = ANY($1)', [ids]);
    console.log('Removed extra employee records');
  }

  // 2. Remove extra users
  const { rows: otherUsers } = await pool.query(
    `SELECT id, email, full_name
     FROM users
     WHERE LOWER(email) != ALL($1)`,
    [allowed]
  );

  console.log('Extra users count:', otherUsers.length);
  if (otherUsers.length > 0) {
    const uids = otherUsers.map((u) => u.id);
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [uids]);
    console.log('Removed extra user accounts');
  }

  // 3. Confirm remaining
  const { rows: remaining } = await pool.query(
    `SELECT e.id, e.employee_code, u.full_name, u.email, e.job_title, e.department, e.points, e.contributions
     FROM employees e
     JOIN users u ON u.id = e.user_id
     ORDER BY e.tree_order ASC`
  );

  console.log('REMAINING EMPLOYEES:');
  console.table(remaining);

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
