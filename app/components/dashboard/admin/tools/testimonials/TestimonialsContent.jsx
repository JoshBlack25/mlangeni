"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import { isSetupMissing } from "@/services/testimonialsService";
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  SkeletonRows,
  Tabs,
  Field,
  SearchInput,
} from "@/app/components/dashboard/ui";
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
              ? "Thank you. Your review is now live on our website."
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

  const rowProps = (testimonial) => {
    const featuredIndex = featured.findIndex(
      (t) => t.testimonial_id === testimonial.testimonial_id,
    );
    return {
      testimonial,
      busy: busyId === testimonial.testimonial_id,
      onModerate: handleModerate,
      onToggleFeature: handleToggleFeature,
      onMove: handleMove,
      canMoveUp: featuredIndex > 0,
      canMoveDown: featuredIndex >= 0 && featuredIndex < featured.length - 1,
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        className="mb-0 md:mb-0"
        title="Testimonials"
        lead="Reviews written by customers whose events have already happened. Approving one lets the customer see it as published; showing it on the homepage is a separate choice, and only reviews on the homepage appear on the public site."
      />

      {setupMissing && (
        <p className="rounded-card border border-mgh-warn/30 bg-mgh-warn/10 px-4 py-3 text-sm text-mgh-warn">
          Reviews aren&rsquo;t set up in the database yet. Run{" "}
          <code className="font-mono text-xs">
            db/005_testimonials_curation.sql
          </code>{" "}
          in the Supabase SQL editor to switch this on.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-card border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
        >
          {error}
        </p>
      )}

      {/* On the homepage, in order */}
      {!setupMissing && !loading && (
        <Panel density="dense">
          <PanelHeader density="dense" title="On the homepage" />

          {featured.length === 0 ? (
            <p className="text-sm text-mgh-muted">
              Nothing is on the homepage yet, so the testimonial section on the
              public site is showing an invitation instead of reviews. Approve a
              review below and choose &ldquo;Show on homepage&rdquo;.
            </p>
          ) : (
            <ol className="divide-y divide-mgh-line-soft">
              {featured.map((t, i) => (
                <li
                  key={t.testimonial_id}
                  className="flex items-baseline gap-3 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <span className="w-5 shrink-0 text-caption tabular-nums text-mgh-dim">
                    {i + 1}.
                  </span>
                  <span className="shrink-0 font-medium text-mgh-text">
                    {[t.customer?.first_name, t.customer?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Unnamed"}
                  </span>
                  <span className="truncate text-mgh-muted">{t.message}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}

      <Panel density="dense">
        {/* Toolbar: filters + search */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            label="Filter reviews"
            className="lg:flex-1"
            items={FILTERS.map((item) => ({
              value: item,
              label: item,
              count: counts[item] ?? 0,
            }))}
            value={filter}
            onChange={setFilter}
          />
          <Field label="Search reviews" className="w-full lg:mb-2 lg:w-64">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, event or words"
            />
          </Field>
        </div>

        {/* List */}
        {loading ? (
          <SkeletonRows rows={4} label="Loading reviews…" />
        ) : visible.length === 0 ? (
          <EmptyState
            title={
              query
                ? "Nothing matches that search"
                : `No ${filter.toLowerCase()} reviews`
            }
          >
            {query
              ? "Try a different name or phrase."
              : "Reviews appear here once customers whose events have happened write them."}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full border-collapse text-left text-body-dense lg:table">
              <caption className="sr-only">Reviews</caption>
              <thead>
                <tr className="border-b border-mgh-line">
                  {[
                    ["Customer", ""],
                    ["Rating", ""],
                    ["Review", ""],
                    ["Status", ""],
                    ["Homepage", ""],
                    ["Actions", "text-right"],
                  ].map(([header, align]) => (
                    <th
                      key={header}
                      scope="col"
                      className={`h-10 px-3 text-label font-semibold uppercase text-mgh-dim first:pl-0 last:pr-0 ${align}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((testimonial) => (
                  <TestimonialRow
                    key={testimonial.testimonial_id}
                    layout="row"
                    {...rowProps(testimonial)}
                  />
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft lg:hidden">
              {visible.map((testimonial) => (
                <TestimonialRow
                  key={testimonial.testimonial_id}
                  layout="item"
                  {...rowProps(testimonial)}
                />
              ))}
            </ul>
          </>
        )}
      </Panel>

      {/* Toasts */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-4 z-50 flex flex-col gap-2 sm:right-6"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto max-w-sm rounded-control border bg-mgh-surface-2 px-4 py-3 text-sm shadow-modal ${
                toast.variant === "error"
                  ? "border-mgh-danger/40 text-mgh-danger"
                  : "border-mgh-line-strong text-mgh-text"
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
