"use client";

import { MotionConfig } from "framer-motion";

/**
 * Dashboard-wide motion settings: framer-motion follows the visitor's
 * reduced-motion preference, and `.mgh-dashboard` scopes the CSS
 * reduced-motion, selection and scrollbar rules in globals.css.
 */
export default function DashboardMotion({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mgh-dashboard contents">{children}</div>
    </MotionConfig>
  );
}
