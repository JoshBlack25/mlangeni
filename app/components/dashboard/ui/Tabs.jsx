"use client";

import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE, DUR } from "../shared/motion";
import { focusRing } from "./focus";

/**
 * Underline tabs with counts (the Enquiries pattern). Controlled:
 * items [{ value, label, count? }], value, onChange(value).
 */
export default function Tabs({ items, value, onChange, label, className }) {
  const id = useId();
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + items.length) % items.length;
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex gap-6 overflow-x-auto border-b border-mgh-line [scrollbar-width:none]", className)}
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[index] = el)}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-sm pb-3 pt-1 text-sm font-medium transition-colors",
              active ? "text-mgh-text" : "text-mgh-dim hover:text-mgh-muted",
              focusRing,
            )}
          >
            {item.label}
            {item.count !== undefined && item.count !== null && (
              <span className={cn("text-caption tabular-nums", active ? "text-mgh-gold" : "text-mgh-dim")}>
                {item.count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={`tabs-${id}`}
                transition={{ duration: DUR.base, ease: EASE }}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-mgh-gold"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
