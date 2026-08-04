"use client";

import { Trash2, UtensilsCrossed, Calendar, Users } from "lucide-react";
import { useMenu } from "./MenuContext";

export function CartSidebar() {
  const { state, dispatch } = useMenu();

  const categories = [
    { label: "Starters", key: "starters", items: state.selections.starters },
    { label: "Mains", key: "mains", items: state.selections.mains },
    { label: "Desserts", key: "desserts", items: state.selections.desserts },
    { label: "Beverages", key: "beverages", items: state.selections.beverages },
  ];

  const hasItems = categories.some((c) => c.items.length > 0);
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <aside className="w-full lg:w-[360px] lg:flex-shrink-0">
      <div className="sticky top-6 border border-[#252525] bg-[#111111] p-6 shadow-2xl">
        {/* SIDEBAR TITLE */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={18} className="text-[#D4AF37]" />
            <h3 className="font-serif text-xl font-medium text-white">
              Your Menu
            </h3>
          </div>

          {hasItems && (
            <span className="border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-semibold text-[#D4AF37]">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </span>
          )}
        </div>

        {/* EMPTY STATE */}
        {!hasItems && (
          <div className="py-10 text-center">
            <p className="text-sm leading-6 text-[#777777]">
              No items selected yet. Choose dishes from the menu to build your
              custom catering package.
            </p>
          </div>
        )}

        {/* SELECTED ITEMS BY CATEGORY */}
        <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {categories.map(
            (cat) =>
              cat.items.length > 0 && (
                <div key={cat.key} className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                    {cat.label}
                  </span>

                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.item_id}
                        className="group flex items-center justify-between border border-[#222222] bg-[#161616] p-2.5 transition-colors hover:border-[#333333]"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="truncate text-sm font-medium text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#D4AF37]">
                            R{Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "REMOVE_ITEM",
                              payload: { category: cat.key, id: item.item_id },
                            })
                          }
                          className="text-[#666666] transition-colors hover:text-red-400"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>

        {/* METADATA SUMMARY */}
        {hasItems && (
          <div className="mt-6 border-t border-[#222222] pt-4">
            <div className="space-y-2 text-xs text-[#888888]">
              {state.guests && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#D4AF37]" />
                  <span>{state.guests} Guests planned</span>
                </div>
              )}
              {state.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#D4AF37]" />
                  <span>
                    {new Date(state.eventDate + "T12:00:00").toLocaleDateString(
                      "en-ZA",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-[#666666]">
              Final itemised pricing and package details will be generated upon
              submitting your quote request.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
