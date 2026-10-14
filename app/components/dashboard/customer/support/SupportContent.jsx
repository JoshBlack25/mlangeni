"use client";

import { Phone, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_PHONE, SITE } from "@/lib/site";
import {
  PageHeader,
  Panel,
  PanelHeader,
  focusRing,
} from "@/app/components/dashboard/ui";

const linkClass = cn(
  "rounded-sm text-mgh-text underline decoration-mgh-line-strong underline-offset-4 transition-colors hover:decoration-mgh-gold",
  focusRing,
);

// Phone and WhatsApp appear only once NEXT_PUBLIC_BUSINESS_PHONE is set.
const contactChannels = [
  BUSINESS_PHONE && {
    label: "Call Us",
    detail: `+${BUSINESS_PHONE}`,
    href: `tel:+${BUSINESS_PHONE}`,
    icon: Phone,
  },
  {
    label: "Email Us",
    detail: SITE.email,
    href: `mailto:${SITE.email}`,
    icon: Mail,
  },
  BUSINESS_PHONE && {
    label: "WhatsApp",
    detail: "Chat with our team",
    href: `https://wa.me/${BUSINESS_PHONE}`,
    icon: MessageCircle,
  },
].filter(Boolean);

const faqs = [
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 6-8 weeks ahead for weddings and large functions, and 2-3 weeks for smaller private events, to give our team enough time to plan the menu and logistics with you.",
  },
  {
    question: "Can you accommodate dietary requirements?",
    answer:
      "Yes. We cater for vegetarian, vegan, halal, and allergen-specific needs. Just let your consultant know when you book, or mention it in your consultation thread.",
  },
  {
    question: "How do I pay an outstanding invoice?",
    answer:
      'Head to the Invoices tile on your dashboard and select "Pay Now" on any outstanding invoice. You\'ll be taken through our secure payment flow.',
  },
  {
    question: "What's your cancellation policy?",
    answer:
      "Cancellations made more than 14 days before the event are fully refundable. Within 14 days, a partial cancellation fee may apply depending on preparations already underway. Your coordinator can confirm specifics for your booking.",
  },
  {
    question: "Can I make changes to my booking after confirming?",
    answer:
      "Yes, within reason. Guest count, menu adjustments, and timing changes can usually be accommodated up to 7 days before the event. Reach out through Consultations to request changes.",
  },
];

export default function SupportContent() {
  return (
    <div>
      <PageHeader
        title={"We're here to help"}
        lead="Questions about your booking, invoices, or event details? Reach out directly or browse answers to what customers ask us most."
      />

      <div className="flex flex-col gap-8 md:gap-10">
        {/* QUICK CONTACT */}
        <Panel aria-labelledby="support-contact">
          <h2 id="support-contact" className="sr-only">
            Contact us
          </h2>
          <dl className="divide-y divide-mgh-line-soft">
            {contactChannels.map(({ label, detail, href, icon: Icon }) => {
              const external = href.startsWith("http");
              return (
                <div
                  key={label}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <dt className="flex items-center gap-2.5 text-sm text-mgh-muted">
                    <Icon size={16} aria-hidden="true" className="text-mgh-dim" />
                    {label}
                  </dt>
                  <dd className="pl-[26px] text-[15px] sm:pl-0">
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className={cn(linkClass, "inline-flex min-h-10 items-center")}
                    >
                      {detail}
                    </a>
                  </dd>
                </div>
              );
            })}
          </dl>
        </Panel>

        {/* FAQ */}
        <Panel>
          <PanelHeader title="Frequently Asked Questions" />
          <dl className="divide-y divide-mgh-line-soft">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                <dt className="text-[15px] font-medium text-mgh-text">
                  {faq.question}
                </dt>
                <dd className="mt-2 max-w-prose text-sm leading-relaxed text-mgh-muted">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
