"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Info, X } from "lucide-react";
import { useMenu } from "./MenuContext";
import { FoodImage } from "./FoodImage";
import { TAG_COLORS } from "./constants";

export function MenuStep({ category, title, subtitle, items }) {
  const { state, dispatch } = useMenu();
  const [modalItem, setModalItem] = useState(null);

  const selected = state.selections[category] || [];
  const selectedIds = new Set(selected.map((i) => i.item_id));

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[#A0A0A0] md:text-base">{subtitle}</p>
      </div>

      {/* ITEMS GRID */}
      <motion.div
        layout
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.item_id);

            return (
              <motion.article
                key={item.item_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`group relative flex flex-col justify-between border bg-[#111111] transition-all duration-300 ${
                  isSelected ? "border-[#D4AF37]" : "border-[#252525]"
                }`}
              >
                <div>
                  {/* CARD IMAGE */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <FoodImage
                      src={item.image_url}
                      alt={item.name}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/50" />

                    {/* CATEGORY / TAG BADGE */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                      {item.tags?.map((tag) => (
                        <span
                          key={tag}
                          className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm ${
                            TAG_COLORS[tag] ||
                            "border-white/20 bg-black/60 text-white"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* INFO QUICK VIEW BUTTON */}
                    <button
                      type="button"
                      onClick={() => setModalItem(item)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      aria-label="Quick details"
                    >
                      <Info size={16} />
                    </button>
                  </div>

                  {/* CARD DETAILS */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-medium text-white">
                        {item.name}
                      </h3>
                      <span className="text-sm font-semibold text-[#D4AF37]">
                        R{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#858585]">
                      {item.description ||
                        "Freshly crafted by our culinary experts."}
                    </p>
                  </div>
                </div>

                {/* ADD / REMOVE ACTION */}
                <div className="p-5 pt-0">
                  {isSelected ? (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_ITEM",
                          payload: { category, id: item.item_id },
                        })
                      }
                      className="flex w-full items-center justify-center gap-2 border border-[#D4AF37] bg-[#D4AF37] py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-all duration-300 hover:bg-transparent hover:text-[#D4AF37]"
                    >
                      <Check size={16} /> Selected
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "ADD_ITEM",
                          payload: { category, item },
                        })
                      }
                      className="flex w-full items-center justify-center gap-2 border border-[#333333] bg-[#161616] py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      <Plus size={16} /> Add to Menu
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ITEM DETAIL MODAL */}
      <AnimatePresence>
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-xl overflow-hidden border border-[#292929] bg-[#111111] p-6 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-white/20 bg-black/60 text-white hover:text-[#D4AF37]"
              >
                <X size={18} />
              </button>

              <div className="relative aspect-[16/9] w-full overflow-hidden border border-[#222222]">
                <FoodImage src={modalItem.image_url} alt={modalItem.name} />
              </div>

              <div className="mt-5">
                <span className="text-xs uppercase tracking-widest text-[#D4AF37]">
                  {modalItem.category_name || title}
                </span>
                <h3 className="font-serif text-2xl font-medium text-white">
                  {modalItem.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#A0A0A0]">
                  {modalItem.description ||
                    "Detailed dish description not provided."}
                </p>
                <p className="mt-4 text-lg font-semibold text-[#D4AF37]">
                  R{Number(modalItem.price).toFixed(2)}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVIGATION CONTROLS */}
      <div className="mt-10 flex items-center justify-between border-t border-[#222222] pt-6">
        {state.step > 0 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "PREV_STEP" })}
            className="border border-[#333333] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#A0A0A0] transition-colors hover:border-white hover:text-white"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-all hover:bg-transparent hover:text-[#D4AF37] disabled:opacity-30 disabled:hover:bg-[#D4AF37] disabled:hover:text-black"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
