export const PAYMENT_FAILURE_CANCELLATION_REASON =
  "Cancelled because the invoice was not paid before the due date.";

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function parseDateValue(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(value) {
  const date = parseDateValue(value);

  if (!date) return "";

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function getLatestInvoiceDueDate(eventDate) {
  const date = parseDateValue(eventDate);

  if (!date) return "";

  date.setDate(date.getDate() - 7);

  return toDateInputValue(date);
}

export function getDueDateTimestamp(value) {
  const date = parseDateValue(value);

  if (!date) return new Date().toISOString();

  date.setHours(23, 59, 0, 0);

  return date.toISOString();
}

export function getInvoiceDueDateValidationMessage(dueDate, eventDate) {
  if (!dueDate) {
    return "Please select an invoice due date.";
  }

  const latestAllowedDueDate = getLatestInvoiceDueDate(eventDate);

  if (latestAllowedDueDate && dueDate > latestAllowedDueDate) {
    return `Due date must be on or before ${latestAllowedDueDate}, one week before the event date.`;
  }

  return "";
}

export function isInvoicePastDue(invoice) {
  const status = invoice?.status;

  if (status === "paid" || status === "cancelled") {
    return false;
  }

  const date = parseDateValue(invoice?.due_date ?? invoice?.dueDate);

  if (!date) return false;

  date.setHours(23, 59, 59, 999);

  return date.getTime() < Date.now();
}

export function getRuntimeInvoiceStatus(invoice) {
  if (isInvoicePastDue(invoice)) {
    return "overdue";
  }

  return invoice?.status ?? "pending";
}

export function getPaymentFailureNote(currentNote) {
  if (currentNote?.includes(PAYMENT_FAILURE_CANCELLATION_REASON)) {
    return currentNote;
  }

  return [currentNote?.trim(), PAYMENT_FAILURE_CANCELLATION_REASON]
    .filter(Boolean)
    .join("\n\n");
}
