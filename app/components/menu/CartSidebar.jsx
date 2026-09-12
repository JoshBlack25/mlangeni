"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronUp,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMenu } from "./MenuContext";
import { computeTotals, formatZAR, guestCount } from "./pricing";
import { formatDateShort } from "./availability";
import { useFocusTrap } from "./useFocusTrap";

const CATEGORIES = [
  { label: "Starters", key: "starters" },
  { label: "Mains", key: "mains" },
  { label: "Desserts", key: "desserts" },
  { label: "Beverages", key: "beverages" },
];

export function CartSidebar() {
  const { state, dispatch } = useMenu();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef(null);

  useFocusTrap(sheetRef, {
    active: sheetOpen,
    onEscape: () => setSheetOpen(false),
  });

  const categories = CATEGORIES.map((c) => ({
    ...c,
    items: state.selections[c.key] ?? [],
  }));

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const hasItems = totalItems > 0;
  const guests = guestCount(state.guests);
  const totals = computeTotals(state.selections, guests);

  const remove = (key, id) =>
    dispatch({ type: "REMOVE_ITEM", payload: { category: key, id } });

  const panel = (
    <div className="rounded-2xl border border-mgh-line bg-mgh-surface p-6 shadow-2xl lg:sticky lg:top-6">
      <div className="flex items-center justify-between border-b border-mgh-line-soft pb-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed
            size={18}
            className="text-mgh-gold"
            aria-hidden="true"
          />
          <h2 className="font-serif text-xl font-medium text-mgh-text">
            Your Menu
          </h2>
        </div>

        {hasItems && (
          <span className="rounded-full border border-mgh-gold/30 bg-mgh-gold/10 px-2.5 py-0.5 text-xs font-semibold text-mgh-gold">
            {totalItems} {totalItems === 1 ? "Item" : "Items"}
          </span>
        )}
      </div>

      {!hasItems ? (
        <div className="py-10 text-center">
          <p className="text-sm leading-6 text-mgh-faint">
            No items selected yet. Choose dishes from the menu to build your
            custom catering package.
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-[420px] space-y-5 overflow-y-auto pr-1">
          {categories.map(
            (cat) =>
              cat.items.length > 0 && (
                <div key={cat.key} className="space-y-2">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mgh-gold">
                    {cat.label}
                  </h3>

                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li
                        key={item.item_id}
                        className="flex items-center justify-between rounded-lg border border-mgh-line-soft bg-mgh-surface-2 p-2.5 transition-colors hover:border-mgh-line-strong"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="truncate text-sm font-medium text-mgh-text">
                            {item.name}
                          </p>
                          <p className="text-xs tabular-nums text-mgh-gold">
                            {formatZAR(item.price)}
                            <span className="text-mgh-faint"> / guest</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(cat.key, item.item_id)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded p-1 text-mgh-faint transition-colors hover:text-mgh-danger focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}

      {hasItems && (
        <div className="mt-6 border-t border-mgh-line-soft pt-4">
          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-mgh-dim">
              <dt>Per guest</dt>
              <dd className="tabular-nums">{formatZAR(totals.perGuest)}</dd>
            </div>
            <div className="flex items-center justify-between text-mgh-dim">
              <dt>Guests</dt>
              <dd className="tabular-nums">× {guests}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-2 text-mgh-gold">
              <dt className="text-[10px] font-semibold uppercase tracking-widest">
                Estimated total
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatZAR(totals.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 border-t border-mgh-line-soft pt-4 text-xs text-mgh-dim">
            {state.guests && (
              <p className="flex items-center gap-2">
                <Users size={13} className="text-mgh-gold" aria-hidden="true" />
                {state.guests} guests planned
              </p>
            )}
            {state.eventDate && (
              <p className="flex items-center gap-2">
                <Calendar
                  size={13}
                  className="text-mgh-gold"
                  aria-hidden="true"
                />
                {formatDateShort(state.eventDate)}
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-5 text-mgh-faint">
            An estimate for food and beverage. Staffing, transport and special
            arrangements are quoted separately.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-full lg:block lg:w-[360px] lg:shrink-0">
        {panel}
      </aside>

      {/* Mobile: a sticky summary bar that opens the same panel as a sheet. */}
      {hasItems && (
        <div className="lg:hidden">
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mgh-line bg-mgh-surface/95 px-4 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-mgh-gold/40 bg-mgh-gold/10 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
            >
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-mgh-gold">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
                <span className="block truncate text-sm font-semibold tabular-nums text-mgh-text">
                  {formatZAR(totals.total)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mgh-gold">
                View <ChevronUp size={14} aria-hidden="true" />
              </span>
            </button>
          </div>

          {/* Keeps the sticky bar from covering the step's own buttons. */}
          <div className="h-24" aria-hidden="true" />

          <AnimatePresence>
            {sheetOpen && (
              <div className="fixed inset-0 z-50 flex items-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSheetOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                  ref={sheetRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Your menu"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 max-h-[85vh] w-full overflow-y-auto p-4"
                >
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    aria-label="Close menu summary"
                    className="mb-3 ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-mgh-line bg-mgh-surface text-mgh-muted focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                  {panel}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
