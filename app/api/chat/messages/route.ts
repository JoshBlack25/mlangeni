import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/services/supabaseConfig";
import { getEmailConfig } from "@/lib/email/config";
import { deliverEmail } from "@/lib/email/send";
import { deliverGmail, getGmailConfig } from "@/lib/email/gmail";
import {
  button,
  detailTable,
  emailShell,
  emailLogoUrl,
  sectionTitle,
} from "@/lib/email/layout";
import { PALETTE, sanitize } from "@/lib/email/theme";

type ProfileRow = Record<string, unknown> | null | undefined;

/** Builds a display name from whichever name columns the row has. */
function displayName(row: ProfileRow): string {
  if (!row) return "";
  const pick = (...keys: string[]) =>
    keys
      .map((key) => row[key])
      .find((value) => typeof value === "string" && value.trim()) as
      | string
      | undefined;

  const first = pick("first_name", "firstName", "name");
  const last = pick("last_name", "lastName", "surname");
  const full = pick("full_name", "fullName", "display_name");

  if (first || last) return [first, last].filter(Boolean).join(" ").trim();
  return full?.trim() ?? "";
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const supabase = authorization?.startsWith("Bearer ")
      ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authorization } },
        })
      : await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { conversationId, body } = await request.json();
    const cleanBody = String(body ?? "").trim();

    if (!conversationId || !cleanBody || cleanBody.length > 4000) {
      return NextResponse.json(
        { error: "A conversation and a message of 1 to 4000 characters are required." },
        { status: 400 },
      );
    }

    const { data: message, error: messageError } = await supabase.rpc(
      "send_chat_message",
      { p_conversation_id: conversationId, p_body: cleanBody },
    );

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 });
    }

    const sentMessage = Array.isArray(message) ? message[0] : message;
<<<<<<< Updated upstream
    const { data: adminRow } = await supabase
      .from("admin")
      .select("admin_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: recipientsData } = await supabase.rpc(
      "get_chat_recipient_emails",
      { p_conversation_id: conversationId },
    );
    const recipients = (recipientsData ?? [])
      .map((recipient: { email?: string | null }) => recipient.email)
      .filter(Boolean);
    const recipientLabel = adminRow ? "there" : "the Mlangeni team";

    const config = getEmailConfig();
    if (config.enabled && recipients.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = emailShell({
        preheader: `New message from ${user.email ?? "your Mlangeni contact"}`,
        eyebrow: "New Chat Message",
        title: "You have a new message",
        intro: `A new message is waiting for you in your Mlangeni dashboard, ${recipientLabel}.`,
        bodyHtml: [
          sectionTitle("Message"),
          `<p style="margin:0;padding:18px 20px;border:1px solid #1e1e1e;background:#0a0a0a;color:#cccccc;font-size:14px;line-height:1.7;white-space:pre-wrap;">${sanitize(cleanBody)}</p>`,
        ].join(""),
        ctaHtml: button(
          `${config.siteUrl || ""}${adminRow ? "/dashboard/customer" : "/dashboard/admin"}`,
          "Open dashboard",
        ),
        footerNote: "Please reply from your dashboard so the conversation stays together.",
      });

      await deliverEmail(
        resend,
        {
          to: recipients,
          subject: "New Mlangeni dashboard message",
          html,
          redirectInSandbox: true,
        },
        config,
        "chat message",
      );
=======
    // Message delivery succeeded. Email is a secondary notification and must
    // not turn a saved message into an apparent failure (and duplicate retry).
    try {
      const { data: adminRow } = await supabase
        .from("admin")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Work out who sent the message so the recipient knows who it's from.
      let senderName = "";
      if (adminRow) {
        senderName = displayName(adminRow);
      } else {
        const { data: customerRow } = await supabase
          .from("customer")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        senderName = displayName(customerRow);
      }
      senderName =
        senderName ||
        displayName(user.user_metadata) ||
        (adminRow ? "The Mlangeni team" : user.email) ||
        "A Mlangeni user";
      const senderEmail = user.email ?? "Not available";
      const senderRole = adminRow ? "Mlangeni Grand Hospitality" : "Customer";

      // Recipients are the logged-in email addresses of the other party:
      // the customer when an admin sends, the admins when a customer sends.
      const { data: recipientsData } = await supabase.rpc(
        "get_chat_recipient_emails",
        { p_conversation_id: conversationId },
      );
      const recipients = (recipientsData ?? [])
        .map((recipient: { email?: string | null }) => recipient.email)
        .filter(Boolean);

      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("consultation_id")
        .eq("conversation_id", conversationId)
        .maybeSingle();
      const recipientBase = adminRow
        ? "/dashboard/customer"
        : "/dashboard/admin";
      const destination = conversation?.consultation_id
        ? `${recipientBase}/consultations/${conversation.consultation_id}`
        : recipientBase;

      const config = getEmailConfig();
      // Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) can deliver to any address
      // without a verified domain, so it's preferred. Resend is the fallback.
      const gmail = getGmailConfig();
      if ((gmail.enabled || config.enabled) && recipients.length > 0) {
        const sentAt = new Date().toLocaleString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          dateStyle: "medium",
          timeStyle: "short",
        });

        const html = emailShell({
          logoUrl: emailLogoUrl(config.siteUrl),
          preheader: `${senderName}: ${cleanBody.slice(0, 90)}`,
          eyebrow: "New Chat Message",
          title: `You have a new message from ${senderName}`,
          intro:
            "Someone has sent you a message in the chat on your Mlangeni dashboard. Here are the details:",
          bodyHtml: [
            sectionTitle("Sent by"),
            detailTable([
              { label: "Name", value: senderName },
              { label: "Email address", value: senderEmail },
              { label: "Account", value: senderRole },
              { label: "Sent on", value: sentAt },
            ]),
            `<div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>`,
            sectionTitle("Message"),
            `<p style="margin:0;padding:18px 20px;border:1px solid #1e1e1e;border-left:3px solid ${PALETTE.gold};background:#0a0a0a;color:#cccccc;font-size:14px;line-height:1.7;white-space:pre-wrap;">${sanitize(cleanBody)}</p>`,
          ].join(""),
          ctaHtml: config.siteUrl
            ? button(`${config.siteUrl}${destination}`, "Reply in your dashboard")
            : "",
          footerNote:
            "Please reply from your dashboard so the conversation stays together.",
        });

        const subject = `New message from ${senderName} – Mlangeni Grand Hospitality`;

        if (gmail.enabled) {
          // Sent straight to the recipient's logged-in email address.
          await deliverGmail({ to: recipients, subject, html });
        } else {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await deliverEmail(
            resend,
            { to: recipients, subject, html, redirectInSandbox: true },
            config,
            "chat message",
          );
        }
      }
    } catch (notificationError) {
      console.error("[chat] email notification failed:", notificationError);
>>>>>>> Stashed changes
    }

    return NextResponse.json({ message: sentMessage });
  } catch (error) {
    console.error("[chat] message route failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send message.",
      },
      { status: 500 },
    );
  }
}