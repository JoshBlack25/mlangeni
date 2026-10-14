"use client";

import { MotionConfig } from "framer-motion";

/**
 * The public site's frame: framer-motion follows the visitor's reduced-motion
 * setting, and `mgh-warm` sets text in ivory (see globals.css).
 */
export default function SiteMotion({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mgh-warm mgh-site contents">{children}</div>
    </MotionConfig>
  );
}
