"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/app/components/dashboard/ui";
import { supabase } from "@/services/supabaseClient";

export default function Hero() {
  const [firstName, setFirstName] = useState(null);

  useEffect(() => {
    async function loadCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("customer")
        .select("first_name")
        .eq("user_id", user.id)
        .single();

      if (data?.first_name) {
        setFirstName(data.first_name);
      }
    }

    loadCustomer();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  };

  return (
    // The same candlelit table the guest saw at sign-in, so arriving here
    // feels like stepping further into the room, not into a different app.
    <header className="relative isolate -mx-4 overflow-hidden sm:mx-0 sm:rounded-sheet sm:border sm:border-mgh-line">
      <Image
        src="/images/auth-bg.png"
        alt=""
        fill
        preload
        sizes="(min-width: 1120px) 1120px, 100vw"
        className="-z-10 object-cover object-[70%_60%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-mgh-bg/70 md:bg-transparent md:bg-linear-to-r md:from-mgh-bg md:via-mgh-bg/85 md:to-mgh-bg/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-mgh-bg/80 to-transparent"
      />

      <div className="flex min-h-[15rem] flex-col justify-end gap-7 px-5 py-8 sm:px-8 md:min-h-[17rem] md:flex-row md:items-end md:justify-between md:px-10 md:py-10">
        <div className="max-w-xl">
          <h1 className="text-balance font-serif text-display-sm font-medium text-mgh-text md:text-display">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-3 max-w-[46ch] text-pretty text-body text-mgh-muted">
            Welcome back to Mlangeni Group Holdings. Track bookings, monitor
            booked events, review invoices and stay connected with our
            hospitality team.
          </p>
        </div>

        <Button
          href="/dashboard/customer/booking"
          variant="secondary"
          size="lg"
          className="w-full border-mgh-text/25 bg-mgh-bg/40 backdrop-blur-sm hover:bg-mgh-bg/70 md:w-auto"
        >
          Plan an event
        </Button>
      </div>
    </header>
  );
}
