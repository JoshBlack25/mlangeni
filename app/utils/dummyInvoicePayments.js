const DUMMY_PAID_INVOICES_KEY = "mgh_dummy_paid_invoices";
const DUMMY_PAYMENT_EVENT = "mgh-dummy-invoice-payments-changed";

function readDummyPaidInvoices() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(DUMMY_PAID_INVOICES_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeDummyPaidInvoices(invoices) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    DUMMY_PAID_INVOICES_KEY,
    JSON.stringify(invoices),
  );
  window.dispatchEvent(new Event(DUMMY_PAYMENT_EVENT));
}

export function getDummyPaidInvoice(invoiceId) {
  if (!invoiceId) return null;

  return readDummyPaidInvoices()[invoiceId] ?? null;
}

export function getDummyPaidInvoices() {
  return Object.values(readDummyPaidInvoices());
}

export function isDummyInvoicePaid(invoiceId) {
  return Boolean(getDummyPaidInvoice(invoiceId));
}

export function isDummyInvoiceApproved(invoiceId) {
  const invoice = getDummyPaidInvoice(invoiceId);

  return Boolean(invoice?.eventConfirmed);
}

export function isDummyOrderConfirmed(orderId) {
  if (!orderId) return false;

  return getDummyPaidInvoices().some(
    (invoice) => invoice.orderId === orderId && invoice.eventConfirmed,
  );
}

export function markDummyInvoicePaid(invoice) {
  const current = readDummyPaidInvoices();
  const existing = current[invoice.invoiceId] ?? {};
  const paidAt = new Date().toISOString();

  writeDummyPaidInvoices({
    ...current,
    [invoice.invoiceId]: {
      ...existing,
      ...invoice,
      paidAt: existing.paidAt ?? paidAt,
      status: "paid",
    },
  });

  return paidAt;
}

export function approveDummyInvoicePayment(invoice) {
  const current = readDummyPaidInvoices();
  const existing = current[invoice.invoiceId] ?? {};
  const approvedAt = new Date().toISOString();

  writeDummyPaidInvoices({
    ...current,
    [invoice.invoiceId]: {
      ...existing,
      ...invoice,
      approvedAt,
      eventConfirmed: true,
      orderStatus: "confirmed",
      status: "paid",
    },
  });

  return approvedAt;
}

export function getDummyConfirmedOrders(customerEmail) {
  const normalizedEmail = customerEmail?.trim().toLowerCase();

  return getDummyPaidInvoices()
    .filter((invoice) => invoice.eventConfirmed && invoice.orderId)
    .filter((invoice) => {
      if (!normalizedEmail) return true;

      return invoice.customerEmail?.trim().toLowerCase() === normalizedEmail;
    })
    .map((invoice) => ({
      order_id: invoice.orderId,
      status: "confirmed",
      total_price: invoice.amount ?? 0,
      event_date: invoice.eventDate,
      start_time: invoice.startTime,
      end_time: invoice.endTime,
      event_location: invoice.eventLocation,
      number_of_guest: invoice.guests,
      customer: {
        first_name: invoice.customerName?.split(" ")[0] ?? "",
        last_name: invoice.customerName?.split(" ").slice(1).join(" ") ?? "",
        email: invoice.customerEmail,
        phone_number: invoice.customerPhone,
      },
      event_type: {
        event_name: invoice.eventType,
      },
    }));
}

export function mergeOrdersById(...orderGroups) {
  const merged = new Map();

  for (const orders of orderGroups) {
    for (const order of orders ?? []) {
      if (!order?.order_id) continue;

      merged.set(order.order_id, {
        ...merged.get(order.order_id),
        ...order,
      });
    }
  }

  return [...merged.values()];
}

export function subscribeDummyInvoicePayments(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key === DUMMY_PAID_INVOICES_KEY) {
      listener();
    }
  };

  window.addEventListener(DUMMY_PAYMENT_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(DUMMY_PAYMENT_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
