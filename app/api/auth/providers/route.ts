import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/providers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const google = await getGoogleOAuthConfig();
    return NextResponse.json({
      googleEnabled: Boolean(google.enabled && google.clientId && google.clientSecret),
    });
  } catch {
    return NextResponse.json({ googleEnabled: false });
  }
}
