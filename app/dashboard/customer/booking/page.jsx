"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  getActiveBookingMessage,
  getActiveCustomerBooking,
  getCustomerForUser,
} from "@/app/utils/customerBookingRules";
import {
  Button,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
  focusRing,
} from "@/app/components/dashboard/ui";
import { EASE } from "@/app/components/dashboard/shared/motion";
import { cn } from "@/lib/utils";

const bookingOptions = [
  {
    id: "menu-builder",
    title: "Build Your Own Menu",
    description:
      "Create a menu tailored to your event by choosing the dishes and refreshments you'd like to serve.",
    href: "/dashboard/customer/booking/menubuilder",
    action: "Start Building",
    image: "/images/gallery_images/food_6.jpg",
  },
  {
    id: "packages",
    title: "Choose a Package",
    description:
      "Select from our curated catering packages, thoughtfully put together for different events and occasions.",
    href: "/dashboard/customer/booking/packages",
    action: "View Packages",
    image: "/images/gallery_images/food_2.jpg",
  },
];

const PAGE_TITLE = "Create Your Booking";

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
      <div role="status">
        <span className="sr-only">Checking booking availability...</span>
        <Skeleton className="h-10 w-72 md:h-12" />
        <Skeleton className="mt-4 h-4 w-full max-w-md" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    );
  }

  if (availabilityError || activeBooking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        <PageHeader title={PAGE_TITLE} />
        <Panel className="max-w-2xl">
          <PanelHeader
            title="Active Booking In Progress"
            description={
              availabilityError || getActiveBookingMessage(activeBooking)
            }
            className="mb-6"
          />
          <Button
            variant="primary"
            href="/dashboard/customer/orders"
            className="w-full sm:w-auto"
          >
            View My Bookings
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </Panel>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <PageHeader
        title={PAGE_TITLE}
        lead="Let's create something memorable. Choose how you'd like to begin planning your catering experience."
      />

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {bookingOptions.map((option, index) => (
          <li key={option.id}>
            <Link
              href={option.href}
              className={cn(
                "group flex h-full flex-col overflow-hidden rounded-card border border-mgh-line bg-mgh-surface",
                "transition-colors duration-(--mgh-dur-fast) ease-mgh hover:border-mgh-line-strong",
                focusRing,
              )}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={option.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 34rem, 100vw"
                  preload={index === 0}
                  className="object-cover transition-transform duration-[900ms] ease-mgh group-hover:scale-[1.03]"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-mgh-surface via-mgh-surface/10 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col px-6 pb-6 md:px-8 md:pb-8">
              <span className="text-label font-semibold uppercase text-mgh-dim">
                Option {index + 1}
              </span>
              <h2 className="mt-3 font-serif text-2xl font-medium text-mgh-text md:text-title">
                {option.title}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-mgh-muted md:text-body">
                {option.description}
              </p>
              <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-medium text-mgh-text">
                {option.action}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-mgh-dim transition-[color,transform] duration-(--mgh-dur-fast) ease-mgh group-hover:translate-x-0.5 group-hover:text-mgh-text"
                />
              </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-mgh-dim">
        You can review your selections before confirming your booking.
      </p>
    </motion.div>
  );
}
