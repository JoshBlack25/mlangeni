"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Check, MessageCircle } from "lucide-react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-surface";

/**
 * Shown after an enquiry is saved: a thank-you card, as it might arrive on
 * the table. A real dialog (focus moves in, Escape closes, the page behind
 * is inert), and it only states what actually happened.
 */
export default function SuccessModal({ isOpen, onClose, name }) {
  const firstName = name.split(" ")[0];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-mgh-bg/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="mgh-warm fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sheet border border-mgh-line-strong bg-mgh-surface text-mgh-text shadow-modal focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-300"
        >
          <div className="flex flex-col items-center px-7 pb-8 pt-10 text-center sm:px-10">
            <span className="grid size-14 place-items-center rounded-full border border-mgh-gold text-mgh-gold">
              <Check size={22} aria-hidden="true" />
            </span>

            <DialogPrimitive.Title className="mt-6 font-serif text-[1.75rem] font-normal leading-tight text-mgh-text">
              Enquiry Submitted!
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-3 text-pretty text-[15px] leading-relaxed text-mgh-muted">
              Thank you, {firstName}! We have received your enquiry and will be
              in touch shortly. A confirmation has been sent to your email.
            </DialogPrimitive.Description>

            <p className="mt-6 flex w-full items-start gap-3 rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3.5 text-left text-sm leading-relaxed text-mgh-muted">
              <MessageCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-mgh-ok" />
              A WhatsApp message has also been opened in a new tab for us to
              follow up with you directly.
            </p>

            <DialogPrimitive.Close
              className={`mt-8 h-12 w-full rounded-control bg-mgh-gold text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-mgh-gold-ink transition-[background-color,transform] duration-200 hover:bg-mgh-gold-hover active:scale-[0.98] ${focusRing}`}
            >
              Done
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
