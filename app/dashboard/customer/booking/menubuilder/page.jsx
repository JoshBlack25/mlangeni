"use client";

import { useState, useEffect, useReducer } from "react";
import { supabase } from "@/services/supabaseClient";
import { matchCategoryKey } from "@/app/components/menu/constants";
import {
  initialState,
  reducer,
  MenuProvider,
} from "@/app/components/menu/MenuContext";
import { ProgressBar } from "@/app/components/menu/ProgressBar";
import { CartSidebar } from "@/app/components/menu/CartSidebar";
import { StepRouter } from "@/app/components/menu/StepRouter";
import { UtensilsCrossed, RefreshCw } from "lucide-react";

export default function MenuBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const loadAll = async () => {
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

      const [customerRes, eventTypesRes, menuItemsRes, categoriesRes] =
        await Promise.all([
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
          supabase.from("category").select("category_id, name"),
        ]);

      if (customerRes.error) throw new Error(customerRes.error.message);
      if (eventTypesRes.error) throw new Error(eventTypesRes.error.message);
      if (menuItemsRes.error) throw new Error(menuItemsRes.error.message);
      if (categoriesRes.error) throw new Error(categoriesRes.error.message);

      if (customerRes.data) {
        dispatch({ type: "SET_EXISTING_CUSTOMER", payload: customerRes.data });
      }

      dispatch({ type: "SET_EVENT_TYPES", payload: eventTypesRes.data || [] });

      const menuItems = (menuItemsRes.data || []).map((row) => {
        const categoryName =
          row.category && Array.isArray(row.category)
            ? row.category[0]?.name
            : row.category?.name;

        const tags = [];
        const matchedKey = matchCategoryKey(categoryName);
        if (matchedKey === "beverages") {
          tags.push(row.is_alcoholic ? "alcoholic" : "non-alcoholic");
        }

        return {
          item_id: row.item_id,
          category_id: row.category_id,
          category_name: categoryName,
          name: row.name,
          description: row.description,
          price: row.price,
          is_alcoholic: row.is_alcoholic,
          image_url: row.image_url,
          available: row.available,
          tags,
        };
      });

      const groupedMenu = {
        starters: [],
        mains: [],
        desserts: [],
        beverages: { alcoholic: [], non_alcoholic: [] },
      };

      for (const item of menuItems) {
        const key = matchCategoryKey(item.category_name);
        if (key === "beverages") {
          if (item.is_alcoholic) groupedMenu.beverages.alcoholic.push(item);
          else groupedMenu.beverages.non_alcoholic.push(item);
        } else if (key) {
          groupedMenu[key].push(item);
        }
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
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <MenuProvider value={{ state, dispatch }}>
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
        <section className="mx-auto max-w-[1500px]">
          {/* LOADING STATE */}
          {menuLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw size={30} className="animate-spin text-[#D4AF37]" />
              <p className="mt-4 text-sm tracking-widest text-[#888888] uppercase">
                Loading database menu...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {!menuLoading && menuError && (
            <div className="my-10 border border-red-500/30 bg-red-950/20 p-8 text-center">
              <p className="text-sm text-red-400">{menuError}</p>
              <button
                type="button"
                onClick={loadAll}
                className="mt-6 border border-[#D4AF37] bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-black"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* ACTIVE BUILDER INTERFACE */}
          {!menuLoading && !menuError && state.menu && (
            <>
              <ProgressBar />

              <div className="flex flex-col gap-10 lg:flex-row">
                <div className="flex-1">
                  <StepRouter />
                </div>
                <CartSidebar />
              </div>
            </>
          )}
        </section>
      </main>
    </MenuProvider>
  );
}
