import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/services/supabaseConfig";
import { deliverGmail, getGmailConfig } from "@/lib/email/gmail";
import { chatMessageEmail } from "@/lib/email/chatMessage";
import { SITE_URL } from "@/lib/site";

// nodemailer needs the Node.js runtime (not Edge) on Vercel.
export const runtime = "nodejs";

function fullName(person?: {
  first_name?: string | null;
  last_name?: string | null;
} | null): string {
  return `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
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
        {
          error:
            "A conversation and a message of 1 to 4000 characters are required.",
        },
        { status: 400 },
      );
    }

    const { data: message, error: messageError } = await supabase.rpc(
      "send_chat_message",
      { p_conversation_id: conversationId, p_body: cleanBody },
    );

    if (messageError) {
      return NextResponse.json(
        { error: messageError.message },
        { status: 400 },
      );
    }

    const sentMessage = Array.isArray(message) ? message[0] : message;
    // Message delivery succeeded. Email is a secondary notification and must
    // not turn a saved message into an apparent failure (and duplicate retry).
    // Sent through Gmail SMTP (GMAIL_USER / GMAIL_APP_PASSWORD) because the
    // site has no verified domain for Resend.
    try {
      const gmailConfig = getGmailConfig();
      if (!gmailConfig.enabled) {
        console.warn(
          "[chat] email skipped: set GMAIL_USER and GMAIL_APP_PASSWORD to send chat notifications.",
        );
      } else {
        const { data: adminRow } = await supabase
          .from("admin")
          .select("admin_id, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();

        let senderName = fullName(adminRow);
        if (!adminRow) {
          const { data: customerRow } = await supabase
            .from("customer")
            .select("first_name, last_name, email")
            .eq("user_id", user.id)
            .maybeSingle();
          senderName =
            fullName(customerRow) || customerRow?.email || user.email || "";
        }
        senderName =
          senderName || (adminRow ? "The Mlangeni team" : "A customer");

        const { data: recipientsData } = await supabase.rpc(
          "get_chat_recipient_emails",
          { p_conversation_id: conversationId },
        );
        const recipients: string[] = Array.from(
          new Set(
            (recipientsData ?? [])
              .map((recipient: { email?: string | null }) =>
                recipient.email?.trim().toLowerCase(),
              )
              .filter(
                (email: string | undefined): email is string =>
                  Boolean(email) && email !== user.email?.toLowerCase(),
              ),
          ),
        );

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

        if (recipients.length > 0) {
          const { subject, html } = chatMessageEmail({
            senderName,
            senderIsAdmin: Boolean(adminRow),
            body: cleanBody,
            sentAt: sentMessage?.created_at,
            conversationUrl: `${SITE_URL}${destination}`,
            logoUrl: `${SITE_URL}/logos/logo2.png`,
          });

          // One email per recipient so admins don't see each other's address.
          const results = await Promise.all(
            recipients.map((to) => deliverGmail({ to, subject, html })),
          );
          const failed = results.filter((result) => !result.ok).length;
          if (failed > 0) {
            console.error(
              `[chat] ${failed} of ${recipients.length} notification emails failed.`,
            );
          }
        }
      }
    } catch (notificationError) {
      console.error("[chat] email notification failed:", notificationError);
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
