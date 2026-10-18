"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

export default function AdminHero() {
  const [firstName, setFirstName] = useState(null);

  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("admin")
        .select("first_name")
        .eq("user_id", user.id)
        .single();

      if (data?.first_name) {
        setFirstName(data.first_name);
      }
    }

    loadAdmin();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  };

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="flex flex-col gap-1">
      <p className="text-sm text-mgh-muted">
        {getGreeting()}
        {firstName ? `, ${firstName}` : ""}
      </p>
      <h1 className="font-serif text-display-sm font-medium text-mgh-text">{today}</h1>
      <p className="mt-1 max-w-2xl text-sm text-mgh-dim">
        Stay on top of enquiries, orders, and consultations.
      </p>
    </header>
  );
}
