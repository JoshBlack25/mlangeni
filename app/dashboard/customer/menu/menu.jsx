"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UtensilsCrossed, X } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import "./menu.css";

export default function MenuPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

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
      <div className="mgh-menu-page">
        <div className="mgh-spinner-wrap">
          <div className="mgh-spinner"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgh-menu-page">
      <h1>Our Menu</h1>
      <div className="mgh-menu-line"></div>

      {error && <p className="mgh-menu-error">{error}</p>}

      {/* CATEGORY TABS */}
      <div className="mgh-menu-tabs">
        <div className="mgh-menu-tabs-inner">
          <button
            className={`mgh-menu-tab${activeCategory === "All" ? " active" : ""}`}
            onClick={() => setActiveCategory("All")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              className={`mgh-menu-tab${activeCategory === cat.name ? " active" : ""}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE ITEM GRID */}
      {filteredItems.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>
          No items in this category yet.
        </p>
      ) : (
        <div className="mgh-item-grid">
          {filteredItems.map((item) => (
            <div
              key={item.item_id}
              className="mgh-item-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="mgh-item-image">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="240px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <UtensilsCrossed size={28} />
                )}
              </div>
              <div className="mgh-item-body">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className="mgh-item-price">
                  R{Number(item.price).toFixed(2)}
                  {item.is_alcoholic && " · Alcoholic"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ITEM MODAL */}
      {selectedItem && (
        <div
          className="mgh-modal-backdrop"
          onClick={() => setSelectedItem(null)}
        >
          <div className="mgh-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="mgh-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3>{selectedItem.name}</h3>
            <p>{selectedItem.description}</p>
            <span className="mgh-modal-price">
              R{Number(selectedItem.price).toFixed(2)}
              {selectedItem.is_alcoholic && " · Alcoholic"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
