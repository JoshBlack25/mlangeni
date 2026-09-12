"use client";

import { motion } from "framer-motion";
import { Check, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodImage } from "./FoodImage";
import { TAG_COLORS } from "./constants";
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
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-mgh-surface",
        "transition-all duration-300 hover:-translate-y-1",
        selected
          ? "border-mgh-gold shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_18px_40px_-24px_rgba(212,175,55,0.5)]"
          : "border-mgh-line hover:border-mgh-line-strong hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]",
      )}
    >
      {selected && (
        <span
          className="absolute right-0 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-bl-xl bg-mgh-gold text-mgh-gold-ink"
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
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/45" />

          {item.tags?.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-lg border px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm",
                    TAG_COLORS[tag] || "border-white/20 bg-black/60 text-white",
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
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-mgh-gold hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/50"
            >
              <Info size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-medium leading-snug text-mgh-text">
              {item.name}
            </h3>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-mgh-gold">
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
            "flex w-full items-center justify-center gap-2 rounded-lg border py-2.5",
            "text-xs font-semibold uppercase tracking-wider transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-mgh-gold/40",
            selected
              ? "border-mgh-gold bg-mgh-gold text-mgh-gold-ink hover:bg-transparent hover:text-mgh-gold"
              : "border-mgh-line-strong bg-mgh-surface-2 text-mgh-text hover:border-mgh-gold hover:text-mgh-gold",
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
