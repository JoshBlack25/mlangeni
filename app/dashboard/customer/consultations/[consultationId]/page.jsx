"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import ConsultationChat from "@/app/components/dashboard/shared/consultations/ConsultationChat";
import {
  consultationStatusLabel,
  formatConsultationDate,
  formatConsultationTime,
  getConsultationCustomerName,
  getConsultationOrderItems,
  isActiveConsultation,
} from "@/app/utils/consultationPresentation";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function orderStatusLabel(status) {
  return (status ?? "pending")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CustomerConsultationDetailsPage() {
  const { consultationId } = useParams();
  const { consultations, error } = useCustomerConsultations(consultationId);
  const consultation = consultations?.[0];
  const customer = consultation?.customer;
  const order = consultation?.order;
  const orderItems = getConsultationOrderItems(order);
  const loading = consultations === null;

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="min-w-0">
            <Link
              href="/dashboard/customer/consultations"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to consultations
            </Link>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <CalendarCheck size={17} />
              <span>Consultation Request</span>
            </div>
            <h1 className="break-words font-serif text-4xl font-medium text-white md:text-5xl">
              {loading
                ? "Loading request"
                : getConsultationCustomerName(customer)}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Your event details and consultation conversation.
            </p>
          </div>
          {consultation && (
            <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
              {consultationStatusLabel(consultation)}
              <p className="mt-2 text-xs text-[#797676]">
                ORD-{consultation.order_id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="mt-10 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="h-64 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
            <div className="h-64 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-10 flex min-h-64 flex-col items-center justify-center border border-red-400/20 bg-red-400/5 px-6 text-center"
          >
            <p className="text-sm font-semibold text-red-300">
              We could not load this consultation
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#A0A0A0]">
              {error}
            </p>
          </div>
        ) : !consultation ? (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center border border-white/10 bg-white/5 px-6 text-center">
            <ClipboardList size={28} className="text-[#D4AF37]" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Consultation not found
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#A0A0A0]">
              This consultation is no longer available for your account.
            </p>
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]"
            >
              <InfoPanel
                icon={UserRound}
                eyebrow="Customer"
                title="Customer Details"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField
                    label="First Name"
                    value={customer?.first_name || "First name pending"}
                  />
                  <DetailField
                    label="Last Name"
                    value={customer?.last_name || "Last name pending"}
                  />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <ContactRow
                    icon={Mail}
                    label="Email"
                    value={customer?.email || "Email pending"}
                  />
                  <ContactRow
                    icon={Phone}
                    label="Phone"
                    value={customer?.phone_number || "Phone pending"}
                  />
                </div>
              </InfoPanel>
              <InfoPanel
                icon={ClipboardList}
                eyebrow="Order"
                title="Submitted Event Details"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailField
                    label="Event Type"
                    value={
                      order?.event_type?.event_name ?? "Event type pending"
                    }
                  />
                  <DetailField
                    label="Guest Count"
                    value={
                      order?.number_of_guest != null
                        ? `${order.number_of_guest} guests`
                        : "Guest count pending"
                    }
                  />
                  <DetailField
                    label="Event Date"
                    value={formatConsultationDate(order?.event_date)}
                  />
                  <DetailField
                    label="Event Time"
                    value={`${formatConsultationTime(order?.start_time)} - ${formatConsultationTime(order?.end_time)}`}
                  />
                  <DetailField
                    label="Order Total"
                    value={currency.format(Number(order?.total_price ?? 0))}
                  />
                  <DetailField
                    label="Order Status"
                    value={orderStatusLabel(order?.status)}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3 text-sm text-[#A0A0A0]">
                  <MapPin size={16} className="shrink-0 text-[#D4AF37]" />
                  <span className="min-w-0 break-words">
                    {order?.event_location || "Event location pending"}
                  </span>
                </div>
              </InfoPanel>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="mt-6 rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Ordered Items
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Customer Menu Selection
                  </h2>
                </div>
                <div className="inline-flex shrink-0 rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                  <UtensilsCrossed size={21} />
                </div>
              </div>
              {orderItems.length === 0 ? (
                <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-6 text-sm text-[#A0A0A0]">
                  No menu items were found for this order yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#797676]">
                          {item.note}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-[#D4AF37] md:text-right">
                        <p>Qty {item.quantity}</p>
                        {item.price != null && (
                          <p className="mt-1 text-xs text-[#A0A0A0]">
                            {currency.format(Number(item.price))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {consultation.note && (
                <div className="mt-5 border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">
                    Consultation Notes
                  </p>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#A0A0A0]">
                    {consultation.note}
                  </p>
                </div>
              )}
              {!isActiveConsultation(consultation) && (
                <div className="mt-5 border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 px-4 py-4">
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    Meeting Scheduled
                  </p>
                  <p className="mt-2 text-sm text-[#A0A0A0]">
                    {formatConsultationDate(consultation.meeting_date)} at{" "}
                    {formatConsultationTime(consultation.meeting_date)}
                  </p>
                </div>
              )}
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="mt-6"
            >
              <ConsultationChat
                key={consultation.consultations_id}
                consultation={consultation}
              />
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
}

function InfoPanel({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="inline-flex shrink-0 rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
          <Icon size={21} />
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
      <Icon size={16} className="shrink-0 text-[#D4AF37]" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
