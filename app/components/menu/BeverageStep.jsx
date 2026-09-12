"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu } from "./MenuContext";
import { ItemCard } from "./ItemCard";
import { ItemDetailModal } from "./ItemDetailModal";

const INCLUDE_OPTIONS = [
  {
    value: "yes",
    label: "Yes, include beverages",
    sub: "Add curated drinks to my event quote",
  },
  { value: "no", label: "No thanks", sub: "Food items only for this event" },
];

const TYPE_OPTIONS = [
  { value: "alcoholic", label: "Alcoholic", sub: "Wine, beer & spirits" },
  {
    value: "non_alcoholic",
    label: "Non-Alcoholic",
    sub: "Fresh juices, mocktails & sodas",
  },
  { value: "both", label: "Full Service (Both)", sub: "Complete bar setup" },
];

export function BeverageStep() {
  const { state, dispatch } = useMenu();
  const menu = state.menu;
  const [modalItem, setModalItem] = useState(null);

  const beveragesFor = (choice) => {
    if (choice === "alcoholic") return menu.beverages.alcoholic;
    if (choice === "non_alcoholic") return menu.beverages.non_alcoholic;
    if (choice === "both")
      return [...menu.beverages.alcoholic, ...menu.beverages.non_alcoholic];
    return [];
  };

  const selected = state.selections.beverages;
  const selectedIds = new Set(selected.map((i) => i.item_id));
  const availableItems = beveragesFor(state.beverageTypeChoice);

  const canProceed =
    state.beverageChoice === "no" ||
    (state.beverageChoice === "yes" &&
      (selected.length > 0 || availableItems.length === 0));

  const toggle = (item, isSelected) => {
    dispatch(
      isSelected
        ? {
            type: "REMOVE_ITEM",
            payload: { category: "beverages", id: item.item_id },
          }
        : { type: "ADD_ITEM", payload: { category: "beverages", item } },
    );
  };

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-mgh-text md:text-4xl">
          Refreshments &amp; Beverages
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mgh-muted md:text-base">
          Complement your menu with our chilled non-alcoholic or alcoholic
          drinks packages.
        </p>
      </header>

      <ChoiceGroup
        legend="Would you like to include beverages?"
        options={INCLUDE_OPTIONS}
        value={state.beverageChoice}
        onChange={(value) =>
          dispatch({ type: "SET_BEVERAGE_CHOICE", payload: value })
        }
        columns="sm:grid-cols-2"
        emphasis
      />

      <AnimatePresence initial={false}>
        {state.beverageChoice === "yes" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ChoiceGroup
              legend="Beverage preference"
              options={TYPE_OPTIONS.map((o) => ({
                ...o,
                count: beveragesFor(o.value).length,
              }))}
              value={state.beverageTypeChoice}
              onChange={(value) =>
                dispatch({ type: "SET_BEVERAGE_TYPE", payload: value })
              }
              columns="sm:grid-cols-3"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {state.beverageChoice === "yes" && state.beverageTypeChoice && (
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
              Select your drinks
            </h3>
            {availableItems.length > 0 && (
              <span className="text-xs uppercase tracking-wider text-mgh-faint">
                {selected.length} of {availableItems.length} selected
              </span>
            )}
          </div>

          {availableItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-mgh-line bg-mgh-surface px-6 py-14 text-center">
              <Wine
                size={26}
                className="mx-auto text-mgh-line-strong"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm text-mgh-muted">
                No drinks are listed in this category right now.
              </p>
              <p className="mt-1.5 text-xs text-mgh-faint">
                Try another preference, or continue and mention your drinks in
                the notes.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {availableItems.map((item) => (
                  <ItemCard
                    key={item.item_id}
                    item={item}
                    selected={selectedIds.has(item.item_id)}
                    onToggle={toggle}
                    onInfo={setModalItem}
                    aspect="aspect-[16/9]"
                    addLabel="Add Drink"
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      )}

      <ItemDetailModal
        item={modalItem}
        categoryLabel="Beverages"
        selected={modalItem ? selectedIds.has(modalItem.item_id) : false}
        onToggle={toggle}
        onClose={() => setModalItem(null)}
      />

      <div className="mt-10 flex items-center justify-between border-t border-mgh-line-soft pt-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="rounded-xl border border-mgh-line-strong px-6 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-muted transition-colors hover:border-mgh-text hover:text-mgh-text focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
        >
          ← Back
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          className="rounded-xl border border-mgh-gold bg-mgh-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-mgh-gold disabled:hover:text-mgh-gold-ink"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}

/** Card-style radio group — real radio semantics, not a row of buttons. */
function ChoiceGroup({ legend, options, value, onChange, columns, emphasis }) {
  return (
    <fieldset className="mb-8">
      <legend className="mb-3 block text-xs uppercase tracking-[0.2em] text-mgh-gold">
        {legend}
      </legend>

      <div className={cn("grid grid-cols-1 gap-4", columns)} role="radiogroup">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-xl border p-5 text-left transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold/50",
                active
                  ? "border-mgh-gold bg-mgh-gold/10"
                  : "border-mgh-line bg-mgh-surface hover:-translate-y-0.5 hover:border-mgh-line-strong",
              )}
            >
              <span
                className={cn(
                  "block text-mgh-text",
                  emphasis ? "font-serif text-lg" : "text-base font-medium",
                )}
              >
                {opt.label}
              </span>
              <span className="mt-1 block text-xs text-mgh-dim">{opt.sub}</span>
              {typeof opt.count === "number" && (
                <span className="mt-2.5 block text-[10px] uppercase tracking-wider text-mgh-faint">
                  {opt.count} {opt.count === 1 ? "drink" : "drinks"} available
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
