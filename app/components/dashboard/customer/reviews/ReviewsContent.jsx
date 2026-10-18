"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import { isSetupMissing } from "@/services/testimonialsService";
import ReviewForm from "./ReviewForm";
import ReviewCard from "./ReviewCard";
import { EASE } from "@/app/components/dashboard/shared/motion";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/app/components/dashboard/ui";

const REVIEW_COLUMNS =
  "testimonial_id, order_id, rating, message, status, featured, created_at";

/** "Wedding — 4 March 2026" */
function orderLabel(order) {
  const name = order?.event_type?.event_name ?? "Event";
  const date = order?.event_date
    ? new Date(order.event_date).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  return date ? `${name}, ${date}` : name;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReviewsContent() {
  const { notifyAllAdmins } = useNotifications();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState(null);
  const [reviews, setReviews] = useState(null);

  const [loadError, setLoadError] = useState(null);
  const [setupMissing, setSetupMissing] = useState(false);

  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Failures from actions that happen outside the form, which therefore have
  // nowhere in ReviewForm to be displayed.
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Bumped to re-run the loader below — for example when an admin moderates a
  // review out from under an edit that is in flight.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    // Declared inside the effect, matching the other dashboard screens: a
    // loader hoisted into useCallback trips react-hooks/set-state-in-effect.
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      // The layout's useRoleGuard("customer") has already redirected anyone who
      // is not signed in, so this only fires if the session dropped.
      if (!user) {
        setLoadError("You need to be signed in to leave a review.");
        setOrders([]);
        setReviews([]);
        return;
      }

      const { data: customerRow, error: customerError } = await supabase
        .from("customer")
        .select("customer_id, first_name, last_name")
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (customerError || !customerRow) {
        setLoadError(
          "We couldn't find your customer profile. Finish setting it up and try again.",
        );
        setOrders([]);
        setReviews([]);
        return;
      }

      setCustomer(customerRow);

      const [ordersRes, reviewsRes] = await Promise.all([
        // Every order, not just reviewable ones — knowing about an upcoming
        // event lets the empty state say something useful instead of
        // "nothing here".
        supabase
          .from("orders")
          .select("order_id, event_date, status, event_type(event_name)")
          .eq("customer_id", customerRow.customer_id)
          .order("event_date", { ascending: false }),
        supabase
          .from("testimonials")
          .select(REVIEW_COLUMNS)
          .eq("customer_id", customerRow.customer_id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (ordersRes.error) {
        setLoadError(ordersRes.error.message);
        setOrders([]);
        setReviews([]);
        return;
      }

      setOrders(ordersRes.data ?? []);

      if (reviewsRes.error) {
        // A missing `featured` column means db/005 has not been run. That is a
        // setup state, not an error the customer should see as a red box.
        if (isSetupMissing(reviewsRes.error)) {
          setSetupMissing(true);
          setReviews([]);
          return;
        }
        setLoadError(reviewsRes.error.message);
        setReviews([]);
        return;
      }

      setLoadError(null);
      setReviews(reviewsRes.data ?? []);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const loading = orders === null || reviews === null;

  // An order is reviewable once the event has happened and was not cancelled —
  // the same rule customer_may_review() enforces in the database. Orders are
  // never marked 'completed' anywhere in this app, so event_date is the honest
  // signal. See the header of db/005_testimonials_curation.sql.
  const { reviewable, upcoming } = useMemo(() => {
    if (!orders || !reviews) return { reviewable: [], upcoming: [] };

    const today = todayISO();
    const reviewedOrderIds = new Set(
      reviews
        .filter((r) => r.status !== "rejected")
        .map((r) => r.order_id)
        .filter(Boolean),
    );

    const past = orders.filter(
      (o) => o.status !== "cancelled" && o.event_date && o.event_date < today,
    );

    return {
      reviewable: past
        .filter((o) => !reviewedOrderIds.has(o.order_id))
        .map((o) => ({ ...o, label: orderLabel(o) })),
      upcoming: orders.filter(
        (o) => o.status !== "cancelled" && o.event_date && o.event_date >= today,
      ),
    };
  }, [orders, reviews]);

  const orderLabelById = useMemo(() => {
    const map = new Map();
    (orders ?? []).forEach((o) => map.set(o.order_id, orderLabel(o)));
    return map;
  }, [orders]);

  async function handleSubmit({ orderId, rating, message }) {
    if (!customer) return;

    setSubmitting(true);
    setSubmitError(null);
    setActionError(null);

    if (editing) {
      const { data, error } = await supabase
        .from("testimonials")
        .update({ rating, message })
        .eq("testimonial_id", editing.testimonial_id)
        .eq("status", "pending")
        .select(REVIEW_COLUMNS)
        .single();

      setSubmitting(false);

      if (error) {
        // PGRST116 = no row came back, which here means an admin moderated it
        // between page load and save. A raw error string reads like a crash.
        if (error.code === "PGRST116") {
          setSubmitError(
            "One of our team has already looked at this review, so it can no longer be edited.",
          );
          setEditing(null);
          reload();
          return;
        }
        setSubmitError(error.message);
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.testimonial_id === data.testimonial_id ? data : r,
        ),
      );
      setEditing(null);
      setNotice("Your review has been updated.");
      return;
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert({
        customer_id: customer.customer_id,
        order_id: orderId,
        rating,
        message,
      })
      .select(REVIEW_COLUMNS)
      .single();

    setSubmitting(false);

    if (error) {
      // RLS rejects with a generic message. The form only offers eligible
      // events, so this is an edge case — but it should still read like a
      // sentence rather than a Postgres string.
      if (error.code === "42501" || /row-level security/i.test(error.message)) {
        setSubmitError(
          "You can only review an event we've already catered for. Try reloading the page.",
        );
        return;
      }
      if (error.code === "23505") {
        setSubmitError("You've already reviewed this event.");
        return;
      }
      setSubmitError(error.message);
      return;
    }

    setReviews((prev) => [data, ...prev]);
    setNotice("Thank you. Your review is with our team for approval.");

    // Never gate success on the notification. If it fails the review is still
    // saved, and the customer should not be told otherwise.
    try {
      const result = await notifyAllAdmins({
        category: "general",
        title: "Review: new one awaiting moderation",
        message: `${customer.first_name ?? "A customer"} left a ${rating}-star review.`,
        linkUrl: "/dashboard/admin/tools/testimonials",
      });
      if (result?.error) console.error("Testimonial notify failed:", result.error);
    } catch (notifyError) {
      console.error("Testimonial notify threw:", notifyError);
    }
  }

  async function handleDelete(review) {
    setConfirmDelete(null);
    setActionError(null);

    const previous = reviews;
    setReviews((prev) =>
      prev.filter((r) => r.testimonial_id !== review.testimonial_id),
    );

    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("testimonial_id", review.testimonial_id);

    if (error) {
      setReviews(previous);
      setNotice(null);
      // Not submitError — that is only rendered inside ReviewForm, and a
      // delete can happen with no form on screen, which would make the failure
      // silent while the row reappeared.
      setActionError("We couldn't delete that review. Please try again.");
      return;
    }

    if (editing?.testimonial_id === review.testimonial_id) setEditing(null);
    setNotice("Review deleted.");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <PageHeader
        title="Your reviews"
        lead={
          <>
            Reviews on our website come only from guests we&rsquo;ve actually
            catered for. Once one of our team has approved yours, it may appear
            on the homepage.
          </>
        }
      />

      {notice && (
        <p
          role="status"
          className="mb-8 flex items-center gap-2.5 rounded-control border border-mgh-line bg-mgh-surface px-4 py-3 text-sm text-mgh-text"
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-mgh-ok" />
          {notice}
        </p>
      )}

      {(loadError || actionError) && (
        <p
          role="alert"
          className="mb-8 rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
        >
          {loadError ?? actionError}
        </p>
      )}

      {setupMissing && (
        <p className="mb-8 rounded-control border border-mgh-line bg-mgh-surface px-4 py-3 text-sm text-mgh-muted">
          Reviews aren&rsquo;t switched on yet. Please check back soon.
        </p>
      )}

      {loading ? (
        <Panel role="status">
          <span className="sr-only">Loading your reviews…</span>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <div className="mt-8 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Panel>
      ) : (
        <div className="flex flex-col gap-8 md:gap-10">
          {/* Write / edit */}
          {/* ReviewForm seeds its fields from props on mount only, so each
              distinct form needs its own key. Without one, switching from
              editing review A to review B would save A's text onto B, and the
              create form would keep pointing at an event just reviewed. */}
          {!setupMissing && editing && (
            <ReviewForm
              key={`edit-${editing.testimonial_id}`}
              orders={reviewable}
              initial={{
                ...editing,
                orderLabel: orderLabelById.get(editing.order_id),
              }}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditing(null);
                setSubmitError(null);
              }}
              submitting={submitting}
              error={submitError}
            />
          )}

          {!setupMissing && !editing && reviewable.length > 0 && (
            <ReviewForm
              key={`new-${reviewable[0]?.order_id ?? "none"}-${reviews.length}`}
              orders={reviewable}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={submitError}
            />
          )}

          {/* Nothing to review yet — say why, not just "nothing here" */}
          {!setupMissing && !editing && reviewable.length === 0 && (
            <Panel>
              {upcoming.length > 0 ? (
                <EmptyState title="Not just yet">
                  Your {orderLabel(upcoming[0])} is still to come. Reviews open
                  up once we&rsquo;ve catered the event.
                </EmptyState>
              ) : reviews.length > 0 ? (
                <EmptyState title={<>You&rsquo;ve reviewed every event</>}>
                  Thank you. That genuinely helps other guests decide.
                </EmptyState>
              ) : (
                <EmptyState
                  title="No events to review yet"
                  action={
                    <Button href="/dashboard/customer/booking">
                      Plan an event
                    </Button>
                  }
                >
                  Once we&rsquo;ve catered an event for you, you&rsquo;ll be
                  able to review it here.
                </EmptyState>
              )}
            </Panel>
          )}

          {/* Existing reviews */}
          {reviews.length > 0 && (
            <Panel>
              <PanelHeader title={<>Reviews you&rsquo;ve left</>} />
              <div className="divide-y divide-mgh-line-soft">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.testimonial_id}
                    review={review}
                    orderLabel={orderLabelById.get(review.order_id)}
                    onEdit={(r) => {
                      setEditing(r);
                      setSubmitError(null);
                      setNotice(null);
                    }}
                    onDelete={(r) => setConfirmDelete(r)}
                  />
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
        title="Delete this review?"
        description={
          <>
            This can&rsquo;t be undone. You can write a new review for the same
            event afterwards.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={() => handleDelete(confirmDelete)}
      />
    </motion.div>
  );
}
