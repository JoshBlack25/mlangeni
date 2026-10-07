"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LockKeyhole, Maximize2, Minimize2, Send } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { isActiveConsultation } from "@/app/utils/consultationPresentation";
import { useFocusTrap } from "@/app/components/menu/useFocusTrap";

function mergeMessages(current, incoming) {
  const merged = new Map(
    current.map((message) => [message.message_id, message]),
  );
  for (const message of incoming) merged.set(message.message_id, message);
  if (merged.size === current.length) return current;
  return [...merged.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

export default function ConsultationChat({ consultation, isAdmin = false }) {
  const consultationId = consultation.consultations_id;
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);
  const expandButtonRef = useRef(null);
  const previouslyExpanded = useRef(false);
  const pagePosition = useRef({ left: 0, top: 0 });
  const scrollDistance = useRef(0);
  const messageViewport = useRef(null);
  const inlineHeight = "h-[946px] sm:h-[816px] md:h-[728px] lg:h-[455px]";
  const closed = !isActiveConsultation(consultation);
  const adminStarted = messages.some((message) => message.sender_id !== userId);
  const waitingForAdmin = !isAdmin && !adminStarted;
  const canSend =
    !loading && Boolean(conversationId) && !closed && !waitingForAdmin;
  const closeFullScreen = useCallback(() => setExpanded(false), []);

  useFocusTrap(panelRef, { active: expanded, onEscape: closeFullScreen });

  // Keep the same place in history when switching between viewport sizes.
  useEffect(() => {
    const viewport = messageViewport.current;
    if (viewport) {
      viewport.scrollTop =
        viewport.scrollHeight - viewport.clientHeight - scrollDistance.current;
    }
    if (!expanded && previouslyExpanded.current) {
      window.scrollTo({ ...pagePosition.current, behavior: "instant" });
      expandButtonRef.current?.focus({ preventScroll: true });
    }
    previouslyExpanded.current = expanded;
  }, [expanded]);

  useEffect(() => {
    let mounted = true;
    let channel;
    let timer;
    let refresh;
    let focusListener;

    async function loadChat() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("Please sign in to view this conversation.");

        const { data: id, error: conversationError } = await supabase.rpc(
          "get_or_create_consultation_chat",
          { p_consultation_id: consultationId },
        );
        if (conversationError) {
          throw new Error(
            conversationError.code === "PGRST202"
              ? "Consultation chat is temporarily unavailable. Please try again later."
              : conversationError.message,
          );
        }
        if (!mounted) return;

        refresh = async () => {
          const { data, error: messageError } = await supabase
            .from("chat_messages")
            .select("message_id, sender_id, body, created_at")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });

          if (!mounted) return;
          if (messageError) throw messageError;
          setMessages((current) => mergeMessages(current, data ?? []));
        };

        channel = supabase
          .channel(`consultation-chat-${id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `conversation_id=eq.${id}`,
            },
            (payload) => {
              if (mounted)
                setMessages((current) => mergeMessages(current, [payload.new]));
            },
          )
          .subscribe();

        await refresh();
        if (!mounted) return;
        setUserId(user.id);
        setConversationId(id);
        setLoading(false);

        focusListener = () =>
          refresh().catch((err) => {
            if (mounted)
              setError(err.message || "Unable to refresh this conversation.");
          });
        window.addEventListener("focus", focusListener);
        timer = window.setInterval(() => {
          if (document.visibilityState === "visible") focusListener();
        }, 15000);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load this conversation.");
          setLoading(false);
        }
      }
    }

    loadChat();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      if (timer) window.clearInterval(timer);
      if (focusListener) window.removeEventListener("focus", focusListener);
    };
  }, [consultationId]);

  useEffect(() => {
    const viewport = messageViewport.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!canSend || !body || sending) return;

    setSending(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ conversationId, body }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to send your message.");
      setMessages((current) => mergeMessages(current, [result.message]));
      setDraft("");
    } catch (err) {
      setError(err.message || "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  const chat = (
    <section
      ref={panelRef}
      data-consultation-chat
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "Consultation Chat" : undefined}
      className={
        expanded
          ? "fixed inset-0 z-[100] flex h-[100dvh] min-w-0 flex-col bg-[#101010] p-4 text-white sm:p-6"
          : `flex ${inlineHeight} min-w-0 flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md`
      }
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
            Communication
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Consultation Chat
          </h2>
        </div>
        <button
          ref={expandButtonRef}
          type="button"
          onClick={() => {
            if (!expanded) {
              pagePosition.current = { left: window.scrollX, top: window.scrollY };
            }
            setExpanded((current) => !current);
          }}
          aria-label={expanded ? "Exit full-screen chat" : "Expand consultation chat"}
          title={expanded ? "Exit full-screen chat" : "Expand consultation chat"}
          aria-expanded={expanded}
          aria-haspopup="dialog"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          {expanded ? <Minimize2 size={21} /> : <Maximize2 size={21} />}
        </button>
      </div>

      <div
        ref={messageViewport}
        role="log"
        aria-label="Consultation messages"
        aria-live="polite"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          scrollDistance.current =
            viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto border border-white/10 bg-[#0A0A0A]/50 p-4"
      >
        {loading ? (
          <p className="text-sm text-[#A0A0A0]">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-[#797676]">
              {error ? "Chat is currently unavailable." : "No messages yet."}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === userId;
            return (
              <div
                key={message.message_id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] min-w-0 rounded-lg px-4 py-3 text-sm leading-6 ${mine ? "bg-[#D4AF37] text-black" : "border border-white/10 bg-white/5 text-white"}`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                  <time
                    dateTime={message.created_at}
                    className={`mt-1 block text-[10px] ${mine ? "text-black/60" : "text-[#797676]"}`}
                  >
                    {new Date(message.created_at).toLocaleString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}
      {!loading && (closed || waitingForAdmin) && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#A0A0A0]"
        >
          <LockKeyhole size={15} className="mt-0.5 shrink-0 text-[#D4AF37]" />
          {closed
            ? "Meeting scheduled. This consultation is now read-only."
            : "Waiting for the admin's first message."}
        </p>
      )}
      <form onSubmit={sendMessage} className="mt-4 flex items-end gap-3">
        <textarea
          aria-label="Consultation message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(event);
            }
          }}
          disabled={!canSend || sending}
          placeholder={
            closed
              ? "Consultation closed"
              : waitingForAdmin
                ? "Waiting for the admin"
                : "Write a message..."
          }
          maxLength={4000}
          rows={2}
          className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          title="Send message"
          aria-label="Send message"
          disabled={!canSend || sending || !draft.trim()}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37] text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );

  return expanded ? (
    <>
      <div aria-hidden="true" className={inlineHeight} />
      {createPortal(chat, document.body)}
    </>
  ) : (
    chat
  );
}
