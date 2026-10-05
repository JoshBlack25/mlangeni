"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareQuote, Search, Star } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import { isSetupMissing } from "@/services/testimonialsService";
import TestimonialRow from "./TestimonialRow";

// Plain table names for the embeds, the form used everywhere else in this app.
// testimonials has exactly one foreign key to each of customer and orders, so
// there is nothing for PostgREST to disambiguate.
//
// customer.user_id is not optional here: sendNotification() addresses the auth
// user, and a testimonial row only carries customer_id. Admins can read it —
// the customer SELECT policy is "own row OR is_admin()".
const T_COLUMNS = `
  testimonial_id, customer_id, order_id, rating, message, status,
  featured, display_order, created_at,
  customer ( user_id, first_name, last_name, email ),
  orders ( event_date, event_type ( event_name ) )
`;

const FILTERS = ["Pending", "Approved", "Rejected", "On homepage", "All"];

export default function TestimonialsContent() {
  const { sendNotification } = useNotifications();

  const [testimonials, setTestimonials] = useState(null);
  const [error, setError] = useState(null);
  const [setupMissing, setSetupMissing] = useState(false);
  const [filter, setFilter] = useState("Pending");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const mountedRef = useRef(true);

  /**
   * Tell the marketing site to rebuild its testimonial section now.
   *
   * The homepage is statically prerendered on a revalidate timer, so without
   * this an approved review would not appear until that window elapsed — which
   * looks exactly like the feature being broken. Fire and forget: the
   * moderation itself has already succeeded in the database, and the page would
   * catch up on the timer regardless.
   */
  const publishHomepage = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/revalidate-testimonials", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch (revalidateError) {
      console.error("Homepage revalidate failed:", revalidateError);
    }
  }, []);

  const pushToast = useCallback((message, variant = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Declared inside the effect, matching EnquiriesContent: a loader hoisted
    // into useCallback trips react-hooks/set-state-in-effect.
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("testimonials")
        .select(T_COLUMNS)
        .order("created_at", { ascending: false });

      if (!mountedRef.current) return;

      if (fetchError) {
        if (isSetupMissing(fetchError)) {
          setSetupMissing(true);
          setTestimonials([]);
          return;
        }
        setError(fetchError.message);
        setTestimonials([]);
        return;
      }

      setError(null);
      setTestimonials(data ?? []);
    }

    load();

    const channel = supabase.channel("admin-testimonials");

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "testimonials" },
        async (payload) => {
          if (!mountedRef.current) return;
          // Realtime payloads carry the RAW row only — there is no
          // customer/orders embed on payload.new — so the row has to be
          // re-read with the joins before it is usable.
          const { data } = await supabase
            .from("testimonials")
            .select(T_COLUMNS)
            .eq("testimonial_id", payload.new.testimonial_id)
            .single();
          if (!mountedRef.current || !data) return;
          setTestimonials((prev) =>
            prev?.some((t) => t.testimonial_id === data.testimonial_id)
              ? prev
              : [data, ...(prev ?? [])],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "testimonials" },
        (payload) => {
          if (!mountedRef.current) return;
          // Merge rather than replace, so the embed already in state survives.
          setTestimonials((prev) =>
            (prev ?? []).map((t) =>
              t.testimonial_id === payload.new.testimonial_id
                ? { ...t, ...payload.new }
                : t,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "testimonials" },
        (payload) => {
          if (!mountedRef.current) return;
          setTestimonials((prev) =>
            (prev ?? []).filter(
              (t) => t.testimonial_id !== payload.old.testimonial_id,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const featured = useMemo(
    () =>
      (testimonials ?? [])
        .filter((t) => t.featured && t.status === "approved")
        .sort(
          (a, b) =>
            (a.display_order ?? 0) - (b.display_order ?? 0) ||
            new Date(b.created_at) - new Date(a.created_at),
        ),
    [testimonials],
  );

  const counts = useMemo(() => {
    const list = testimonials ?? [];
    return {
      Pending: list.filter((t) => t.status === "pending").length,
      Approved: list.filter((t) => t.status === "approved").length,
      Rejected: list.filter((t) => t.status === "rejected").length,
      "On homepage": featured.length,
      All: list.length,
    };
  }, [testimonials, featured]);

  const visible = useMemo(() => {
    let list = testimonials ?? [];

    if (filter === "On homepage") list = featured;
    else if (filter !== "All")
      list = list.filter((t) => t.status === filter.toLowerCase());

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((t) => {
      const name = [t.customer?.first_name, t.customer?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(q) ||
        (t.customer?.email ?? "").toLowerCase().includes(q) ||
        (t.message ?? "").toLowerCase().includes(q)
      );
    });
  }, [testimonials, featured, filter, query]);

  function patchLocal(id, changes) {
    setTestimonials((prev) =>
      (prev ?? []).map((t) =>
        t.testimonial_id === id ? { ...t, ...changes } : t,
      ),
    );
  }

  async function handleModerate(testimonial, status, alsoFeature) {
    const previous = testimonials;
    setBusyId(testimonial.testimonial_id);

    // Rejecting must clear `featured` in the same statement. Leaving it set
    // would strand a row that the admin's "On homepage" filter still counts
    // but get_public_testimonials will never return, since it requires
    // status = 'approved'.
    const changes = {
      status,
      featured: status === "approved" ? alsoFeature : false,
      display_order:
        status === "approved" && alsoFeature
          ? nextDisplayOrder(featured)
          : testimonial.display_order,
    };

    patchLocal(testimonial.testimonial_id, changes);

    const { error: updateError } = await supabase
      .from("testimonials")
      .update(changes)
      .eq("testimonial_id", testimonial.testimonial_id);

    setBusyId(null);

    if (updateError) {
      setTestimonials(previous);
      // 23505 = idx_testimonials_one_review_per_order. Rejected reviews are
      // excluded from that index so the customer can write a replacement — so
      // un-rejecting one whose event has since been reviewed again can never
      // succeed, and "please try again" would be a lie.
      if (updateError.code === "23505") {
        pushToast(
          "This customer has already written another review for the same event, so this one can't be approved. Reject the newer one first.",
          "error",
        );
        return;
      }
      pushToast("Couldn't update that review. Please try again.", "error");
      return;
    }

    pushToast(
      status === "approved"
        ? alsoFeature
          ? "Approved and added to the homepage."
          : "Approved."
        : "Review rejected.",
    );

    publishHomepage();

    // Fire and forget — the moderation already succeeded.
    const recipientId = testimonial.customer?.user_id;
    if (recipientId) {
      try {
        await sendNotification({
          recipientId,
          category: "general",
          title:
            status === "approved"
              ? "Review: yours has been published"
              : "Review: yours wasn't published",
          message:
            status === "approved"
              ? "Thank you — your review is now live on our website."
              : "Thanks for writing in. We weren't able to publish this one.",
          linkUrl: "/dashboard/customer/reviews",
        });
      } catch (notifyError) {
        console.error("Testimonial notify threw:", notifyError);
      }
    }
  }

  async function handleToggleFeature(testimonial) {
    const nextFeatured = !testimonial.featured;
    const previous = testimonials;
    setBusyId(testimonial.testimonial_id);

    const changes = {
      featured: nextFeatured,
      display_order: nextFeatured
        ? nextDisplayOrder(featured)
        : testimonial.display_order,
    };

    patchLocal(testimonial.testimonial_id, changes);

    const { error: updateError } = await supabase
      .from("testimonials")
      .update(changes)
      .eq("testimonial_id", testimonial.testimonial_id);

    setBusyId(null);

    if (updateError) {
      setTestimonials(previous);
      pushToast("Couldn't change that. Please try again.", "error");
      return;
    }

    pushToast(
      nextFeatured ? "Added to the homepage." : "Removed from the homepage.",
    );

    publishHomepage();
  }

  async function handleMove(testimonial, delta) {
    const index = featured.findIndex(
      (t) => t.testimonial_id === testimonial.testimonial_id,
    );
    const target = featured[index + delta];
    if (!target) return;

    const previous = testimonials;
    setBusyId(testimonial.testimonial_id);

    // A swap of two rows, not a rewrite of the list. `display_order` has no
    // UNIQUE constraint precisely because these two updates are not atomic and
    // the intermediate state has both rows on the same number.
    const a = testimonial.display_order ?? 0;
    const b = target.display_order ?? 0;
    const aNew = a === b ? (delta < 0 ? b - 1 : b + 1) : b;

    patchLocal(testimonial.testimonial_id, { display_order: aNew });
    patchLocal(target.testimonial_id, { display_order: a });

    const [first, second] = await Promise.all([
      // Not .upsert() — PostgREST sends a full INSERT ... ON CONFLICT, and a
      // partial row would violate NOT NULL on customer_id, rating and message.
      supabase
        .from("testimonials")
        .update({ display_order: aNew })
        .eq("testimonial_id", testimonial.testimonial_id),
      supabase
        .from("testimonials")
        .update({ display_order: a })
        .eq("testimonial_id", target.testimonial_id),
    ]);

    setBusyId(null);

    if (first.error || second.error) {
      setTestimonials(previous);
      pushToast("Couldn't reorder. Please try again.", "error");
      return;
    }

    publishHomepage();
  }

  const loading = testimonials === null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Testimonials
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0]">
          Reviews written by customers whose events have already happened.
          Approving one lets the customer see it as published; showing it on the
          homepage is a separate choice, and only reviews on the homepage appear
          on the public site.
        </p>
      </header>

      {setupMissing && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Reviews aren&rsquo;t set up in the database yet. Run{" "}
          <code className="font-mono text-xs">
            db/005_testimonials_curation.sql
          </code>{" "}
          in the Supabase SQL editor to switch this on.
        </p>
      )}

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* On the homepage, in order */}
      {!setupMissing && !loading && (
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-[#A0A0A0]">
            <Star size={13} className="text-[#D4AF37]" />
            On the homepage
          </h2>

          {featured.length === 0 ? (
            <p className="mt-3 text-sm text-[#797676]">
              Nothing is on the homepage yet, so the testimonial section on the
              public site is showing an invitation instead of reviews. Approve a
              review below and choose &ldquo;Show on homepage&rdquo;.
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {featured.map((t, i) => (
                <li
                  key={t.testimonial_id}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="w-5 shrink-0 text-xs text-[#D4AF37]">
                    {i + 1}.
                  </span>
                  <span className="shrink-0 text-white">
                    {[t.customer?.first_name, t.customer?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Unnamed"}
                  </span>
                  <span className="truncate text-[#797676]">{t.message}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-1">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`relative px-4 py-2 text-sm transition-colors ${
              filter === item ? "text-[#D4AF37]" : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            {item}
            <span className="ml-1.5 text-xs opacity-60">{counts[item] ?? 0}</span>
            {filter === item && (
              <motion.span
                // Must differ from the enquiries screen's layoutId, or the two
                // underlines animate into each other when both are mounted.
                layoutId="testimonial-filter"
                className="absolute inset-x-2 -bottom-px h-px bg-[#D4AF37]"
              />
            )}
          </button>
        ))}

        <div className="relative ml-auto">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#797676]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews"
            aria-label="Search reviews"
            className="w-56 rounded-lg border border-[#1F1F1F] bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-[#797676] outline-none transition focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <MessageSquareQuote className="mx-auto mb-4 text-[#D4AF37]" size={26} />
          <h2 className="text-base font-semibold text-white">
            {query ? "Nothing matches that search" : `No ${filter.toLowerCase()} reviews`}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#A0A0A0]">
            {query
              ? "Try a different name or phrase."
              : "Reviews appear here once customers whose events have happened write them."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((testimonial) => {
              const featuredIndex = featured.findIndex(
                (t) => t.testimonial_id === testimonial.testimonial_id,
              );
              return (
                <motion.div
                  key={testimonial.testimonial_id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <TestimonialRow
                    testimonial={testimonial}
                    busy={busyId === testimonial.testimonial_id}
                    onModerate={handleModerate}
                    onToggleFeature={handleToggleFeature}
                    onMove={handleMove}
                    canMoveUp={featuredIndex > 0}
                    canMoveDown={
                      featuredIndex >= 0 && featuredIndex < featured.length - 1
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${
                toast.variant === "error"
                  ? "border-red-500/30 bg-[#1a0f0f] text-red-200"
                  : "border-[#D4AF37]/30 bg-[#12100a] text-[#D4AF37]"
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Next free slot at the end of the featured list. */
function nextDisplayOrder(featured) {
  if (featured.length === 0) return 0;
  return Math.max(...featured.map((t) => t.display_order ?? 0)) + 1;
}
