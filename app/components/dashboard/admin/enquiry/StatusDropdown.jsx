"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogDescription,
  StatusBadge,
  focusRing,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending" },
  confirmed: { label: "Confirmed" },
  cancelled: { label: "Cancelled" },
};

const options = ["pending", "confirmed", "cancelled"];

export default function StatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(null); // value awaiting confirmation
  const [saving, setSaving] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const currentKey = statusConfig[value] ? value : "pending";
  const current = statusConfig[currentKey];

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Open on the current status, the way a native select does.
    const frame = requestAnimationFrame(() => {
      const items = menuRef.current?.querySelectorAll('[role="menuitemradio"]');
      const checked = menuRef.current?.querySelector('[aria-checked="true"]');
      (checked ?? items?.[0])?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleMenuKeyDown(e) {
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitemradio"]') ?? [])];
    const index = items.indexOf(document.activeElement);
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in moves) || !items.length) return;
    e.preventDefault();
    items[(moves[e.key] + items.length) % items.length].focus();
  }

  function handleSelect(newStatus) {
    setOpen(false);

    if (newStatus === value) return;

    // Confirming a booking is a real side effect — require confirmation
    if (newStatus === "confirmed") {
      setPendingValue(newStatus);
      return;
    }

    commitChange(newStatus);
  }

  async function commitChange(newStatus) {
    setSaving(true);
    await onChange(newStatus);
    setSaving(false);
    setPendingValue(null);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${current.label}. Change status`}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-control border border-mgh-line bg-mgh-surface-2 pl-2.5 pr-2",
          "transition-colors duration-(--mgh-dur-fast) hover:border-mgh-line-strong disabled:opacity-50",
          focusRing,
        )}
      >
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-label font-semibold uppercase text-mgh-muted">
            <Loader2 size={12} aria-hidden="true" className="animate-spin" />
            {current.label}
          </span>
        ) : (
          <StatusBadge status={currentKey} label={current.label} />
        )}
        <ChevronDown size={14} aria-hidden="true" className="text-mgh-dim" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Change status"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 z-20 mt-1 w-40 overflow-hidden rounded-control border border-mgh-line-strong bg-mgh-surface py-1 shadow-modal"
        >
          {options.map((opt) => {
            const cfg = statusConfig[opt];
            const selected = opt === currentKey;
            return (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "flex h-9 w-full items-center justify-between gap-2 px-3 text-left transition-colors hover:bg-mgh-surface-2",
                  focusRing,
                  "focus-visible:ring-offset-0",
                )}
              >
                <StatusBadge status={opt} label={cfg.label} />
                {selected && (
                  <Check size={14} aria-hidden="true" className="text-mgh-dim" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* CONFIRM DIALOG — only for pending/cancelled → confirmed */}
      <Dialog
        open={!!pendingValue}
        onOpenChange={(o) => {
          if (!o) setPendingValue(null);
        }}
        size="sm"
        dismissible={!saving}
        showClose={false}
      >
        <DialogTitle className="sr-only">Confirm enquiry</DialogTitle>
        <DialogDescription asChild>
          <p className="text-sm leading-relaxed text-mgh-text">
            Confirming this enquiry will mark that date and session as
            unavailable for everyone else. Continue?
          </p>
        </DialogDescription>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="quiet"
            onClick={() => setPendingValue(null)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => commitChange(pendingValue)}
            loading={saving}
          >
            <Check size={16} aria-hidden="true" />
            Confirm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
