import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/services/supabaseConfig";
import { getEmailConfig } from "@/lib/email/config";
import { deliverEmail } from "@/lib/email/send";
import { button, emailShell, sectionTitle } from "@/lib/email/layout";
import { sanitize } from "@/lib/email/theme";

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