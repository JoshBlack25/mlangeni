"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

//indvoice data that is hardcoded for now
const invoices = [
  {
    id: "f3c8a9b2-1452-4a9d-9d24-775e1c1a7d44",
    reference: "INV-F3C8A9B2",
    title: "Wedding Catering Package",
    description: "Final balance for menu, staffing, and service setup.",
    amount: 12450,
    dueDate: "2026-08-22",
    status: "pending",
  },
  {
    id: "7ad1c321-60ec-4a5d-8f9b-04994d3299b0",
    reference: "INV-7AD1C321",
    title: "Private Birthday Party Catering",
    description: "Balance for food and decoration.",
    amount: 3850,
    dueDate: "2026-08-29",
    status: "pending",
  },
];

const historyRows = [
  "Payment reference",
  "Invoice number",
  "Payment date",
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status) {
  if (status === "sent") return "Due";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyles(status) {
  if (status === "sent") {
    return "text-[#D4AF37]";
  }

  return "text-[#A0A0A0]";
}

export default function PaymentsPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0].id);

  const selectedInvoice = useMemo(
    () =>
      invoices.find((invoice) => invoice.id === selectedInvoiceId) ??
      invoices[0],
    [selectedInvoiceId],
  );

  const outstandingTotal = invoices.reduce(
    (total, invoice) => total + invoice.amount,
    0,
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1300px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <CreditCard size={17} />
              <span>Payments</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Settle Your Invoice
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review the invoice issued for your booking and complete the
              payment through a secure card checkout.
            </p>
          </div>

          <div className="flex h-11 items-center gap-2 border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 text-sm text-[#D4AF37]">
            <ShieldCheck size={16} />
            <span>Secure checkout</span>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <SummaryCard
            icon={Receipt}
            label="Outstanding"
            value={currency.format(outstandingTotal)}
            caption={`${invoices.length} invoices ready for payment`}
          />
          <SummaryCard
            icon={CalendarDays}
            label="Next Due Date"
            value={formatDate(invoices[0].dueDate)}
            caption={invoices[0].reference}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Payment Status"
            value="Pending"
            caption="Awaiting customer payment"
          />
        </motion.section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.25fr]">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="flex flex-col gap-6"
          >
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Invoice
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Choose an Invoice
                  </h2>
                </div>

                <Receipt size={22} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const active = selectedInvoice.id === invoice.id;

                  return (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
                        active
                          ? "border-[#D4AF37]/60 bg-[#D4AF37]/10"
                          : "border-white/10 bg-[#101010] hover:border-[#D4AF37]/40 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {invoice.title}
                          </p>
                          <p className="mt-1 text-xs text-[#797676]">
                            {invoice.reference}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 border-l border-white/10 pl-3 text-[11px] font-medium uppercase tracking-[0.16em] ${statusStyles(
                            invoice.status,
                          )}`}
                        >
                          {statusLabel(invoice.status)}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-[#8F8F8F]">
                        {invoice.description}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div className="text-xs text-[#797676]">
                          Due {formatDate(invoice.dueDate)}
                        </div>

                        <div className="text-right text-lg font-semibold text-white">
                          {currency.format(invoice.amount)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                <LockKeyhole size={22} />
              </div>

              <h2 className="text-lg font-semibold text-white">
                Payment Protection
              </h2>

              <div className="mt-5 space-y-4">
                <TrustRow
                  icon={ShieldCheck}
                  title="Encrypted card details"
                  detail="Your payment information is handled through a secure checkout flow."
                />
                <TrustRow
                  icon={Receipt}
                  title="Invoice matched"
                  detail="Each payment is tied to the selected invoice reference."
                />
                <TrustRow
                  icon={AlertCircle}
                  title="Review before paying"
                  detail="Confirm the invoice amount before the payment is processed."
                />
              </div>
            </section>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <div className="border-b border-white/10 px-6 py-6 md:px-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                Payment Details
              </p>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-serif text-3xl text-white">
                    {currency.format(selectedInvoice.amount)}
                  </h2>
                  <p className="mt-2 text-sm text-[#797676]">
                    {selectedInvoice.reference} - Due{" "}
                    {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>

                <span
                  className={`w-fit border-l border-white/10 pl-3 text-xs font-medium uppercase tracking-[0.16em] ${statusStyles(
                    selectedInvoice.status,
                  )}`}
                >
                  Status: {statusLabel(selectedInvoice.status)}
                </span>
              </div>
            </div>

            <form
              className="space-y-6 px-6 py-6 md:px-8 md:py-8"
              onSubmit={(event) => event.preventDefault()}
            >
              <div>
                <label
                  htmlFor="invoice"
                  className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
                >
                  Invoice
                </label>

                <div className="relative">
                  <select
                    id="invoice"
                    value={selectedInvoiceId}
                    onChange={(event) => setSelectedInvoiceId(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#101010] px-4 pr-11 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  >
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.reference} - {invoice.title}
                      </option>
                    ))}
                  </select>
                  <WalletCards
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ReadOnlyField
                  label="Invoice Amount"
                  value={currency.format(selectedInvoice.amount)}
                />
                <ReadOnlyField label="Payment Reference" value="Generated on payment" />
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
                  Payment Method
                </p>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black">
                      <CreditCard size={18} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">
                        Card Payment
                      </span>
                      <span className="mt-1 block text-xs text-[#797676]">
                        Visa or Mastercard
                      </span>
                    </span>
                  </div>

                  <span className="shrink-0 border-l border-[#D4AF37]/40 pl-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#D4AF37]">
                    Card ready
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                  id="cardholder"
                  label="Cardholder Name"
                  placeholder="Name on card"
                />
                <TextField
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                />
              </div>

              <TextField
                id="card-number"
                label="Card Number"
                placeholder="1234 1234 1234 1234"
                inputMode="numeric"
              />

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  id="expiry"
                  label="Expiry"
                  placeholder="MM / YY"
                  inputMode="numeric"
                />
                <TextField
                  id="cvc"
                  label="CVC"
                  placeholder="123"
                  inputMode="numeric"
                />
              </div>

              <TextField
                id="billing-address"
                label="Billing Address"
                placeholder="Street address"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField id="city" label="City" placeholder="Cape Town" />
                <TextField
                  id="postal-code"
                  label="Postal Code"
                  placeholder="8001"
                  inputMode="numeric"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#101010] p-4 text-sm text-[#A0A0A0]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0A0A0A] accent-[#D4AF37]"
                />
                <span>
                  Send the payment receipt to my account email once the payment
                  is complete.
                </span>
              </label>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
              >
                <LockKeyhole size={17} />
                Pay {currency.format(selectedInvoice.amount)}
              </button>
            </form>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8"
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                Payment History
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Recent Payments
              </h2>
            </div>

            <span className="w-fit border-l border-white/10 pl-3 text-xs uppercase tracking-[0.16em] text-[#797676]">
              Receipts pending
            </span>
          </div>

          <div className="space-y-3">
            {historyRows.map((row) => (
              <div
                key={row}
                className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#101010] p-4 md:grid-cols-[1.1fr_0.8fr_0.7fr_0.4fr]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5F5F5F]">
                    {row}
                  </p>
                  <div className="mt-3 h-3 w-40 animate-pulse rounded-sm bg-white/10" />
                </div>
                <div className="h-3 w-32 animate-pulse rounded-sm bg-white/10 md:mt-7" />
                <div className="h-3 w-24 animate-pulse rounded-sm bg-white/10 md:mt-7" />
                <div className="h-7 w-20 animate-pulse rounded-md bg-[#D4AF37]/10 md:mt-5" />
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value, caption }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
      <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
        <Icon size={22} />
      </div>

      <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-[#797676]">{caption}</p>
    </div>
  );
}

function TrustRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
        <Icon size={15} />
      </div>

      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#797676]">{detail}</p>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
        {label}
      </p>
      <div className="flex h-12 items-center rounded-xl border border-white/10 bg-[#0D0D0D] px-4 text-sm text-[#D0D0D0]">
        {value}
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  placeholder,
  type = "text",
  inputMode,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#101010] px-4 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}
