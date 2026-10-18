"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import { focusRing } from "./focus";

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;

const overlayClass =
  "fixed inset-0 z-50 bg-mgh-bg/80 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

/**
 * Accessible modal: focus trap, Escape and backdrop close, labelled by its
 * title. A bottom sheet on phones, centred from `sm` up.
 *
 * Pass `title` (and optional `description`), or render your own heading
 * wrapped in <DialogTitle asChild>. `dismissible={false}` blocks Escape and
 * backdrop close (e.g. while saving). `showClose={false}` hides the X.
 * `describe={false}` for a dialog with no description at all, so Radix does
 * not point aria-describedby at nothing.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  dismissible = true,
  showClose = true,
  describe = true,
  className,
  children,
}) {
  const block = (e) => {
    if (!dismissible) e.preventDefault();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClass} />
        <DialogPrimitive.Content
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          onInteractOutside={block}
          {...(describe ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-y-auto",
            "rounded-t-sheet border border-b-0 border-mgh-line-strong bg-mgh-surface text-mgh-text shadow-modal",
            "p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet sm:border-b sm:p-7",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-6 sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:zoom-in-[0.98]",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-6 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-[0.98]",
            "duration-300 ease-mgh",
            SIZES[size],
            className,
          )}
        >
          {title && (
            <div className="mb-5 min-w-0 pr-10">
              <DialogPrimitive.Title className="font-serif text-title font-medium text-mgh-text">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-mgh-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}
          {children}
          {/* Rendered after the content so focus lands on the first field, not the X. */}
          {showClose && (
            <DialogPrimitive.Close
              aria-label="Close"
              className={cn(
                "absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-control bg-mgh-surface/80 text-mgh-muted backdrop-blur-sm transition-colors hover:bg-mgh-surface-2 hover:text-mgh-text sm:right-4 sm:top-4",
                focusRing,
              )}
            >
              <X size={18} />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Two-button confirmation for consequential actions (approve, cancel, delete). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      showClose={false}
    >
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="quiet" onClick={() => onOpenChange(false)} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
