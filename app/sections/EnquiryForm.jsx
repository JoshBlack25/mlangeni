"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/services/lazySupabase";
import { sendEnquiryEmail } from "@/services/emailService";
import { redirectToWhatsApp } from "@/utils/whatsappRedirect";
import DatePicker from "@/app/components/contact/DatePicker";
import PhoneInputField from "@/app/components/contact/PhoneInputField";
import SessionDropDown from "@/app/components/contact/SessionDropDown";
import SuccessModal from "@/app/components/contact/SuccessModal";
import {
  SESSION_OPTIONS,
  normalizeSession,
  isSessionUnavailable,
} from "@/app/components/constants/sessions";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  session: "",
  guests: "",
  message: "",
};

export default function EnquiryForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneChange = useCallback((value) => {
    handleChange("phone", value);
  }, []);

  const handleSessionChange = useCallback((value) => {
    handleChange("session", value);
  }, []);

  useEffect(() => {
    if (!formData.eventDate) {
      return;
    }
    const fetchBooked = async () => {
      // Must go through the RPC. db/006 dropped the blanket public read on
      // `enquiries` — it exposed every lead's name, email and phone — and
      // db/007 deliberately keeps it dropped. A table read here returns zero
      // rows for an anonymous visitor rather than erroring, which would show
      // every session as free and let the date be double-booked.
      const supabase = await getSupabase();
      const { data } = await supabase.rpc("get_booked_sessions", {
        p_date: formData.eventDate,
      });
      setBookedSessions((data ?? []).map((r) => normalizeSession(r.session)));
    };
    fetchBooked();
  }, [formData.eventDate]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.eventDate) newErrors.eventDate = "Please select a date";
    if (!formData.session) newErrors.session = "Please select a session";
    if (!formData.guests) newErrors.guests = "Number of guests is required";
    else if (parseInt(formData.guests) < 1)
      newErrors.guests = "Must have at least 1 guest";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      // Take the visitor to the first field that needs attention.
      requestAnimationFrame(() => {
        document.querySelector('#enquiry-form [aria-invalid="true"]')?.focus();
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const enquiryData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.eventDate,
        session: formData.session,
        guests: parseInt(formData.guests),
        message: formData.message,
      };
      const supabase = await getSupabase();
      const { error: supabaseError } = await supabase.from("enquiries").insert([
        {
          name: enquiryData.name,
          email: enquiryData.email,
          phone: enquiryData.phone,
          event_date: enquiryData.eventDate,
          session: enquiryData.session,
          guests: enquiryData.guests,
          message: enquiryData.message,
        },
      ]);
      if (supabaseError) throw supabaseError;

      // The enquiry is saved, so the visitor's submission has succeeded.
      // The email runs in the background: a slow or failed send is logged
      // but never blocks the success screen or shows a false error.
      sendEnquiryEmail(enquiryData).catch((err) =>
        console.error("Enquiry email failed:", err),
      );

      redirectToWhatsApp(enquiryData);
      setShowModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
  };


  const formattedDate = formData.eventDate
    ? new Date(formData.eventDate + "T00:00:00")
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : null;

  // Underlined fields, like a reply card: a hairline that turns gold on focus.
  const control = (hasError) =>
    cn(
      "w-full border-0 border-b bg-transparent px-0 py-3 text-[15px] text-mgh-text placeholder:text-mgh-dim",
      "outline-none transition-[border-color,box-shadow] duration-200",
      "focus-visible:border-mgh-gold focus-visible:shadow-[0_1px_0_0_var(--mgh-gold)]",
      hasError ? "border-mgh-danger" : "border-mgh-line-strong hover:border-mgh-dim",
    );
  const wrap = (hasError) =>
    cn(
      "border-b transition-[border-color,box-shadow] duration-200 focus-within:border-mgh-gold focus-within:shadow-[0_1px_0_0_var(--mgh-gold)]",
      hasError ? "border-mgh-danger" : "border-mgh-line-strong hover:border-mgh-dim",
    );

  return (
    <>
      <section aria-labelledby="enquiry-title" className="mgh-enquiry bg-mgh-bg px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1280px]">
          <motion.div
            className="mb-14 max-w-2xl md:mb-20"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              id="enquiry-title"
              className="font-serif text-[3rem] font-normal leading-none tracking-[-0.015em] text-mgh-text sm:text-[4rem]"
            >
              Contact MGH
            </h2>
            <p className="mt-6 max-w-[46ch] text-pretty text-[17px] leading-relaxed text-mgh-muted">
              Contact MGH today to begin your journey toward an extraordinary,
              bespoke hospitality experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
            <motion.form
              id="enquiry-form"
              onSubmit={handleSubmit}
              aria-describedby="enquiry-required-note"
              className="flex flex-col gap-10"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p id="enquiry-required-note" className="sr-only">
                All fields except your message are required.
              </p>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <FormField id="enquiry-name" label="Full Name" error={errors.name}>
                  {(aria) => (
                    <input
                      {...aria}
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      maxLength={120}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Your full name"
                      className={control(errors.name)}
                    />
                  )}
                </FormField>
                <FormField id="enquiry-email" label="Email Address" error={errors.email}>
                  {(aria) => (
                    <input
                      {...aria}
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      maxLength={254}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="you@example.com"
                      className={control(errors.email)}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <FormField id="enquiry-phone" label="Phone Number" error={errors.phone}>
                  {(aria) => (
                    <div className={cn(wrap(errors.phone), "py-2")}>
                      <PhoneInputField
                        id={aria.id}
                        describedBy={aria["aria-describedby"]}
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        error={errors.phone}
                      />
                    </div>
                  )}
                </FormField>
                <FormField id="enquiry-date" label="Event Date" error={errors.eventDate}>
                  {(aria) => (
                    <DatePicker
                      id={aria.id}
                      describedBy={aria["aria-describedby"]}
                      value={formData.eventDate}
                      onChange={(date) => handleChange("eventDate", date)}
                      error={errors.eventDate}
                      className={cn(control(errors.eventDate), "cursor-pointer")}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <FormField id="enquiry-session" label="Session Preference" error={errors.session}>
                  {(aria) => (
                    <div className="relative">
                    <SessionDropDown
                      id={aria.id}
                      describedBy={aria["aria-describedby"]}
                      value={formData.session}
                      onChange={handleSessionChange}
                      selectedDate={formData.eventDate}
                      error={errors.session}
                      dark={true}
                      showBadges={false}
                      className={cn(
                        control(errors.session),
                        "cursor-pointer appearance-none pr-8 disabled:cursor-not-allowed disabled:text-mgh-dim",
                      )}
                    />
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-mgh-muted"
                    />
                    </div>
                  )}
                </FormField>
                <FormField id="enquiry-guests" label="Number of Guests" error={errors.guests}>
                  {(aria) => (
                    <input
                      {...aria}
                      type="number"
                      inputMode="numeric"
                      value={formData.guests}
                      onChange={(e) => handleChange("guests", e.target.value)}
                      placeholder="50"
                      min={1}
                      max={5000}
                      className={control(errors.guests)}
                    />
                  )}
                </FormField>
              </div>

              <FormField id="enquiry-message" label="Your Message" optional>
                {(aria) => (
                  <textarea
                    {...aria}
                    value={formData.message}
                    maxLength={2000}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Tell us more about your vision..."
                    rows={4}
                    className={cn(control(false), "resize-none leading-relaxed")}
                  />
                )}
              </FormField>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-describedby={submitError ? "enquiry-submit-error" : undefined}
                  className="inline-flex h-12 items-center justify-center rounded-control bg-mgh-gold px-10 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink transition-[background-color,transform] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg"
                >
                  {isSubmitting ? "Submitting..." : "Send Enquiry"}
                </button>
                <p
                  id="enquiry-submit-error"
                  role="alert"
                  className="text-sm text-mgh-danger empty:hidden"
                >
                  {submitError}
                </p>
              </div>
            </motion.form>

            <motion.aside
              aria-label="Availability and gallery"
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rounded-card border border-mgh-line bg-mgh-surface p-6 md:p-7">
                <h3 className="font-serif text-xl text-mgh-text">Session Availability</h3>
                <div aria-live="polite">
                  {formattedDate ? (
                    <>
                      <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-mgh-muted">
                        {formattedDate}
                      </p>
                      <ul className="mt-5 divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
                        {SESSION_OPTIONS.map((session) => {
                          const isUnavailable = isSessionUnavailable(session.value, bookedSessions);
                          return (
                            <li key={session.value} className="flex items-center justify-between gap-4 py-3">
                              <span className="text-sm text-mgh-text">{session.label} Session</span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em]",
                                  isUnavailable ? "text-mgh-danger" : "text-mgh-ok",
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn("size-1.5 rounded-full", isUnavailable ? "bg-mgh-danger" : "bg-mgh-ok")}
                                />
                                {isUnavailable ? "Unavailable" : "Available"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-3 text-sm italic leading-relaxed text-mgh-muted">
                      Select a date to view real-time session availability
                    </p>
                  )}
                </div>
              </div>

              <div className="group relative isolate overflow-hidden rounded-card">
                <Image
                  src="/images/gallery_images/showreel_thumbnail.png"
                  alt=""
                  fill
                  sizes="20rem"
                  className="-z-10 object-cover transition-transform duration-[1200ms] ease-mgh group-hover:scale-[1.04]"
                />
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-mgh-bg via-mgh-bg/70 to-mgh-bg/10" />
                <div className="flex min-h-64 flex-col justify-end p-6 md:p-7">
                  <h3 className="font-serif text-xl text-mgh-text">Explore Our Client Gallery</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
                    View our portfolio of extraordinary events and bespoke catering experiences.
                  </p>
                  <a
                    href="#gallery"
                    className="mt-4 w-fit rounded-sm border-b border-mgh-gold pb-0.5 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-mgh-gold transition-colors after:absolute after:inset-0 after:content-[''] hover:text-mgh-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg"
                  >
                    View Gallery
                  </a>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <SuccessModal isOpen={showModal} onClose={handleModalClose} name={formData.name} />
    </>
  );
}

/** Label above, control, then the error below it, all wired together. */
function FormField({ id, label, error, optional = false, children }) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-medium text-mgh-muted">
        {label}
        {optional && <span className="ml-1.5 font-normal text-mgh-dim">(optional)</span>}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": optional ? undefined : true,
      })}
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-mgh-danger">
          {error}
        </p>
      )}
    </div>
  );
}
