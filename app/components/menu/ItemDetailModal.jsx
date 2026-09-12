"use client";

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodImage } from "./FoodImage";
import { formatZAR } from "./pricing";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Full detail view for one dish.
 *
 * Portalled to <body> so it escapes any transformed ancestor, with a focus
 * trap, Escape handling and a scroll lock — none of which the inline version
 * inside MenuStep had. It also carries the add/remove action, which previously
 * meant opening the modal was a dead end you had to back out of.
 */
export function ItemDetailModal({
  item,
  categoryLabel,
  selected = false,
  onToggle,
  onClose,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(panelRef, { active: !!item, onEscape: onClose });

  // No portal target on the server. Safe for hydration because `item` is
  // always null on the first client render too — the modal only opens from a
  // click — so both passes render nothing.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-mgh-line bg-mgh-surface p-6 text-mgh-text shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-mgh-text backdrop-blur-sm transition-colors hover:border-mgh-gold hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/50"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-mgh-line-soft">
              <FoodImage src={item.image_url} alt={item.name} />
            </div>

            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-mgh-gold">
                {item.category_name || categoryLabel}
              </p>
              <h3
                id={titleId}
                className="mt-1.5 font-serif text-2xl font-medium text-mgh-text"
              >
                {item.name}
              </h3>
              <p
                id={descId}
                className="mt-3 text-sm leading-7 text-mgh-muted"
              >
                {item.description ||
                  "Our chefs prepare this to order — ask us for the full detail when we confirm your quote."}
              </p>
              <p className="mt-4 text-lg font-semibold tabular-nums text-mgh-gold">
                {formatZAR(item.price)}{" "}
                <span className="text-xs font-normal text-mgh-faint">
                  per guest
                </span>
              </p>
            </div>

            {onToggle && (
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(item, selected)}
                className={cn(
                  "mt-6 flex w-full items-center justify-center gap-2 rounded-xl border py-3",
                  "text-xs font-semibold uppercase tracking-widest transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-mgh-gold/40",
                  selected
                    ? "border-mgh-gold bg-mgh-gold text-mgh-gold-ink hover:bg-transparent hover:text-mgh-gold"
                    : "border-mgh-line-strong bg-mgh-surface-2 text-mgh-text hover:border-mgh-gold hover:text-mgh-gold",
                )}
              >
                {selected ? (
                  <>
                    <Check size={15} aria-hidden="true" /> Remove from menu
                  </>
                ) : (
                  <>
                    <Plus size={15} aria-hidden="true" /> Add to menu
                  </>
                )}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
