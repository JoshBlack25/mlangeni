"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageCircle, ChevronDown } from "lucide-react";

const contactChannels = [
  {
    label: "Call Us",
    detail: "+27 21 555 0198",
    href: "tel:+27215550198",
    icon: Phone,
  },
  {
    label: "Email Us",
    detail: "hello@mlangeni.co.za",
    href: "mailto:hello@mlangeni.co.za",
    icon: Mail,
  },
  {
    label: "WhatsApp",
    detail: "Chat with our team",
    href: "https://wa.me/27215550198",
    icon: MessageCircle,
  },
];

const faqs = [
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 6-8 weeks ahead for weddings and large functions, and 2-3 weeks for smaller private events, to give our team enough time to plan the menu and logistics with you.",
  },
  {
    question: "Can you accommodate dietary requirements?",
    answer:
      "Yes — we cater for vegetarian, vegan, halal, and allergen-specific needs. Just let your consultant know when you book, or mention it in your consultation thread.",
  },
  {
    question: "How do I pay an outstanding invoice?",
    answer:
      'Head to the Invoices tile on your dashboard and select "Pay Now" on any outstanding invoice. You\'ll be taken through our secure payment flow.',
  },
  {
    question: "What's your cancellation policy?",
    answer:
      "Cancellations made more than 14 days before the event are fully refundable. Within 14 days, a partial cancellation fee may apply depending on preparations already underway — your coordinator can confirm specifics for your booking.",
  },
  {
    question: "Can I make changes to my booking after confirming?",
    answer:
      "Yes, within reason. Guest count, menu adjustments, and timing changes can usually be accommodated up to 7 days before the event — reach out through Consultations to request changes.",
  },
];

export default function SupportContent() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      {/* BANNER */}
      <section className="relative isolate mt-8 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hospitality-thumbnail.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A0A0A]/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/70" />
        </div>

        <div className="relative z-10 px-10 py-16">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Support
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white">
            We&apos;re here to help
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[#A0A0A0]">
            Questions about your booking, invoices, or event details? Reach out
            directly or browse answers to what customers ask us most.
          </p>
        </div>
      </section>

      {/* QUICK CONTACT */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {contactChannels.map(({ label, detail, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
          >
            <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
              <Icon size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white">{label}</h3>
            <p className="mt-2 text-sm text-[#A0A0A0]">{detail}</p>
          </a>
        ))}
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md sm:p-4">
        <h2 className="px-4 pt-4 text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Frequently Asked Questions
        </h2>

        <div className="mt-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div key={faq.question} className="border-t border-white/5">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-inset"
                >
                  <span className="text-sm font-medium text-white sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#D4AF37] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-5 text-sm leading-relaxed text-[#A0A0A0]">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
