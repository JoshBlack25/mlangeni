"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  getActiveBookingMessage,
  getActiveCustomerBooking,
  getCustomerForUser,
} from "@/app/utils/customerBookingRules";

const bookingOptions = [
  {
    id: "menu-builder",
    title: "Build Your Own Menu",
    description:
      "Create a menu tailored to your event by choosing the dishes and refreshments you'd like to serve.",
    icon: UtensilsCrossed,
    href: "/dashboard/customer/booking/menubuilder",
    action: "Start Building",
  },
  {
    id: "packages",
    title: "Choose a Package",
    description:
      "Select from our curated catering packages, thoughtfully put together for different events and occasions.",
    icon: Sparkles,
    href: "/dashboard/customer/booking/packages",
    action: "View Packages",
  },
];

export default function BookingPage() {
  const router = useRouter();
  const [checkingBooking, setCheckingBooking] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkBookingAvailability() {
      try {
        setAvailabilityError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);
        const booking = customer
          ? await getActiveCustomerBooking(supabase, customer.customer_id)
          : null;

        if (mounted) {
          setActiveBooking(booking);
        }
      } catch (err) {
        if (mounted) {
          setAvailabilityError(
            err.message || "Unable to check your booking availability.",
          );
        }
      } finally {
        if (mounted) {
          setCheckingBooking(false);
        }
      }
    }

    checkBookingAvailability();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checkingBooking) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1400px] items-center justify-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#797676]">
            Checking booking availability...
          </p>
        </div>
      </main>
    );
  }

  if (availabilityError || activeBooking) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[900px] items-center justify-center">
          <div className="w-full border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-md md:p-10">
            <AlertCircle className="mx-auto text-[#D4AF37]" size={32} />
            <h1 className="mt-5 font-serif text-3xl font-medium text-white md:text-4xl">
              Active Booking In Progress
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              {availabilityError || getActiveBookingMessage(activeBooking)}
            </p>
            <Link
              href="/dashboard/customer/orders"
              className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
            >
              View My Bookings
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1400px] flex-col justify-center">
        {/* INTRODUCTION */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* SMALL LABEL */}

          <div className="mb-5 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
            <CalendarDays size={17} />
            <span>Plan Your Event</span>
          </div>

          {/* HEADING */}

          <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
            Create Your Booking
          </h1>

          {/* DESCRIPTION */}

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#A0A0A0] md:text-lg">
            Let&apos;s create something memorable. Choose how you&apos;d like to begin
            planning your catering experience.
          </p>
        </motion.div>

        {/* CHOICE CARDS */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-14 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2"
        >
          {bookingOptions.map((option, index) => {
            const Icon = option.icon;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + index * 0.1,
                }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <Link
                  href={option.href}
                  className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md transition-all duration-500 hover:border-[#D4AF37]/70 hover:bg-white/[0.05] md:p-10"
                >
                  {/* GOLD GLOW */}

                  <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/5 blur-3xl transition-all duration-700 group-hover:bg-[#D4AF37]/10" />

                  {/* ICON */}

                  <div className="relative mb-auto">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] transition-all duration-500 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black">
                      <Icon size={24} strokeWidth={1.7} />
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="relative mt-14">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
                      Option {index + 1}
                    </p>

                    <h2 className="font-serif text-2xl text-white transition-colors duration-300 group-hover:text-[#D4AF37] md:text-3xl">
                      {option.title}
                    </h2>

                    <p className="mt-4 max-w-md text-sm leading-7 text-[#8F8F8F] md:text-base">
                      {option.description}
                    </p>
                  </div>

                  {/* ACTION */}

                  <div className="relative mt-8 flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
                    <span>{option.action}</span>

                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>

                  {/* BOTTOM ACCENT */}

                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FOOTER NOTE */}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 text-center text-xs tracking-wide text-[#5F5F5F]"
        >
          You can review your selections before confirming your booking.
        </motion.p>
      </div>
    </main>
  );
}
