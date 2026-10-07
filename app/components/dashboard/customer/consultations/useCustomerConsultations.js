"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { getCustomerForUser } from "@/app/utils/customerBookingRules";

const listFields = `
  consultations_id, customer_id, order_id, status, created_at, meeting_date,
  customer:customer_id ( first_name, last_name, email ),
  order:order_id!inner ( order_id, status, event_date, number_of_guest, event_type ( event_name ) )
`;

const detailFields = `
  consultations_id, customer_id, order_id, status, created_at, meeting_date, note,
  customer:customer_id ( user_id, first_name, last_name, email, phone_number ),
  order:order_id!inner (
    order_id, status, total_price, event_date, start_time, end_time,
    event_location, number_of_guest, event_type ( event_name ),
    customer_menu_items (
      custom_menu_id, quantity, menu_item ( item_id, name, description, price )
    ),
    premade_menu (
      name, premade_menu_items ( menu_item ( item_id, name, description, price ) )
    )
  )
`;

export function useCustomerConsultations(consultationId) {
  const router = useRouter();
  const [consultations, setConsultations] = useState(null);
  const [error, setError] = useState(null);
  const [loadedId, setLoadedId] = useState(consultationId);

  useEffect(() => {
    let mounted = true;
    let channel;
    let timer;
    let refresh;
    let version = 0;

    async function initialize() {
      try {
        setConsultations(null);
        setError(null);
        setLoadedId(consultationId);
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          router.replace("/login");
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);
        if (!mounted) return;
        if (!customer) {
          setConsultations([]);
          return;
        }

        refresh = async () => {
          const currentVersion = ++version;
          let query = supabase
            .from("consultations")
            .select(consultationId ? detailFields : listFields)
            .eq("customer_id", customer.customer_id)
            .in("status", ["requested", "scheduled", "completed"])
            .not("order_id", "is", null)
            .neq("order.status", "cancelled")
            .order("created_at", { ascending: false });

          if (consultationId)
            query = query.eq("consultations_id", consultationId);
          const { data, error: loadError } = await query;
          if (!mounted || currentVersion !== version) return;

          if (loadError) {
            setError(loadError.message || "Unable to load your consultations.");
            setConsultations((current) => current ?? []);
            return;
          }

          setError(null);
          setConsultations(data ?? []);
        };

        channel = supabase
          .channel(
            `customer-consultations-${customer.customer_id}-${consultationId ?? "list"}`,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "consultations",
              filter: `customer_id=eq.${customer.customer_id}`,
            },
            refresh,
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `customer_id=eq.${customer.customer_id}`,
            },
            refresh,
          )
          .subscribe();

        await refresh();
        if (!mounted) return;
        window.addEventListener("focus", refresh);
        timer = window.setInterval(() => {
          if (document.visibilityState === "visible") refresh();
        }, 15000);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your consultations.");
          setConsultations([]);
        }
      }
    }

    initialize();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      if (timer) window.clearInterval(timer);
      if (refresh) window.removeEventListener("focus", refresh);
    };
  }, [consultationId, router]);

  const matchesPage = loadedId === consultationId;
  return {
    consultations: matchesPage ? consultations : null,
    error: matchesPage ? error : null,
  };
}
