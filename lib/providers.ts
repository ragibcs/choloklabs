import nodemailer from "nodemailer";
import { query } from "./db";
import { decryptJson, encryptJson, maskSecret } from "./crypto";

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface SmsConfig {
  enabled: boolean;
  provider: "twilio" | "vonage" | "webhook";
  accountSid: string;
  authToken: string;
  fromNumber: string;
  webhookUrl: string;
}

export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  allowSignup: boolean;
  allowedDomain: string;
}

export async function getIntegrationRaw(key: "smtp" | "sms" | "google_oauth") {
  const { rows } = await query<{
    key: string;
    enabled: boolean;
    config_json: Record<string, unknown>;
    secrets_encrypted: string | null;
    updated_at: string;
  }>(`SELECT key, enabled, config_json, secrets_encrypted, updated_at FROM integration_settings WHERE key = $1`, [
    key,
  ]);
  const row = rows[0];
  if (!row) {
    return { enabled: false, config: {} as Record<string, unknown>, secrets: {} as Record<string, string>, updatedAt: null };
  }
  return {
    enabled: row.enabled,
    config: row.config_json || {},
    secrets: decryptJson(row.secrets_encrypted),
    updatedAt: row.updated_at,
  };
}

export async function getAllIntegrationsSafe() {
  const [smtp, sms, google] = await Promise.all([
    getIntegrationRaw("smtp"),
    getIntegrationRaw("sms"),
    getIntegrationRaw("google_oauth"),
  ]);

  return {
    smtp: {
      enabled: smtp.enabled,
      host: String(smtp.config.host || ""),
      port: Number(smtp.config.port || 587),
      secure: Boolean(smtp.config.secure),
      username: String(smtp.config.username || ""),
      hasPassword: Boolean(smtp.secrets.password),
      passwordMasked: maskSecret(smtp.secrets.password),
      fromName: String(smtp.config.fromName || "CholokLabs"),
      fromEmail: String(smtp.config.fromEmail || ""),
      updatedAt: smtp.updatedAt,
    },
    sms: {
      enabled: sms.enabled,
      provider: (String(sms.config.provider || "twilio") as "twilio" | "vonage" | "webhook"),
      accountSid: String(sms.config.accountSid || ""),
      hasAuthToken: Boolean(sms.secrets.authToken),
      authTokenMasked: maskSecret(sms.secrets.authToken),
      fromNumber: String(sms.config.fromNumber || ""),
      webhookUrl: String(sms.config.webhookUrl || ""),
      updatedAt: sms.updatedAt,
    },
    google_oauth: {
      enabled: google.enabled,
      clientId: String(google.config.clientId || ""),
      hasClientSecret: Boolean(google.secrets.clientSecret),
      clientSecretMasked: maskSecret(google.secrets.clientSecret),
      allowSignup: google.config.allowSignup !== false,
      allowedDomain: String(google.config.allowedDomain || ""),
      updatedAt: google.updatedAt,
    },
  };
}

export async function saveIntegration(
  key: "smtp" | "sms" | "google_oauth",
  enabled: boolean,
  config: Record<string, unknown>,
  newSecrets: Record<string, string | undefined>,
  updatedBy: string
) {
  const existing = await getIntegrationRaw(key);
  const mergedSecrets: Record<string, string> = { ...existing.secrets };
  for (const [k, v] of Object.entries(newSecrets)) {
    if (typeof v === "string" && v.trim() !== "") {
      mergedSecrets[k] = v.trim();
    }
  }
  const encrypted = encryptJson(mergedSecrets);

  await query(
    `INSERT INTO integration_settings (key, enabled, config_json, secrets_encrypted, updated_by, updated_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, NOW())
     ON CONFLICT (key) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       config_json = EXCLUDED.config_json,
       secrets_encrypted = EXCLUDED.secrets_encrypted,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [key, enabled, JSON.stringify(config), encrypted, updatedBy]
  );
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  forceEvenIfDisabled?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const smtp = await getIntegrationRaw("smtp");
  if (!smtp.enabled && !opts.forceEvenIfDisabled) {
    return { ok: false, error: "SMTP email provider is not enabled." };
  }
  const host = String(smtp.config.host || "");
  const port = Number(smtp.config.port || 587);
  const secure = Boolean(smtp.config.secure);
  const user = String(smtp.config.username || "");
  const pass = smtp.secrets.password || "";
  const fromName = String(smtp.config.fromName || "CholokLabs");
  const fromEmail = String(smtp.config.fromEmail || user || "no-reply@choloklabs.com");

  if (!host) {
    return { ok: false, error: "SMTP host is not configured." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });

    await query(
      `INSERT INTO notification_logs (channel, recipient, subject, status, provider)
       VALUES ('email', $1, $2, 'sent', $3)`,
      [opts.to, opts.subject, host]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    await query(
      `INSERT INTO notification_logs (channel, recipient, subject, status, error_message, provider)
       VALUES ('email', $1, $2, 'failed', $3, $4)`,
      [opts.to, opts.subject, message, host]
    );
    return { ok: false, error: message };
  }
}

export async function sendSms(opts: {
  to: string;
  message: string;
  forceEvenIfDisabled?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const sms = await getIntegrationRaw("sms");
  if (!sms.enabled && !opts.forceEvenIfDisabled) {
    return { ok: false, error: "SMS provider is not enabled." };
  }

  const provider = String(sms.config.provider || "twilio");
  const accountSid = String(sms.config.accountSid || "");
  const authToken = sms.secrets.authToken || "";
  const fromNumber = String(sms.config.fromNumber || "");
  const webhookUrl = String(sms.config.webhookUrl || "");

  try {
    if (provider === "twilio") {
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio Account SID, Auth Token, and From Number are required.");
      }
      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
      const body = new URLSearchParams({
        To: opts.to,
        From: fromNumber,
        Body: opts.message,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Twilio error (${res.status}): ${txt.slice(0, 200)}`);
      }
    } else if (provider === "vonage") {
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Vonage API Key, API Secret, and From Sender are required.");
      }
      const res = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: accountSid,
          api_secret: authToken,
          from: fromNumber,
          to: opts.to,
          text: opts.message,
        }),
      });
      const data = (await res.json()) as { messages?: Array<{ status?: string; "error-text"?: string }> };
      const first = data.messages?.[0];
      if (!res.ok || (first && first.status !== "0")) {
        throw new Error(first?.["error-text"] || `Vonage error (${res.status})`);
      }
    } else {
      if (!webhookUrl) {
        throw new Error("Custom SMS Webhook URL is required.");
      }
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          to: opts.to,
          from: fromNumber,
          message: opts.message,
          apiKey: accountSid,
        }),
      });
      if (!res.ok) {
        throw new Error(`SMS webhook responded with ${res.status}`);
      }
    }

    await query(
      `INSERT INTO notification_logs (channel, recipient, subject, status, provider)
       VALUES ('sms', $1, $2, 'sent', $3)`,
      [opts.to, opts.message.slice(0, 80), provider]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMS send failed";
    await query(
      `INSERT INTO notification_logs (channel, recipient, subject, status, error_message, provider)
       VALUES ('sms', $1, $2, 'failed', $3, $4)`,
      [opts.to, opts.message.slice(0, 80), message, provider]
    );
    return { ok: false, error: message };
  }
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  const g = await getIntegrationRaw("google_oauth");
  return {
    enabled: g.enabled,
    clientId: String(g.config.clientId || ""),
    clientSecret: g.secrets.clientSecret || "",
    allowSignup: g.config.allowSignup !== false,
    allowedDomain: String(g.config.allowedDomain || ""),
  };
}
