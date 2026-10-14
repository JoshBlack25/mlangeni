"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { EASE } from "@/app/components/dashboard/shared/motion";

/**
 * Animates a number from `startValue` up to `value` once `value`
 * resolves AND `start` is true (e.g. after a Supabase fetch + the element
 * has scrolled into view). While `value` is null/undefined (still loading),
 * nothing renders — pair this with a skeleton placeholder.
 */
export default function AnimatedNumber({
  value,
  startValue = 0,
  format = (v) => v,
  duration = 1.2,
  start = true,
}) {
  const [display, setDisplay] = useState(startValue);

  useEffect(() => {
    if (value === null || value === undefined || !start) return;

    const controls = animate(startValue, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, start]);

  return <>{format(display)}</>;
}
