import type { InquiryInput } from "./types";

type Parsed =
  | { ok: true; spam: boolean; value: InquiryInput }
  | { ok: false; error: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseInquiry(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Send the form fields as JSON." };
  const b = body as Record<string, unknown>;

  // Hidden field that real visitors never fill in.
  const spam = str(b.website, 200).length > 0;

  const value: InquiryInput = {
    name: str(b.name, 120),
    email: str(b.email, 200),
    company: str(b.company, 160) || undefined,
    interest: str(b.interest, 160),
    message: str(b.message, 4000),
  };

  if (value.name.length < 2) return { ok: false, error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return { ok: false, error: "Enter a valid email address." };
  if (!value.interest) return { ok: false, error: "Choose what you need help with." };
  if (value.message.length < 10) return { ok: false, error: "Describe your project in at least a sentence." };

  return { ok: true, spam, value };
}
