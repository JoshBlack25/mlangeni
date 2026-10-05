"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMenu } from "./MenuContext";
import { MenuStep } from "./MenuStep";
import { BeverageStep } from "./BeverageStep";
import { EventDetailsStep } from "./EventDetailsStep";
import { QuoteStep } from "./QuoteStep";

export function StepRouter() {
  const { state } = useMenu();
  const menu = state.menu;
  const reduceMotion = useReducedMotion();

  // Direction, so going back slides the other way. Adjusted during render
  // rather than in an effect, so the transition starts with the right sign
  // instead of animating once the wrong way and correcting.
  const [prevStep, setPrevStep] = useState(state.step);
  const [direction, setDirection] = useState(1);
  if (prevStep !== state.step) {
    setDirection(state.step > prevStep ? 1 : -1);
    setPrevStep(state.step);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [state.step, reduceMotion]);

  const steps = [
    <MenuStep
      key="starters"
      category="starters"
      title="Starters & Appetisers"
      subtitle="Set an impressive tone with opening culinary creations."
      items={menu.starters}
    />,
    <MenuStep
      key="mains"
      category="mains"
      title="Main Courses"
      subtitle="The defining centrepiece of your catering experience."
      groups={[
        { label: null, items: menu.mains },
        // Items whose category didn't match a known course. Surfaced here
        // rather than dropped, which is what used to happen.
        { label: "Additional Dishes", items: menu.extras ?? [] },
      ]}
    />,
    <MenuStep
      key="desserts"
      category="desserts"
      title="Desserts & Sweets"
      subtitle="Refined sweet treats and plated desserts to conclude."
      items={menu.desserts}
    />,
    <BeverageStep key="beverages" />,
    <EventDetailsStep key="details" />,
    <QuoteStep key="quote" />,
  ];

  const offset = reduceMotion ? 0 : direction * 24;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state.step}
        initial={{ opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -offset }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {steps[state.step]}
      </motion.div>
    </AnimatePresence>
  );
}
