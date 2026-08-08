"use client";

import { useState, useEffect } from "react";
import BlurText from "@/app/components/dashboard/shared/BlurText";
import ActionCardsRow from "./ActionCardsRow";
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
    <section className="relative isolate mt-8 overflow-hidden">
      {/* Background image layer — same shot used behind the gallery hero */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/gallery_images/gallery-hero.png"
          alt=""
          className="h-full w-full object-cover"
        />

        {/* Overlay so the greeting + cards stay legible over the photo */}
        <div className="absolute inset-0 bg-[#0A0A0A]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/70" />
      </div>

      <div className="relative z-10 flex flex-col gap-10 p-10">
        {/* GREETING */}
        <div>
          <p className="mb-3 text-lg font-medium text-[#D4AF37]">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </p>

          <p className="text-lg text-[#A0A0A0]">Welcome back to</p>

          <BlurText
            text="Mlangeni Grand Hospitality"
            delay={120}
            animateBy="words"
            direction="top"
            className="mt-2 text-5xl font-bold leading-tight text-white"
          />

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A0A0A0]">
            Everything you need to manage your catering experience is right
            here. Track bookings, monitor upcoming events, review invoices and
            stay connected with our hospitality team.
          </p>
        </div>

        {/* ACTION CARDS — icon strip that expands to full cards on hover/click */}
        <ActionCardsRow />
      </div>
    </section>
  );
}
