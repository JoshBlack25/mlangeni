"use client";

import { useLayoutEffect } from "react";

/**
 * Opens the home page at the top rather than wherever the browser last was,
 * except when the URL names a section (/#contact, a shared /#testimonials
 * link): then the browser's own jump to that section is left alone.
 */
export default function ScrollReset() {
  useLayoutEffect(() => {
    if (window.location.hash) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return null;
}
