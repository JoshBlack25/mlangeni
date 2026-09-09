import { isDummyOrderConfirmed } from "@/app/utils/dummyInvoicePayments";

export const BLOCKING_ORDER_STATUSES = ["pending"];
export const BOOKED_ORDER_STATUSES = ["confirmed", "in_progress"];

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMinimumEventDate(today = new Date()) {
  const source = new Date(today);
  source.setHours(0, 0, 0, 0);

  const targetYear = source.getFullYear();
  const targetMonth = source.getMonth() + 1;
  const sourceDay = source.getDate();
  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();

  return new Date(
    targetYear,
    targetMonth,
    Math.min(sourceDay, lastDayOfTargetMonth),
  );
}

export function getMinimumEventDateInputValue(today = new Date()) {
  return toDateInputValue(getMinimumEventDate(today));
}

export function isBeforeMinimumEventDate(eventDate, minimumDate) {
  if (!eventDate) return false;

  return eventDate < toDateInputValue(minimumDate);
}

export function formatRuleDate(date) {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getAdvanceBookingMessage(minimumDate) {
  return `Bookings must be made at least one month in advance. Please choose ${formatRuleDate(minimumDate)} or later.`;
}

export function getActiveBookingMessage(activeBooking) {
  const eventName = activeBooking?.event_type?.event_name;
  const date = activeBooking?.event_date;
  const eventText = eventName ? ` for ${eventName}` : "";
  const dateText = date ? ` on ${formatRuleDate(new Date(`${date}T12:00:00`))}` : "";

  return `You already have an active booking${eventText}${dateText}. You can make another booking once this one is cancelled or fully booked.`;
}

export async function getCustomerForUser(supabase, userId) {
  const { data, error } = await supabase
    .from("customer")
    .select("customer_id, first_name, last_name, phone_number, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function getActiveCustomerBooking(supabase, customerId) {
  if (!customerId) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("order_id, status, event_date, event_type(event_name)")
    .eq("customer_id", customerId)
    .in("status", BLOCKING_ORDER_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (isDummyOrderConfirmed(data?.order_id)) {
    return null;
  }

  return data ?? null;
}
