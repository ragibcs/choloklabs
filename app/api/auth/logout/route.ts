import { NextResponse } from "next/server";
import { destroySession, getCurrentUser, logAudit } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await logAudit(user.id, "auth.logout", "user", user.id);
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
