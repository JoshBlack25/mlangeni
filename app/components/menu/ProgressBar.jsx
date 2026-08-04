"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useMenu } from "./MenuContext";
import { STEPS } from "./constants";

export function ProgressBar() {
  const { state, dispatch } = useMenu();

  return (
    <div className="mb-10 overflow-x-auto border-b border-[#262626] pb-4">
      <div className="flex min-w-max items-center gap-4">
        {STEPS.map((label, i) => {
          const active = i === state.step;
          const done = i < state.step;

          return (
            <div key={label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  done && dispatch({ type: "GO_TO_STEP", payload: i })
                }
                disabled={!done && !active}
                className={`group relative flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-all duration-300 ${
                  active
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                    : done
                      ? "border-[#333333] bg-[#141414] text-white hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      : "border-[#222222] bg-black/40 text-[#555555]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    active
                      ? "bg-[#D4AF37] text-black"
                      : done
                        ? "bg-[#282828] text-[#D4AF37]"
                        : "bg-[#1c1c1c] text-[#555555]"
                  }`}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>

                <span className="font-medium">{label}</span>

                {active && (
                  <motion.span
                    layoutId="menu-step-indicator"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>

              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-[#444444]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
