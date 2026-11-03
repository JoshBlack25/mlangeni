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
  // Polling an unchanged conversation must not jump someone reading history.
  if (merged.size === current.length) return current;
  return [...merged.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

export default function ConsultationChat({
  consultation,
  isAdmin = false,
}) {
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
  const inlineHeight = "h-[min(40rem,80dvh)] min-h-96";
  const { closed, waitingForAdmin, canSend } =
    getConsultationChatState({
      consultation,
      messages,
      userId,
      isAdmin,
      loading,
      conversationId,
    });
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
          ? `${isAdmin ? "" : "mgh-warm "}fixed inset-0 z-[100] flex h-[100dvh] min-w-0 flex-col bg-mgh-surface p-4 text-mgh-text sm:p-6`
          : `flex ${inlineHeight} min-w-0 flex-col rounded-card border border-mgh-line bg-mgh-surface p-5 md:p-7`
      }
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-mgh-line pb-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-mgh-muted">
            Communication
          </p>
          <h2 className="mt-2 font-serif text-title font-medium text-mgh-text">
            Consultation Chat
          </h2>
        </div>
        <button
          ref={expandButtonRef}
          type="button"
          onClick={() => {
            if (!expanded) {
              pagePosition.current = {
                left: window.scrollX,
                top: window.scrollY,
              };
            }
            setExpanded((current) => !current);
          }}
          aria-label={
            expanded ? "Exit full-screen chat" : "Expand consultation chat"
          }
          title={
            expanded ? "Exit full-screen chat" : "Expand consultation chat"
          }
          aria-expanded={expanded}
          aria-haspopup="dialog"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-mgh-gold/20 bg-mgh-gold/10 text-mgh-gold transition hover:bg-mgh-gold hover:text-mgh-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold"
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
        className="min-h-0 flex-1 space-y-3 overflow-y-auto border border-mgh-line bg-mgh-surface-2 p-4"
      >
        {loading ? (
          <p className="text-sm text-mgh-muted">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-mgh-dim">
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
                  className={`max-w-[85%] min-w-0 rounded-control px-4 py-3 text-sm leading-6 ${mine ? "bg-mgh-gold text-mgh-gold-ink" : "border border-mgh-line bg-mgh-surface-2 text-mgh-text"}`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                  <time
                    dateTime={message.created_at}
                    className={`mt-1 block text-[10px] ${mine ? "text-mgh-gold-ink/60" : "text-mgh-dim"}`}
                  >
                    {new Date(message.created_at).toLocaleString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Johannesburg",
                    })}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-mgh-danger">
          {error}
        </p>
      )}
      {!loading && (closed || waitingForAdmin) && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-xs leading-5 text-mgh-muted"
        >
          <LockKeyhole size={15} className="mt-0.5 shrink-0 text-mgh-gold" />
          {closed
            ? "This consultation is closed. You can still read the conversation."
            : "Waiting for the admin's first message."}
        </p>
      )}
      <form onSubmit={sendMessage} className="mt-4 flex items-end gap-3">
        <textarea
          aria-label="Consultation message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
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
          className="min-h-12 min-w-0 flex-1 resize-none rounded-control border border-mgh-line bg-mgh-surface px-4 py-3 text-sm text-mgh-text outline-none transition placeholder:text-mgh-dim focus:border-mgh-gold focus:ring-2 focus:ring-mgh-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          title="Send message"
          aria-label="Send message"
          disabled={!canSend || sending || !draft.trim()}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-mgh-gold text-mgh-gold-ink transition hover:bg-mgh-gold-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold disabled:cursor-not-allowed disabled:opacity-50"
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

// A conversation belongs to one consultation. Any admin can start it, and
// customers can reply only after that first admin message while it is active.
function getConsultationChatState({
  consultation,
  messages,
  userId,
  isAdmin,
  loading,
  conversationId,
}) {
  const customerUserId = isAdmin ? consultation?.customer?.user_id : userId;
  const adminStarted =
    Boolean(customerUserId) &&
    messages.some((message) => message.sender_id !== customerUserId);
  const closed = !isActiveConsultation(consultation);
  const waitingForAdmin = !isAdmin && !adminStarted;
  return {
    adminStarted,
    closed,
    waitingForAdmin,
    canSend:
      !loading &&
      Boolean(userId && conversationId) &&
      !closed &&
      !waitingForAdmin,
  };
}
