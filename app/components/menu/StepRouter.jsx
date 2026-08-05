"use client";

import { useMenu } from "./MenuContext";
import { MenuStep } from "./MenuStep";
import { BeverageStep } from "./BeverageStep";
import { EventDetailsStep } from "./EventDetailsStep";
import { QuoteStep } from "./QuoteStep";

export function StepRouter() {
  const { state } = useMenu();
  const menu = state.menu;

  const steps = [
    <MenuStep
      key="s"
      category="starters"
      title="Starters & Appetisers"
      subtitle="Set an impressive tone with opening culinary creations."
      items={menu.starters}
    />,
    <MenuStep
      key="m"
      category="mains"
      title="Main Courses"
      subtitle="The defining centrepiece of your catering experience."
      items={menu.mains}
    />,
    <MenuStep
      key="d"
      category="desserts"
      title="Desserts & Sweets"
      subtitle="Refined sweet treats and plated desserts to conclude."
      items={menu.desserts}
    />,
    <BeverageStep key="b" />,
    <EventDetailsStep key="e" />,
    <QuoteStep key="q" />,
  ];

  return <div>{steps[state.step]}</div>;
}
