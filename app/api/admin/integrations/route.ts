import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { getAllIntegrationsSafe, saveIntegration, sendEmail, sendSms } from "@/lib/providers";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  const [integrations, logsRes] = await Promise.all([
    getAllIntegrationsSafe(),
    query(`SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 20`),
  ]);

  return NextResponse.json({ integrations, logs: logsRes.rows });
}

export async function PUT(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = await req.json();
    const { provider } = body as { provider: "smtp" | "sms" | "google_oauth" };

    if (provider === "smtp") {
      await saveIntegration(
        "smtp",
        Boolean(body.enabled),
        {
          host: String(body.host || "").trim(),
          port: Number(body.port || 587),
          secure: Boolean(body.secure),
          username: String(body.username || "").trim(),
          fromName: String(body.fromName || "CholokLabs").trim(),
          fromEmail: String(body.fromEmail || "").trim(),
        },
        { password: body.password },
        admin.id
      );
    } else if (provider === "sms") {
      await saveIntegration(
        "sms",
        Boolean(body.enabled),
        {
          provider: String(body.smsProvider || "twilio"),
          accountSid: String(body.accountSid || "").trim(),
          fromNumber: String(body.fromNumber || "").trim(),
          webhookUrl: String(body.webhookUrl || "").trim(),
        },
        { authToken: body.authToken },
        admin.id
      );
    } else if (provider === "google_oauth") {
      await saveIntegration(
        "google_oauth",
        Boolean(body.enabled),
        {
          clientId: String(body.clientId || "").trim(),
          allowSignup: body.allowSignup !== false,
          allowedDomain: String(body.allowedDomain || "").trim(),
        },
        { clientSecret: body.clientSecret },
        admin.id
      );
    } else {
      return NextResponse.json({ error: "Unknown integration provider" }, { status: 400 });
    }

    await logAudit(admin.id, `integration.update_${provider}`, "integration_settings", provider, {
      enabled: Boolean(body.enabled),
    });

    const integrations = await getAllIntegrationsSafe();
    return NextResponse.json({ ok: true, integrations });
  } catch (err) {
    console.error("[admin/integrations PUT]", err);
    return NextResponse.json({ error: "Failed to save provider settings." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAuth(["ADMIN"]);
  } catch (e) {
    const code = e instanceof Error && e.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status: code });
  }

  try {
    const body = await req.json();
    const { action, to } = body as { action: "test_email" | "test_sms"; to: string };
    if (!to || !to.trim()) {
      return NextResponse.json({ error: "Recipient is required for test delivery." }, { status: 400 });
    }

    if (action === "test_email") {
      const result = await sendEmail({
        to: to.trim(),
        subject: "CholokLabs SMTP Test Message",
        text: `This is a live SMTP verification email sent by ${admin.fullName} from CholokLabs Admin Dashboard at ${new Date().toISOString()}.`,
        forceEvenIfDisabled: true,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === "test_sms") {
      const result = await sendSms({
        to: to.trim(),
        message: `CholokLabs SMS test verified at ${new Date().toISOString()}.`,
        forceEvenIfDisabled: true,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    return NextResponse.json({ error: "Invalid test action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/integrations POST]", err);
    return NextResponse.json({ error: "Test failed." }, { status: 500 });
  }
}
