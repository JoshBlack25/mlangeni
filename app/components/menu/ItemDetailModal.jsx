"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogDescription, DialogTitle, focusRing } from "@/app/components/dashboard/ui";
import { FoodImage } from "./FoodImage";
import { formatZAR } from "./pricing";

/**
 * Full detail view for one dish, on the kit Dialog (focus trap, Escape,
 * scroll lock and focus return come from there). It also carries the
 * add/remove action, so opening it is never a dead end.
 */
export function ItemDetailModal({
  item,
  categoryLabel,
  selected = false,
  onToggle,
  onClose,
}) {
  // Keep showing the last dish while the dialog animates closed.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);
  const dish = item ?? shown;

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="md"
      className="sm:p-0"
    >
      {dish && (
        <>
          <div className="relative -mx-6 -mt-6 aspect-video overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-t-sheet">
            <FoodImage src={dish.image_url} alt={dish.name} />
          </div>

          <div className="pt-5 sm:px-7 sm:pb-7">
            <p className="text-label font-semibold uppercase text-mgh-muted">
              {dish.category_name || categoryLabel}
            </p>
            <DialogTitle className="mt-2 font-serif text-title font-medium text-mgh-text">
              {dish.name}
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-7 text-mgh-muted">
              {dish.description ||
                "Our chefs prepare this to order. Ask us for the full detail when we confirm your quote."}
            </DialogDescription>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-medium tabular-nums lining-nums text-mgh-text">
                {formatZAR(dish.price)}
              </span>
              <span className="text-caption text-mgh-dim">per guest</span>
            </p>

            {onToggle && (
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(dish, selected)}
                className={cn(
                  "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-control border text-[15px] font-medium",
                  "transition-[background-color,border-color,color,transform] duration-[var(--mgh-dur-fast)] ease-mgh active:scale-[0.98]",
                  focusRing,
                  selected
                    ? "border-mgh-gold bg-mgh-gold text-mgh-gold-ink hover:bg-mgh-gold-hover"
                    : "border-mgh-line-strong text-mgh-text hover:border-mgh-muted hover:bg-mgh-surface-2",
                )}
              >
                {selected ? (
                  <>
                    <Check size={16} aria-hidden="true" /> Remove from menu
                  </>
                ) : (
                  <>
                    <Plus size={16} aria-hidden="true" /> Add to menu
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
