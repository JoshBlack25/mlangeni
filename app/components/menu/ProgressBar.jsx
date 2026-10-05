"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu } from "./MenuContext";
import { STEPS } from "./constants";

export function ProgressBar() {
  const { state, dispatch } = useMenu();
  const percent = ((state.step + 1) / STEPS.length) * 100;

  return (
    <nav
      aria-label="Menu builder progress"
      className="mb-10 border-b border-mgh-line pb-4"
    >
      {/* Compact on small screens — six pills never fit legibly. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-mgh-gold">
            {STEPS[state.step]}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-mgh-faint">
            Step {state.step + 1} of {STEPS.length}
          </p>
        </div>
        <div
          className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-mgh-surface-3"
          role="progressbar"
          aria-valuenow={state.step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuetext={`Step ${state.step + 1} of ${STEPS.length}: ${STEPS[state.step]}`}
        >
          <motion.div
            className="h-full bg-mgh-gold"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <ol className="hidden min-w-max items-center gap-4 overflow-x-auto sm:flex">
        {STEPS.map((label, i) => {
          const active = i === state.step;
          const done = i < state.step;

          return (
            <li key={label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  done && dispatch({ type: "GO_TO_STEP", payload: i })
                }
                disabled={!done && !active}
                aria-current={active ? "step" : undefined}
                aria-disabled={!done && !active}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-full border px-4 py-2",
                  "text-xs uppercase tracking-[0.15em] transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold/50",
                  active && "border-mgh-gold bg-mgh-gold/10 text-mgh-gold",
                  done &&
                    "border-mgh-line-strong bg-mgh-surface-2 text-mgh-text hover:border-mgh-gold hover:text-mgh-gold",
                  !active &&
                    !done &&
                    "cursor-not-allowed border-mgh-line-soft bg-black/40 text-mgh-disabled",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    active && "bg-mgh-gold text-mgh-gold-ink",
                    done && "bg-mgh-line-strong text-mgh-gold",
                    !active && !done && "bg-mgh-surface-3 text-mgh-disabled",
                  )}
                >
                  {done ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>

                <span className="font-medium">{label}</span>

                {active && (
                  <motion.span
                    layoutId="menu-step-indicator"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-mgh-gold"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>

              {i < STEPS.length - 1 && (
                <ChevronRight
                  size={14}
                  className="text-mgh-line-strong"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
