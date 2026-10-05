"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Stars, in two modes.
 *
 * Read-only (no `onChange`) renders plain markup with a single text label, so a
 * screen reader says "4 out of 5 stars" once instead of announcing five
 * separate icons.
 *
 * Interactive (`onChange` supplied) is a radio group with a roving tabindex:
 * one tab stop for the whole control, arrow keys to move between values, which
 * is how a native radio group behaves. Hovering previews a value without
 * committing it.
 */
export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 16,
  label = "Rating",
  disabled = false,
  className = "",
}) {
  const interactive = typeof onChange === "function" && !disabled;
  const [hovered, setHovered] = useState(0);

  const shown = interactive && hovered > 0 ? hovered : value;

  const starClass = (index) =>
    index <= shown
      ? "fill-[#D4AF37] text-[#D4AF37]"
      : "fill-transparent text-white/20";

  if (!interactive) {
    return (
      <div
        className={`flex items-center gap-1 ${className}`}
        role="img"
        aria-label={`${value} out of ${max} stars`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star key={i} size={size} className={starClass(i + 1)} aria-hidden />
        ))}
      </div>
    );
  }

  function handleKeyDown(event) {
    const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
    const forward = event.key === "ArrowRight" || event.key === "ArrowUp";

    if (!back && !forward && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") return onChange(1);
    if (event.key === "End") return onChange(max);

    // From "no rating yet", either direction should land somewhere sensible
    // rather than clamping to 1 twice.
    const next = back
      ? Math.max(1, (value || 1) - 1)
      : Math.min(max, (value || 0) + 1);

    onChange(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex items-center gap-1 ${className}`}
      onMouseLeave={() => setHovered(0)}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const checked = value === starValue;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${starValue} ${starValue === 1 ? "star" : "stars"}`}
            // Roving tabindex: only the selected star is tabbable, or the
            // first one when nothing is selected yet.
            tabIndex={checked || (value === 0 && starValue === 1) ? 0 : -1}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            // Deliberately no onFocus preview. Arrow keys commit immediately
            // but leave DOM focus on the button that was already focused, so a
            // focus-driven preview would pin the display to that button's value
            // and the stars would stop following the rating being chosen.
            className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] active:scale-95"
          >
            <Star size={size} className={starClass(starValue)} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
