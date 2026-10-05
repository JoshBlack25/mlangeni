"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Keeps keyboard focus inside an overlay while it's open, locks background
 * scrolling, closes on Escape, and hands focus back to whatever opened it.
 *
 * Shared by the item detail modal and the mobile cart sheet so the two behave
 * identically.
 *
 * @param {React.RefObject<HTMLElement>} ref  the overlay container
 * @param {{ active: boolean, onEscape?: () => void }} options
 */
export function useFocusTrap(ref, { active, onEscape } = {}) {
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    lastFocusedRef.current = document.activeElement;

    const node = ref.current;
    const focusables = () =>
      Array.from(node?.querySelectorAll(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Focus the first thing inside, after paint so the node definitely exists.
    const focusTimer = window.setTimeout(() => {
      const [first] = focusables();
      (first ?? node)?.focus?.();
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onEscape?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [active, onEscape, ref]);
}
