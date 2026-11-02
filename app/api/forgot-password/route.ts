import { NextResponse } from "next/server";
import { deliverGmail, getGmailConfig } from "@/lib/email/gmail";
import { emailShell } from "@/lib/email/layout";
import { isCrossSiteRequest } from "@/lib/http/sameOrigin";
import { isRateLimited, clientIp } from "@/lib/email/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * In-memory OTP store: email → { code, expiresAt }
 * In-memory Reset Token store: token → { email, expiresAt }
 */
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface OtpEntry {
  code: string;
  expiresAt: number;
}

export interface ResetTokenEntry {
  email: string;
  expiresAt: number;
}

// Module-level maps — persist for the lifetime of the server process.
const otpStore = new Map<string, OtpEntry>();
const resetTokenStore = new Map<string, ResetTokenEntry>();

export { otpStore, resetTokenStore };

function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export async function POST(req: Request) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate-limit: max 3 OTP requests per minute per IP
    if (isRateLimited("forgot-password", clientIp(req), { limit: 3, windowMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const email: unknown = body?.email;
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const gmailConfig = getGmailConfig();
    if (!gmailConfig.enabled) {
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 503 },
      );
    }

    // Generate and store OTP
    const code = generateOtp();
    otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + OTP_TTL_MS });

    const html = emailShell({
      preheader: "Your password reset code",
      eyebrow: "Password Reset",
      title: "Your verification code",
      intro: "Use the code below to verify your identity and reset your password. It expires in 10 minutes.",
      bodyHtml: `
        <div style="text-align:center;margin:32px 0;">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#D4AF37;">${code}</span>
        </div>
        <p style="font-size:13px;color:#888;text-align:center;">
          If you did not request this, you can safely ignore this email.
        </p>
      `,
    });

    const result = await deliverGmail({
      to: email,
      subject: "Your MGH password reset code",
      html,
    });

    if (!result.ok) {
      console.error("[forgot-password] Gmail send failed:", result.error);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
