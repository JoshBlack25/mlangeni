"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { useMenu } from "./MenuContext";
import { ItemCard } from "./ItemCard";
import { ItemDetailModal } from "./ItemDetailModal";

/**
 * A course-selection step (Starters, Mains, Desserts).
 *
 * @param {{label: string, items: object[]}[]} [groups]  optional sub-sections,
 *   used to surface items whose category didn't map to a known course under
 *   "Additional Dishes" instead of dropping them.
 */
export function MenuStep({ category, title, subtitle, items = [], groups }) {
  const { state, dispatch } = useMenu();
  const [modalItem, setModalItem] = useState(null);

  const selected = state.selections[category] || [];
  const selectedIds = new Set(selected.map((i) => i.item_id));

  const sections =
    groups?.filter((g) => g.items.length > 0) ??
    (items.length > 0 ? [{ label: null, items }] : []);

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  // A course with nothing on the menu must not dead-end the wizard — the old
  // version disabled "Next" whenever nothing was selected, which made an empty
  // category impossible to get past.
  const canProceed = totalItems === 0 || selected.length > 0;

  const toggle = (item, isSelected) => {
    dispatch(
      isSelected
        ? { type: "REMOVE_ITEM", payload: { category, id: item.item_id } }
        : { type: "ADD_ITEM", payload: { category, item } },
    );
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-mgh-text md:text-4xl">
            {title}
          </h2>
          {totalItems > 0 && (
            <span className="text-xs uppercase tracking-wider text-mgh-faint">
              {selected.length} of {totalItems} selected
            </span>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-mgh-muted md:text-base">
          {subtitle}
        </p>
      </header>

      {totalItems === 0 ? (
        <EmptyCourse title={title} />
      ) : (
        sections.map((section, i) => (
          <section key={section.label ?? "default"} className={i > 0 ? "mt-12" : ""}>
            {section.label && (
              <h3 className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold">
                {section.label}
                <span className="h-px flex-1 bg-mgh-line" aria-hidden="true" />
              </h3>
            )}

            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {section.items.map((item) => (
                  <ItemCard
                    key={item.item_id}
                    item={item}
                    selected={selectedIds.has(item.item_id)}
                    onToggle={toggle}
                    onInfo={setModalItem}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </section>
        ))
      )}

      <ItemDetailModal
        item={modalItem}
        categoryLabel={title}
        selected={modalItem ? selectedIds.has(modalItem.item_id) : false}
        onToggle={toggle}
        onClose={() => setModalItem(null)}
      />

      <div className="mt-10 flex items-center justify-between border-t border-mgh-line-soft pt-6">
        {state.step > 0 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "PREV_STEP" })}
            className="rounded-xl border border-mgh-line-strong px-6 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-muted transition-colors hover:border-mgh-text hover:text-mgh-text focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          title={canProceed ? undefined : `Choose at least one item to continue`}
          className="rounded-xl border border-mgh-gold bg-mgh-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-mgh-gold disabled:hover:text-mgh-gold-ink"
        >
          {totalItems === 0 ? "Skip →" : "Next Step →"}
        </button>
      </div>
    </div>
  );
}

function EmptyCourse({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-mgh-line bg-mgh-surface px-6 py-16 text-center">
      <UtensilsCrossed
        size={28}
        className="mx-auto text-mgh-line-strong"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm text-mgh-muted">
        Nothing is on the {title.toLowerCase()} menu at the moment.
      </p>
      <p className="mt-1.5 text-xs text-mgh-faint">
        Continue to the next course — you can note any special requests later.
      </p>
    </div>
  );
}
