"use client";

import { motion } from "framer-motion";
import { Check, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/app/components/dashboard/ui";
import { FoodImage } from "./FoodImage";
import { formatZAR } from "./pricing";

/**
 * One selectable dish or drink.
 *
 * Shared by MenuStep and BeverageStep, which previously carried two nearly
 * identical copies of this markup that had already drifted apart.
 */
export function ItemCard({
  item,
  selected = false,
  onToggle,
  onInfo,
  aspect = "aspect-[4/3]",
  addLabel = "Add to Menu",
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-card border bg-mgh-surface",
        "transition-[border-color,box-shadow] duration-[var(--mgh-dur)] ease-mgh",
        selected
          ? "border-mgh-gold ring-1 ring-mgh-gold/35"
          : "border-mgh-line hover:border-mgh-line-strong",
      )}
    >
      {selected && (
        <span
          className="absolute right-0 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-bl-card bg-mgh-gold text-mgh-gold-ink"
          aria-hidden="true"
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}

      <div>
        <div className={cn("relative w-full overflow-hidden", aspect)}>
          <FoodImage
            src={item.image_url}
            alt={item.name}
            className="object-cover transition-transform duration-[900ms] ease-mgh group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-mgh-bg/45 to-transparent" />

          {item.tags?.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-control border border-mgh-line-strong bg-mgh-bg/75 px-2 py-0.5",
                    "text-[10px] font-semibold uppercase tracking-[0.12em] text-mgh-text backdrop-blur-sm",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {onInfo && (
            <button
              type="button"
              onClick={() => onInfo(item)}
              aria-label={`More about ${item.name}`}
              className={cn(
                "absolute right-3 top-3 flex size-9 items-center justify-center rounded-control border border-mgh-line-strong bg-mgh-bg/75 text-mgh-text backdrop-blur-sm transition-colors hover:border-mgh-muted",
                focusRing,
              )}
            >
              <Info size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-[1.125rem] font-medium leading-snug text-mgh-text">
              {item.name}
            </h3>
            <span className="shrink-0 pt-0.5 text-sm tabular-nums lining-nums text-mgh-muted">
              {formatZAR(item.price)}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-mgh-dim">
            {item.description || "Freshly crafted by our culinary experts."}
          </p>
        </div>
      </div>

      <div className="p-5 pt-0">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onToggle(item, selected)}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-control border text-sm font-medium",
            "transition-[background-color,border-color,color,transform] duration-[var(--mgh-dur-fast)] ease-mgh active:scale-[0.98]",
            focusRing,
            selected
              ? "border-mgh-gold bg-mgh-gold text-mgh-gold-ink hover:bg-mgh-gold-hover"
              : "border-mgh-line-strong text-mgh-text hover:border-mgh-muted hover:bg-mgh-surface-2",
          )}
        >
          {selected ? (
            <>
              <Check size={15} aria-hidden="true" /> Selected
            </>
          ) : (
            <>
              <Plus size={15} aria-hidden="true" /> {addLabel}
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
