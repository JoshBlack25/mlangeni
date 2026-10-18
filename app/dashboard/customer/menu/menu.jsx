"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Dialog,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  focusRing,
  formatCurrency,
} from "@/app/components/dashboard/ui";
import { EASE } from "@/app/components/dashboard/shared/motion";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  // Kept separate from the item so the title stays put while the dialog
  // animates closed.
  const [itemOpen, setItemOpen] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    async function loadData() {
      setLoadingData(true);

      const [categoryRes, itemRes] = await Promise.all([
        supabase.from("category").select("category_id, name").order("name"),
        supabase
          .from("menu_item")
          .select(
            "item_id, name, description, price, is_alcoholic, image_url, category:category_id(name)",
          )
          .eq("available", true)
          .order("name"),
      ]);

      if (categoryRes.error) setError(categoryRes.error.message);
      if (itemRes.error) setError(itemRes.error.message);

      setCategories(categoryRes.data ?? []);
      setMenuItems(itemRes.data ?? []);
      setLoadingData(false);
    }

    loadData();
  }, [checkingAuth]);

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category?.name === activeCategory);

  if (checkingAuth || loadingData) {
    return (
      <div role="status">
        <span className="sr-only">Loading menu...</span>
        <Skeleton className="h-10 w-48 md:h-12" />
        <Skeleton className="mt-8 h-8 w-full md:mt-12" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-72 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  const tabItems = [
    { value: "All", label: "All" },
    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="flex flex-col gap-8"
    >
      <PageHeader title="Our Menu" className="mb-0 md:mb-0" />

      {error && (
        <p role="alert" className="text-sm text-mgh-danger">
          {error}
        </p>
      )}

      {/* CATEGORY TABS */}
      <Tabs
        items={tabItems}
        value={activeCategory}
        onChange={setActiveCategory}
        label="Menu categories"
      />

      {/* LIVE ITEM GRID */}
      {filteredItems.length === 0 ? (
        <EmptyState title="No items in this category yet." align="start" />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <li key={item.item_id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(item);
                  setItemOpen(true);
                }}
                aria-haspopup="dialog"
                className={cn(
                  "flex h-full w-full flex-col overflow-hidden rounded-card border border-mgh-line bg-mgh-surface text-left",
                  "transition-colors duration-(--mgh-dur-fast) ease-mgh hover:border-mgh-line-strong hover:bg-mgh-surface-2",
                  focusRing,
                )}
              >
                <span className="relative grid aspect-[4/3] w-full place-items-center border-b border-mgh-line-soft bg-mgh-surface-2">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <UtensilsCrossed
                      size={16}
                      aria-hidden="true"
                      className="text-mgh-dim"
                    />
                  )}
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="text-[15px] font-medium text-mgh-text">
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-mgh-muted">
                      {item.description}
                    </span>
                  )}
                  <span className="mt-auto flex items-baseline justify-between gap-3 pt-4">
                    <span className="font-serif text-xl font-medium tabular-nums text-mgh-text">
                      {formatCurrency(item.price)}
                    </span>
                    {item.is_alcoholic && (
                      <span className="text-label font-semibold uppercase text-mgh-dim">
                        Alcoholic
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ITEM MODAL */}
      <Dialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        title={selectedItem?.name ?? "Menu item"}
        description={selectedItem?.description}
        describe={Boolean(selectedItem?.description)}
        size="sm"
      >
        {selectedItem && (
          <p className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-medium tabular-nums text-mgh-text">
              {formatCurrency(selectedItem.price)}
            </span>
            {selectedItem.is_alcoholic && (
              <span className="text-label font-semibold uppercase text-mgh-dim">
                Alcoholic
              </span>
            )}
          </p>
        )}
      </Dialog>
    </motion.div>
  );
}
