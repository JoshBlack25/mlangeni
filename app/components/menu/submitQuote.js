/**
 * Writing a menu-builder quote to the database.
 *
 * Extracted from QuoteStep so the submit sequence can be read (and reasoned
 * about) without the JSX around it. Three failure modes are handled here that
 * the old inline version got wrong:
 *
 *  1. The line-item insert failing after the order insert succeeded, leaving an
 *     order with no food in it. Preferably avoided by the create_menu_order
 *     RPC; otherwise compensated for with a delete.
 *  2. `number_of_guest` and `special_requests` never being written at all.
 *  3. An existing customer's edited name or phone never being saved.
 *
 * Everything degrades if `db/00*.sql` hasn't been run.
 */

import { supabase } from "@/services/supabaseClient";
import { computeTotals, guestCount, lineItems } from "./pricing";
import { toDateKey } from "./availability";

export class MenuOrderError extends Error {
  constructor(message, { code, orphanOrderId } = {}) {
    super(message);
    this.name = "MenuOrderError";
    this.code = code;
    this.orphanOrderId = orphanOrderId;
  }
}

const isMissingFunction = (e) =>
  !!e &&
  (String(e.code) === "PGRST202" ||
    String(e.code) === "42883" ||
    /could not find the function|schema cache/i.test(String(e.message ?? "")));

const isMissingColumn = (e, column) =>
  !!e &&
  (String(e.code) === "PGRST204" || String(e.code) === "42703") &&
  String(e.message ?? "").includes(column);

function mapOrderError(err) {
  if (!err) return new MenuOrderError("An unexpected error occurred.");

  if (String(err.code) === "23P01" || /overlap|exclusion/i.test(err.message ?? "")) {
    return new MenuOrderError(
      "That date and time window has just been booked by someone else. Please choose another slot.",
      { code: "23P01" },
    );
  }
  if (String(err.code) === "23503") {
    return new MenuOrderError(
      "Something in your selection is no longer available. Please review your menu.",
      { code: err.code },
    );
  }
  return new MenuOrderError(err.message || "An unexpected error occurred.", {
    code: err.code,
  });
}

function splitName(fullName) {
  const [first, ...rest] = String(fullName ?? "").trim().split(/\s+/);
  return { first_name: first || null, last_name: rest.join(" ") || null };
}

/** Create the customer row if it's missing, or push through any edits. */
async function ensureCustomer(state) {
  const { first_name, last_name } = splitName(state.contactName);
  const phone = state.contactPhone?.trim() || null;

  if (state.existingCustomer?.customer_id) {
    const existing = state.existingCustomer;
    const changed =
      existing.first_name !== first_name ||
      existing.last_name !== last_name ||
      (existing.phone_number || null) !== phone;

    if (changed) {
      // Non-fatal: a booking shouldn't fail because a profile tweak didn't save.
      const { error } = await supabase
        .from("customer")
        .update({ first_name, last_name, phone_number: phone })
        .eq("customer_id", existing.customer_id);
      if (error) {
        console.warn("[menu] could not update customer details:", error.message);
      }
    }
    return existing.customer_id;
  }

  const { data, error } = await supabase
    .from("customer")
    .insert({
      user_id: state.authUser.id,
      email: state.authUser.email,
      first_name,
      last_name,
      phone_number: phone,
    })
    .select("customer_id")
    .single();

  if (error) throw mapOrderError(error);
  return data.customer_id;
}

/** Atomic path — one transaction. Returns null if the RPC isn't installed. */
async function tryCreateViaRpc(payload) {
  const { data, error } = await supabase.rpc("create_menu_order", {
    p_customer_id: payload.customerId,
    p_event_type_id: payload.eventTypeId,
    p_event_date: payload.eventDate,
    p_start_time: payload.startTime,
    p_end_time: payload.endTime,
    p_location: payload.location,
    p_guests: payload.guests,
    p_total_price: payload.totalPrice,
    p_special_requests: payload.notes,
    p_items: payload.items.map((item_id) => ({ item_id })),
  });

  if (error) {
    if (isMissingFunction(error)) return null;
    throw mapOrderError(error);
  }
  return data;
}

/** Fallback path — two inserts, with a compensating delete if the second fails. */
async function createViaInserts(payload) {
  const row = {
    customer_id: payload.customerId,
    event_type_id: payload.eventTypeId,
    status: "pending",
    total_price: payload.totalPrice,
    event_date: payload.eventDate,
    event_location: payload.location,
    start_time: payload.startTime,
    end_time: payload.endTime,
    number_of_guest: payload.guests,
    special_requests: payload.notes,
  };

  let { data: order, error } = await supabase
    .from("orders")
    .insert(row)
    .select("order_id")
    .single();

  // db/001 hasn't been run: retry without the column rather than failing.
  if (isMissingColumn(error, "special_requests")) {
    console.warn(
      "[menu] orders.special_requests is missing — the customer's notes were " +
        "not saved. Run db/001_orders_special_requests.sql.",
    );
    const withoutNotes = { ...row };
    delete withoutNotes.special_requests;
    ({ data: order, error } = await supabase
      .from("orders")
      .insert(withoutNotes)
      .select("order_id")
      .single());
  }

  if (error) throw mapOrderError(error);

  const itemRows = payload.items.map((item_id) => ({
    order_id: order.order_id,
    item_id,
    quantity: payload.guests,
  }));

  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabase
      .from("customer_menu_items")
      .insert(itemRows);

    if (itemsErr) {
      const { error: cleanupErr } = await supabase
        .from("orders")
        .delete()
        .eq("order_id", order.order_id);

      if (cleanupErr) {
        throw new MenuOrderError(
          `Your request was received but the menu items didn't save. ` +
            `Please quote reference #${order.order_id} when you contact us.`,
          { code: itemsErr.code, orphanOrderId: order.order_id },
        );
      }
      throw mapOrderError(itemsErr);
    }
  }

  return order.order_id;
}

/**
 * @returns {Promise<{ orderId, customerId, totals, items }>}
 * @throws {MenuOrderError}
 */
export async function submitMenuOrder(state) {
  if (!state.authUser?.id) {
    throw new MenuOrderError("You need to be signed in to submit a request.");
  }

  const guests = guestCount(state.guests);
  const totals = computeTotals(state.selections, guests);
  const items = lineItems(state.selections, guests);

  const customerId = await ensureCustomer(state);

  const payload = {
    customerId,
    eventTypeId: state.eventTypeId,
    eventDate: toDateKey(state.eventDate),
    startTime: state.startTime,
    endTime: state.endTime,
    location: state.eventLocation?.trim() || null,
    guests,
    totalPrice: totals.total,
    notes: state.notes?.trim() || null,
    items: items.map((r) => r.item.item_id),
  };

  const viaRpc = await tryCreateViaRpc(payload);
  const orderId = viaRpc ?? (await createViaInserts(payload));

  return { orderId, customerId, totals, items };
}
