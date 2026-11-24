import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Chart of Accounts
    const { rows: accounts } = await query(
      `SELECT id, code, name, type, currency, balance, description, is_active
       FROM chart_of_accounts
       ORDER BY code ASC`
    );

    // 2. Journal Entries with Lines
    const { rows: entries } = await query(
      `SELECT
         j.id,
         j.entry_number,
         j.entry_date,
         j.narration,
         j.reference,
         j.status,
         j.created_at,
         COALESCE(u.full_name, 'System') AS created_by_name,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', l.id,
                 'account_code', ca.code,
                 'account_name', ca.name,
                 'debit', l.debit,
                 'credit', l.credit,
                 'description', l.description
               )
             )
             FROM journal_lines l
             JOIN chart_of_accounts ca ON ca.id = l.account_id
             WHERE l.entry_id = j.id
           ), '[]'::json
         ) AS lines
       FROM journal_entries j
       LEFT JOIN users u ON u.id = j.created_by
       ORDER BY j.entry_date DESC, j.created_at DESC
       LIMIT 50`
    );

    // 3. Expense Claims
    const { rows: expenses } = await query(
      `SELECT
         ex.id,
         ex.claim_number,
         ex.title,
         ex.category,
         ex.amount,
         ex.currency,
         ex.receipt_url,
         ex.status,
         ex.created_at,
         u.full_name AS employee_name,
         e.employee_code
       FROM expense_claims ex
       JOIN employees e ON e.id = ex.employee_id
       JOIN users u ON u.id = e.user_id
       ORDER BY ex.created_at DESC
       LIMIT 50`
    );

    // 4. Financial Summary calculations
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach((a: any) => {
      const b = Number(a.balance);
      if (a.type === "ASSET") totalAssets += b;
      else if (a.type === "LIABILITY") totalLiabilities += b;
      else if (a.type === "REVENUE") totalRevenue += b;
      else if (a.type === "EXPENSE") totalExpenses += b;
    });

    const netProfit = totalRevenue - totalExpenses;

    return NextResponse.json({
      accounts,
      entries,
      expenses,
      summary: {
        totalAssets,
        totalLiabilities,
        totalRevenue,
        totalExpenses,
        netProfit,
      },
    });
  } catch (err) {
    console.error("[api/admin/finance GET]", err);
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_entry") {
      const { entry_date, narration, reference, lines } = body;
      if (!narration || !Array.isArray(lines) || lines.length < 2) {
        return NextResponse.json({ error: "A valid journal entry must contain at least 2 balancing lines." }, { status: 400 });
      }

      // Verify debits equal credits
      let totalDebit = 0;
      let totalCredit = 0;
      lines.forEach((l: any) => {
        totalDebit += Number(l.debit || 0);
        totalCredit += Number(l.credit || 0);
      });

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return NextResponse.json({ error: `Unbalanced journal entry. Total Debits (${totalDebit}) must equal Total Credits (${totalCredit}).` }, { status: 400 });
      }

      const entryNum = `JE-${Date.now().toString().slice(-6)}`;
      const { rows: entryRows } = await query(
        `INSERT INTO journal_entries (entry_number, entry_date, narration, reference, created_by, status)
         VALUES ($1, $2, $3, $4, $5, 'posted')
         RETURNING id`,
        [entryNum, entry_date || new Date().toISOString().slice(0, 10), narration, reference || '', user.id]
      );
      const entryId = entryRows[0].id;

      for (const line of lines) {
        await query(
          `INSERT INTO journal_lines (entry_id, account_id, debit, credit, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [entryId, line.account_id, Number(line.debit || 0), Number(line.credit || 0), line.description || narration]
        );

        // Update account balances
        const delta = Number(line.debit || 0) - Number(line.credit || 0);
        await query(
          `UPDATE chart_of_accounts
           SET balance = balance + $1
           WHERE id = $2`,
          [delta, line.account_id]
        );
      }

      await logAudit(user.id, "create_journal_entry", "journal_entries", entryId, { entryNum, totalDebit });
      return NextResponse.json({ ok: true, entryId, entryNum });
    }

    if (action === "update_expense_status") {
      const { id, status } = body;
      await query(`UPDATE expense_claims SET status = $1, approved_by = $2 WHERE id = $3`, [status, user.id, id]);
      await logAudit(user.id, "update_expense_status", "expense_claims", id, { status });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[api/admin/finance POST]", err);
    return NextResponse.json({ error: "Failed to process finance transaction" }, { status: 500 });
  }
}
