"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "./focus";

const SIDES = {
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-sheet border-t pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  right:
    "inset-y-0 right-0 h-full w-[min(24rem,100vw)] border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

/** Edge-anchored panel (mobile "More" menu, notification list on phones). */
export default function Sheet({ open, onOpenChange, title, hideTitle = false, side = "bottom", className, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-mgh-bg/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col overflow-y-auto border-mgh-line-strong bg-mgh-surface text-mgh-text shadow-modal focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out duration-300 ease-mgh",
            SIDES[side],
            className,
          )}
        >
          {side === "bottom" && (
            <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-mgh-line-strong" />
          )}
          <div className={cn("flex items-center justify-between px-5 pt-3", hideTitle && "sr-only")}>
            <DialogPrimitive.Title className="text-label font-semibold uppercase text-mgh-dim">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className={cn("grid size-9 place-items-center rounded-control text-mgh-dim hover:bg-mgh-surface-2 hover:text-mgh-text", focusRing)}
            >
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
