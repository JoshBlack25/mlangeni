import { NextResponse } from "next/server";
import crypto from "crypto";
import { otpStore, resetTokenStore } from "@/app/api/forgot-password/route";
import { isCrossSiteRequest } from "@/lib/http/sameOrigin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const email: unknown = body?.email;
    const code: unknown = body?.code;

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const entry = otpStore.get(normalizedEmail);

    if (!entry) {
      return NextResponse.json({ error: "No code was requested for this email" }, { status: 400 });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }
    if (entry.code !== code) {
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
    }

    // Code is valid — consume it so it can't be reused
    otpStore.delete(normalizedEmail);

    // Generate secure single-use reset token
    const resetToken = crypto.randomUUID();
    resetTokenStore.set(resetToken, {
      email: normalizedEmail,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    return NextResponse.json({ ok: true, resetToken, email: normalizedEmail });
  } catch (err) {
    console.error("[forgot-password/verify] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
