"use client";

import { useMenu } from "./MenuContext";
import { FoodImage } from "./FoodImage";
import { Plus, Check } from "lucide-react";

export function BeverageStep() {
  const { state, dispatch } = useMenu();
  const menu = state.menu;

  const getBeverageItems = () => {
    if (state.beverageTypeChoice === "alcoholic")
      return menu.beverages.alcoholic;
    if (state.beverageTypeChoice === "non_alcoholic")
      return menu.beverages.non_alcoholic;
    if (state.beverageTypeChoice === "both")
      return [...menu.beverages.alcoholic, ...menu.beverages.non_alcoholic];
    return [];
  };

  const selected = state.selections.beverages;
  const selectedIds = new Set(selected.map((i) => i.item_id));
  const availableItems = getBeverageItems();

  const canProceed =
    state.beverageChoice === "no" ||
    (state.beverageChoice === "yes" && selected.length > 0);

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          Refreshments & Beverages
        </h2>
        <p className="mt-2 text-sm text-[#A0A0A0] md:text-base">
          Complement your menu with our chilled non-alcoholic or alcoholic
          drinks packages.
        </p>
      </div>

      {/* CHOICE 1: INCLUDE BEVERAGES? */}
      <div className="mb-8">
        <label className="mb-3 block text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          Would you like to include beverages?
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            [
              "yes",
              "Yes, include beverages",
              "Add curated drinks to my event quote",
            ],
            ["no", "No thanks", "Food items only for this event"],
          ].map(([val, label, sub]) => (
            <button
              key={val}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_BEVERAGE_CHOICE", payload: val })
              }
              className={`border p-5 text-left transition-all ${
                state.beverageChoice === val
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-[#252525] bg-[#111111] hover:border-[#444444]"
              }`}
            >
              <span className="block font-serif text-lg text-white">
                {label}
              </span>
              <span className="mt-1 block text-xs text-[#888888]">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CHOICE 2: DRINK TYPE */}
      {state.beverageChoice === "yes" && (
        <div className="mb-8">
          <label className="mb-3 block text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            Beverage Preference
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["alcoholic", "Alcoholic", "Wine, beer & spirits"],
              [
                "non_alcoholic",
                "Non-Alcoholic",
                "Fresh juices, mocktails & sodas",
              ],
              ["both", "Full Service (Both)", "Complete bar setup"],
            ].map(([val, label, sub]) => (
              <button
                key={val}
                type="button"
                onClick={() =>
                  dispatch({ type: "SET_BEVERAGE_TYPE", payload: val })
                }
                className={`border p-4 text-left transition-all ${
                  state.beverageTypeChoice === val
                    ? "border-[#D4AF37] bg-[#D4AF37]/10"
                    : "border-[#252525] bg-[#111111] hover:border-[#444444]"
                }`}
              >
                <span className="block text-base font-medium text-white">
                  {label}
                </span>
                <span className="mt-1 block text-xs text-[#888888]">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SELECTION GRID */}
      {state.beverageChoice === "yes" && state.beverageTypeChoice && (
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {availableItems.map((item) => {
            const isSelected = selectedIds.has(item.item_id);

            return (
              <div
                key={item.item_id}
                className={`flex flex-col justify-between border bg-[#111111] p-5 transition-all ${
                  isSelected ? "border-[#D4AF37]" : "border-[#252525]"
                }`}
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <FoodImage src={item.image_url} alt={item.name} />
                  </div>
                  <h3 className="mt-4 text-base font-medium text-white">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#888888]">
                    {item.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#D4AF37]">
                    R{Number(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="mt-4">
                  {isSelected ? (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_ITEM",
                          payload: { category: "beverages", id: item.item_id },
                        })
                      }
                      className="flex w-full items-center justify-center gap-2 border border-[#D4AF37] bg-[#D4AF37] py-2 text-xs font-semibold uppercase text-black"
                    >
                      <Check size={15} /> Selected
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "ADD_ITEM",
                          payload: { category: "beverages", item },
                        })
                      }
                      className="flex w-full items-center justify-center gap-2 border border-[#333333] bg-[#161616] py-2 text-xs font-semibold uppercase text-white hover:border-[#D4AF37]"
                    >
                      <Plus size={15} /> Add Drink
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NAVIGATION CONTROLS */}
      <div className="mt-10 flex items-center justify-between border-t border-[#222222] pt-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="border border-[#333333] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#A0A0A0] transition-colors hover:border-white hover:text-white"
        >
          ← Back
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-all hover:bg-transparent hover:text-[#D4AF37] disabled:opacity-30"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
