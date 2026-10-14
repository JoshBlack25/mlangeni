"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import { groupMenuItems } from "@/app/components/menu/constants";
import { MenuProvider, useMenu } from "@/app/components/menu/MenuContext";
import { ProgressBar } from "@/app/components/menu/ProgressBar";
import { CartSidebar } from "@/app/components/menu/CartSidebar";
import { StepRouter } from "@/app/components/menu/StepRouter";
import { RefreshCw } from "lucide-react";
import {
  Button,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/app/components/dashboard/ui";
import {
  getActiveBookingMessage,
  getActiveCustomerBooking,
} from "@/app/utils/customerBookingRules";

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
  // A customer may only have one live booking at a time; while they do, the
  // builder is closed rather than letting them compose a menu they can't send.
  const [activeBooking, setActiveBooking] = useState(null);

  const loadAll = useCallback(async () => {
    setMenuLoading(true);
    setMenuError("");
    setActiveBooking(null);

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
        setActiveBooking(
          await getActiveCustomerBooking(
            supabase,
            customerRes.data.customer_id,
          ),
        );
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
    <div className="text-mgh-text">
      <PageHeader
        title="Interactive Menu Builder"
        lead="Compose your event menu course by course, then send it to our culinary directors for a tailored quote."
      />

      {menuLoading && <MenuSkeleton />}

      {!menuLoading && menuError && (
        <Panel className="max-w-2xl">
          <p role="alert" className="text-body text-mgh-danger">
            {menuError}
          </p>
          <Button
            variant="primary"
            onClick={loadAll}
            className="mt-6 w-full sm:w-auto"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Retry Loading
          </Button>
        </Panel>
      )}

      {!menuLoading && !menuError && activeBooking && (
        <Panel className="max-w-2xl">
          <PanelHeader
            title="Active Booking In Progress"
            description={getActiveBookingMessage(activeBooking)}
            className="mb-6"
          />
          <Button
            variant="primary"
            href="/dashboard/customer/orders"
            className="w-full sm:w-auto"
          >
            View My Bookings
          </Button>
        </Panel>
      )}

      {!menuLoading && !menuError && !activeBooking && state.menu && (
        <>
          <ProgressBar />

          <div className="flex flex-col gap-8 md:gap-10 lg:flex-row">
            <div className="min-w-0 flex-1">
              <StepRouter />
            </div>
            <CartSidebar />
          </div>
        </>
      )}
    </div>
  );
}

/** Card-shaped placeholders, so the layout doesn't jump when the menu lands. */
function MenuSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading menu…</span>
      <Skeleton className="mb-10 h-10 rounded-full" />

      <div className="flex flex-col gap-8 md:gap-10 lg:flex-row">
        <div className="flex-1">
          <Skeleton className="mb-8 h-9 w-72 max-w-full" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-card border border-mgh-line bg-mgh-surface"
              >
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-[360px]">
          <Skeleton className="h-80 rounded-card" />
        </aside>
      </div>
    </div>
  );
}
