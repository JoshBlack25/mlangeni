"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import { groupMenuItems } from "@/app/components/menu/constants";
import { MenuProvider, useMenu } from "@/app/components/menu/MenuContext";
import { ProgressBar } from "@/app/components/menu/ProgressBar";
import { CartSidebar } from "@/app/components/menu/CartSidebar";
import { StepRouter } from "@/app/components/menu/StepRouter";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function MenuBuilderPage() {
  return (
    <MenuProvider>
      <MenuBuilder />
    </MenuProvider>
  );
}

function MenuBuilder() {
  const { state, dispatch } = useMenu();
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const loadAll = useCallback(async () => {
    setMenuLoading(true);
    setMenuError("");

    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        throw new Error(
          "Please sign in to access the Interactive Menu Builder.",
        );
      }
      dispatch({ type: "SET_AUTH_USER", payload: user });

      const [customerRes, eventTypesRes, menuItemsRes] = await Promise.all([
        supabase
          .from("customer")
          .select(
            "customer_id, user_id, first_name, last_name, phone_number, email",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("event_type").select("*"),
        supabase
          .from("menu_item")
          .select(
            "item_id, category_id, name, description, price, is_alcoholic, image_url, available, category:category(name)",
          )
          .eq("available", true)
          .order("name"),
      ]);

      if (customerRes.error) throw new Error(customerRes.error.message);
      if (eventTypesRes.error) throw new Error(eventTypesRes.error.message);
      if (menuItemsRes.error) throw new Error(menuItemsRes.error.message);

      if (customerRes.data) {
        dispatch({ type: "SET_EXISTING_CUSTOMER", payload: customerRes.data });
      }

      dispatch({ type: "SET_EVENT_TYPES", payload: eventTypesRes.data || [] });

      const groupedMenu = groupMenuItems(menuItemsRes.data);

      if (groupedMenu.unmatchedCategories.length > 0) {
        console.warn(
          "[menu] these categories didn't map to a course and were shown " +
            `under "Additional Dishes": ${groupedMenu.unmatchedCategories.join(", ")}. ` +
            "Rename them in the admin menu editor to file them properly.",
        );
      }

      dispatch({ type: "SET_MENU", payload: groupedMenu });
    } catch (err) {
      setMenuError(
        err.message ||
          "Unable to retrieve database menu items. Please try again.",
      );
    } finally {
      setMenuLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    // Initial data fetch; the setState inside is the result of the request,
    // not state derivable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  return (
    <main className="bg-mgh-bg px-6 py-10 text-mgh-text md:px-10 lg:px-14">
      <section className="mx-auto max-w-[1500px]">
        <header className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mgh-gold">
            Bespoke Catering
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-mgh-text md:text-5xl">
            Interactive Menu Builder
          </h1>
          <div className="mt-4 h-px w-24 bg-gradient-to-r from-mgh-gold to-transparent" />
          <p className="mt-4 max-w-2xl text-sm text-mgh-muted md:text-base">
            Compose your event menu course by course, then send it to our
            culinary directors for a tailored quote.
          </p>
        </header>

        {menuLoading && <MenuSkeleton />}

        {!menuLoading && menuError && (
          <div className="my-10 rounded-2xl border border-mgh-danger/30 bg-mgh-danger/10 p-8 text-center">
            <AlertTriangle
              size={24}
              className="mx-auto text-mgh-danger"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-mgh-danger">{menuError}</p>
            <button
              type="button"
              onClick={loadAll}
              className="mt-6 rounded-xl border border-mgh-gold bg-mgh-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
            >
              Retry Loading
            </button>
          </div>
        )}

        {!menuLoading && !menuError && state.menu && (
          <>
            <ProgressBar />

            <div className="flex flex-col gap-10 lg:flex-row">
              <div className="min-w-0 flex-1">
                <StepRouter />
              </div>
              <CartSidebar />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

/** Card-shaped placeholders, so the layout doesn't jump when the menu lands. */
function MenuSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-10 h-10 animate-pulse rounded-full bg-mgh-surface" />

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1">
          <div className="mb-8 h-9 w-72 animate-pulse rounded-lg bg-mgh-surface" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-mgh-line bg-mgh-surface"
              >
                <div className="aspect-[4/3] animate-pulse bg-mgh-surface-3" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-mgh-surface-3" />
                  <div className="h-3 w-full animate-pulse rounded bg-mgh-surface-3" />
                  <div className="h-9 w-full animate-pulse rounded-lg bg-mgh-surface-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-[360px]">
          <div className="h-80 animate-pulse rounded-2xl border border-mgh-line bg-mgh-surface" />
        </aside>
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-mgh-faint">
        <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
        Loading menu…
      </p>
    </div>
  );
}
