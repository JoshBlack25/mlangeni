import { NextResponse } from "next/server";
import { resetTokenStore } from "@/app/api/forgot-password/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverGmail, getGmailConfig } from "@/lib/email/gmail";
import { emailShell } from "@/lib/email/layout";
import { isCrossSiteRequest } from "@/lib/http/sameOrigin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    if (isCrossSiteRequest(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const email: unknown = body?.email;
    const token: unknown = body?.token;
    const password: unknown = body?.password;

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check reset token if provided
    if (typeof token === "string" && token.length > 0) {
      const entry = resetTokenStore.get(token);
      if (entry) {
        if (Date.now() > entry.expiresAt) {
          resetTokenStore.delete(token);
          return NextResponse.json(
            { error: "Reset session expired. Please request a new verification code." },
            { status: 400 },
          );
        }
        if (entry.email !== normalizedEmail) {
          return NextResponse.json(
            { error: "Invalid reset token for this email" },
            { status: 400 },
          );
        }
        resetTokenStore.delete(token);
      }
    }

    // Update password in Supabase via service role admin client
    const admin = createAdminClient();
    if (!admin) {
      console.error(
        "[reset-password] SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local.",
      );
      return NextResponse.json(
        {
          error:
            "Password reset requires SUPABASE_SERVICE_ROLE_KEY in .env.local so the server can update your Supabase account. Please add it and restart your dev server.",
        },
        { status: 500 },
      );
    }

    try {
      // Find the user ID in Supabase
      let userId: string | null = null;

      // 1. Check admin.auth.admin.listUsers()
      const { data, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (!listErr && data?.users) {
        const found = data.users.find(
          (u) => u.email?.toLowerCase().trim() === normalizedEmail,
        );
        if (found) userId = found.id;
      }

      // 2. Fallback check: look up user_id from customer or admin table
      if (!userId) {
        const { data: cust } = await admin
          .from("customer")
          .select("user_id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (cust?.user_id) userId = cust.user_id;
      }

      if (!userId) {
        const { data: adm } = await admin
          .from("admin")
          .select("user_id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (adm?.user_id) userId = adm.user_id;
      }

      if (!userId) {
        return NextResponse.json(
          { error: "No account found matching this email address" },
          { status: 404 },
        );
      }

      // Update the password on Supabase Auth
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateErr) {
        console.error("[reset-password] admin updateUserById failed:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    } catch (adminErr) {
      console.error("[reset-password] unexpected admin operation error:", adminErr);
      return NextResponse.json(
        { error: "Could not update user password in database" },
        { status: 500 },
      );
    }

    // Send confirmation email via Gmail SMTP
    const gmailConfig = getGmailConfig();
    if (gmailConfig.enabled) {
      const html = emailShell({
        preheader: "Your MGH password was successfully reset",
        eyebrow: "Account Security",
        title: "Password updated",
        intro: "Your account password for Mlangeni Grand Hospitality has been changed successfully.",
        bodyHtml: `
          <div style="margin:24px 0;padding:16px;background:#18181b;border-radius:8px;border:1px solid #27272a;">
            <p style="margin:0;font-size:14px;color:#d4d4d8;">
              You can now sign in using your new password. If you did not make this change, please contact our support team immediately.
            </p>
          </div>
        `,
      });

      deliverGmail({
        to: normalizedEmail,
        subject: "Your MGH password was updated successfully",
        html,
      }).catch((mailErr) => console.error("[reset-password] notification email failed:", mailErr));
    }

    return NextResponse.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("[reset-password] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
