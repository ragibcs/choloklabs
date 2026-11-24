import { NextResponse } from "next/server";
import { parseInquiry } from "@/lib/company-os";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/providers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the form fields as JSON." }, { status: 400 });
  }

  const parsed = parseInquiry(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  // Bots get a success response and nothing is stored.
  if (parsed.spam) return NextResponse.json({ ok: true }, { status: 201 });

  try {
    const user = await getCurrentUser().catch(() => null);
    const { rows } = await query<{ id: string }>(
      `INSERT INTO inquiries (user_id, name, email, company, interest, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        user?.id || null,
        parsed.value.name,
        parsed.value.email,
        parsed.value.company || "",
        parsed.value.interest,
        parsed.value.message,
      ]
    );

    sendEmail({
      to: parsed.value.email,
      subject: `CholokLabs received your inquiry — ${parsed.value.interest}`,
      text: `Hi ${parsed.value.name},\n\nWe received your inquiry regarding "${parsed.value.interest}". An engineer from the relevant layer will review it and reply shortly.\n\nReference ID: ${rows[0].id}\n\n— CholokLabs`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[api/inquiry]", err);
    return NextResponse.json({ error: "We could not save your inquiry. Try again shortly." }, { status: 502 });
  }
}
