"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

function displayName(customer) {
  return `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() || customer?.email || "Customer";
}

export default function ChatPanel({ customerId, onClose, fullScreen = false }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let channel;

    async function loadChat() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const resolvedCustomerId = customerId ??
        (await supabase.from("customer").select("customer_id").eq("user_id", auth.user.id).single()).data?.customer_id;

      if (!resolvedCustomerId) {
        setError("Your customer profile is not ready yet.");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("customer")
        .select("first_name, last_name, email")
        .eq("customer_id", resolvedCustomerId)
        .maybeSingle();
      const { data: conversation, error: conversationError } = await supabase.rpc(
        "get_or_create_chat_conversation",
        { p_customer_id: resolvedCustomerId },
      );

      if (conversationError) {
        if (mounted) {
          setError(
            conversationError.code === "PGRST202"
              ? "Chat is not connected yet. Run db/007_customer_admin_chat.sql in the Supabase SQL editor, then reload this page."
              : conversationError.message,
          );
          setLoading(false);
        }
        return;
      }

      const id = conversation;
      const { data: initialMessages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("message_id, conversation_id, sender_id, body, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (messagesError) setError(messagesError.message);
      setCurrentUserId(auth.user.id);
      setCustomer(profile);
      setConversationId(id);
      setMessages(initialMessages ?? []);
      setLoading(false);

      channel = supabase
        .channel(`chat-messages-${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${id}` },
          (payload) => {
            if (!mounted) return;
            setMessages((current) => current.some((item) => item.message_id === payload.new.message_id) ? current : [...current, payload.new]);
          },
        )
        .subscribe();
    }

    loadChat();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [customerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !conversationId || sending) return;

    setSending(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionData.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ conversationId, body }),
    });
    const result = await response.json();
    setSending(false);

    if (!response.ok) {
      setError(result.error || "Unable to send your message.");
      return;
    }

    setDraft("");
    const sent = result.message;
    setMessages((current) => current.some((item) => item.message_id === sent.message_id) ? current : [...current, sent]);
  }

  function handleComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  }

  return (
    <section className={`flex min-h-0 flex-col border border-[#1F1F1F] bg-[#0B0A09] text-white ${fullScreen ? "h-full w-full" : "h-[min(680px,calc(100vh-120px))] w-full max-w-3xl rounded-2xl shadow-2xl"}`}>
      <header className="flex items-center justify-between border-b border-[#1F1F1F] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"><MessageCircle size={19} /></div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">Mlangeni support</p>
            <h2 className="text-base font-semibold text-white">{customer ? displayName(customer) : "Chat"}</h2>
          </div>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close chat" className="text-[#A0A0A0] transition hover:text-white"><X size={20} /></button>}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {loading ? <p className="text-sm text-[#A0A0A0]">Loading conversation...</p> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-center"><p className="max-w-sm text-sm leading-6 text-[#A0A0A0]">Send a message about your enquiry, consultation, or meeting schedule.</p></div> : messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return <div key={message.message_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] px-4 py-3 text-sm leading-6 ${mine ? "rounded-2xl rounded-br-sm bg-[#D4AF37] text-black" : "rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 text-white"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`mt-1 block text-[10px] ${mine ? "text-black/60" : "text-[#797676]"}`}>{new Date(message.created_at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div></div>;
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="border-t border-red-400/20 bg-red-400/5 px-5 py-2 text-xs text-red-300">{error}</p>}
      <form onSubmit={sendMessage} className="flex items-end gap-3 border-t border-[#1F1F1F] p-4">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Write a message..." maxLength={4000} rows={2} className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#797676] focus:border-[#D4AF37]" />
        <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black transition hover:bg-[#c4a132] disabled:cursor-not-allowed disabled:opacity-40"><Send size={18} /></button>
      </form>
    </section>
  );
}