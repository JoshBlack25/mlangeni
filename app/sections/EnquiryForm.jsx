"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import { sendEnquiryEmail } from "@/services/emailService";
import { redirectToWhatsApp } from "@/utils/whatsappRedirect";
import DatePicker from "@/app/components/contact/DatePicker";
import PhoneInputField from "@/app/components/contact/PhoneInputField";
import SessionDropDown from "@/app/components/contact/SessionDropDown";
import SuccessModal from "@/app/components/contact/SuccessModal";
import Link from "next/link";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  session: "",
  guests: "",
  message: "",
};

const ALL_SESSIONS = ["Morning", "Afternoon", "Evening/Night"];

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.6,
    },
  },
};

const fieldFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function EnquiryForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bookedSessions, setBookedSessions] = useState([]);

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
      setBookedSessions([]);
      return;
    }
    const fetchBooked = async () => {
      const { data } = await supabase
        .from("enquiries")
        .select("session")
        .eq("event_date", formData.eventDate)
        .eq("status", "confirmed");
      setBookedSessions(data?.map((r) => r.session) ?? []);
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
    if (!validate()) return;
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
      await sendEnquiryEmail(enquiryData);
      redirectToWhatsApp(enquiryData);
      setShowModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
  };

  const labelClass =
    "text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] font-bold";

  const inputClass = (hasError) =>
    `w-full bg-transparent border-b py-2 text-sm text-white placeholder-[#444] outline-none transition-all
    ${hasError ? "border-red-500" : "border-[#2A2A2A] focus:border-[#D4AF37]"}`;

  const errorClass = "text-[10px] text-red-400 mt-0.5";

  const formattedDate = formData.eventDate
    ? new Date(formData.eventDate + "T00:00:00")
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    : null;

  return (
    <>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.3);
          cursor: pointer;
        }
        input[type="date"] { color-scheme: dark; }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .mgh-phone .PhoneInputCountry { margin-right: 8px; }
        .mgh-phone .PhoneInputCountrySelect {
          background: transparent;
          color: white;
          border: none;
          outline: none;
          font-size: 13px;
          cursor: pointer;
        }
        .mgh-phone .PhoneInputCountrySelectArrow { color: #D4AF37; }
        .mgh-phone .PhoneInputInput {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 13px;
          width: 100%;
        }
        .mgh-phone .PhoneInputInput::placeholder { color: #444; }
      `}</style>

      <section className="bg-[#0a0a0a] text-white px-6 md:px-12 py-20 font-[Playfair_Display]">
        <div className="max-w-7xl mx-auto">
          {/* Heading — fades up first */}
          <motion.div
            className="mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-4xl font-bold text-[#D4AF37] mb-3">
              Contact MGH
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              Contact MGH today to begin your journey toward an extraordinary,
              bespoke hospitality experience.
            </p>
          </motion.div>

          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* ── LEFT: Form slides in from left ── */}
            <motion.div
              className="flex-1"
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* Staggered form fields */}
              <motion.form
                onSubmit={handleSubmit}
                className="flex flex-col gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {/* Name + Email */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  variants={fieldFadeUp}
                >
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="ALEXANDER MONROE"
                      className={inputClass(errors.name)}
                    />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="ALEXANDER@EXAMPLE.COM"
                      className={inputClass(errors.email)}
                    />
                    {errors.email && (
                      <p className={errorClass}>{errors.email}</p>
                    )}
                  </div>
                </motion.div>

                {/* Phone + Date */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  variants={fieldFadeUp}
                >
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Phone Number</label>
                    <div
                      className={`border-b py-1 transition-all ${
                        errors.phone
                          ? "border-red-500"
                          : "border-[#2A2A2A] focus-within:border-[#D4AF37]"
                      }`}
                    >
                      <PhoneInputField
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        error={undefined}
                      />
                    </div>
                    {errors.phone && (
                      <p className={errorClass}>{errors.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Event Date</label>
                    <div
                      className={`border-b py-0.5 transition-all ${
                        errors.eventDate
                          ? "border-red-500"
                          : "border-[#2A2A2A] focus-within:border-[#D4AF37]"
                      }`}
                    >
                      <div className="[&_label]:hidden [&_p]:hidden [&_input]:bg-transparent [&_input]:border-0 [&_input]:text-white [&_input]:outline-none [&_input]:text-sm [&_input]:py-1.5 [&_input]:w-full [&_input]:cursor-pointer [&_div]:gap-0">
                        <DatePicker
                          value={formData.eventDate}
                          onChange={(date) => handleChange("eventDate", date)}
                          error={errors.eventDate}
                        />
                      </div>
                    </div>
                    {errors.eventDate && (
                      <p className={errorClass}>{errors.eventDate}</p>
                    )}
                  </div>
                </motion.div>

                {/* Session + Guests */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  variants={fieldFadeUp}
                >
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Session Preference</label>
                    <div
                      className={`border-b py-1 transition-all ${
                        errors.session
                          ? "border-red-500"
                          : "border-[#2A2A2A] focus-within:border-[#D4AF37]"
                      }`}
                    >
                      <SessionDropDown
                        value={formData.session}
                        onChange={handleSessionChange}
                        selectedDate={formData.eventDate}
                        error={errors.session}
                        dark={true}
                        showBadges={false}
                      />
                    </div>
                    {errors.session && (
                      <p className={errorClass}>{errors.session}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Number of Guests</label>
                    <input
                      type="number"
                      value={formData.guests}
                      onChange={(e) => handleChange("guests", e.target.value)}
                      placeholder="50"
                      min={1}
                      className={inputClass(errors.guests)}
                    />
                    {errors.guests && (
                      <p className={errorClass}>{errors.guests}</p>
                    )}
                  </div>
                </motion.div>

                {/* Message */}
                <motion.div
                  className="flex flex-col gap-1"
                  variants={fieldFadeUp}
                >
                  <label className={labelClass}>Your Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Tell us more about your vision..."
                    rows={4}
                    className="w-full bg-transparent border border-[#1E1E1E] focus:border-[#D4AF37]
                      px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-all resize-none"
                  />
                </motion.div>

                {/* Submit */}
                <motion.div variants={fieldFadeUp}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#D4AF37] hover:bg-[#C09B2A] disabled:opacity-40 disabled:cursor-not-allowed
                      text-[#0A0A0A] text-xs font-bold tracking-[0.3em] uppercase py-3.5 px-12
                      transition-colors duration-200"
                  >
                    {isSubmitting ? "Submitting..." : "Send Enquiry"}
                  </button>
                </motion.div>
              </motion.form>
            </motion.div>

            {/* ── RIGHT: Sidebar slides in from right ── */}
            <motion.div
              className="w-full lg:w-[320px] shrink-0 flex flex-col gap-8"
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* Availability Tracker */}
              <div className="border border-[#1A1A1A] p-8">
                <h3 className="text-sm font-bold text-white tracking-wide mb-1">
                  Session Availability
                </h3>
                {formattedDate ? (
                  <>
                    <p className="text-[10px] tracking-[0.15em] text-white/30 mb-5">
                      {formattedDate}
                    </p>
                    <div className="flex flex-col">
                      {ALL_SESSIONS.map((session, i) => {
                        const isUnavailable = bookedSessions.includes(session);
                        return (
                          <div
                            key={session}
                            className={`flex items-center justify-between py-3.5 ${
                              i < ALL_SESSIONS.length - 1
                                ? "border-b border-[#1A1A1A]"
                                : ""
                            }`}
                          >
                            <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">
                              {session} Session
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isUnavailable
                                    ? "bg-red-500"
                                    : "bg-emerald-400"
                                }`}
                              />
                              <span
                                className={`text-[10px] tracking-[0.15em] uppercase font-bold ${
                                  isUnavailable
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {isUnavailable ? "Unavailable" : "Available"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-white/30 italic mt-3">
                    Select a date to view real-time session availability
                  </p>
                )}
              </div>

              {/* Gallery CTA */}
              <div className="relative h-64 group cursor-pointer overflow-hidden">
                <img
                  src="/images/image1.png"
                  alt="Client Gallery"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-2">
                    Explore Our Client Gallery
                  </h3>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">
                    View our portfolio of extraordinary events and bespoke
                    catering experiences.
                  </p>
                  <Link href="#gallery" scroll={true}>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] border-b border-[#D4AF37] pb-0.5 hover:text-white hover:border-white transition-colors cursor-pointer">
                      View Gallery
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SuccessModal
        isOpen={showModal}
        onClose={handleModalClose}
        name={formData.name}
      />
    </>
  );
}
