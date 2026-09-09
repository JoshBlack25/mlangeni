"use client";

import { useState } from "react";
import { ChevronDown, Check, X, Loader2 } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", dot: "bg-yellow-400", text: "text-yellow-400" },
  confirmed: {
    label: "Confirmed",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
  cancelled: { label: "Cancelled", dot: "bg-red-400", text: "text-red-400" },
};

const options = ["pending", "confirmed", "cancelled"];

export default function StatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(null); // value awaiting confirmation
  const [saving, setSaving] = useState(false);

  const current = statusConfig[value] ?? statusConfig.pending;

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
    <div className="relative">
      <button
        type="button"
        disabled={disabled || saving}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-[#1F1F1F] bg-white/5 px-3 py-2 text-sm text-white transition hover:border-[#D4AF37] disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin text-[#A0A0A0]" />
        ) : (
          <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        )}
        <span className={current.text}>{current.label}</span>
        <ChevronDown size={14} className="text-[#A0A0A0]" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#0B0A09] shadow-xl">
          {options.map((opt) => {
            const cfg = statusConfig[opt];
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white transition hover:bg-white/5"
              >
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* CONFIRM DIALOG — only for pending/cancelled → confirmed */}
      {pendingValue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
          onClick={() => setPendingValue(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-[#2A2A2A] bg-[#0B0A09] p-6 shadow-2xl"
          >
            <p className="text-sm text-white">
              Confirming this enquiry will mark that date and session as
              unavailable for everyone else. Continue?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingValue(null)}
                className="flex items-center gap-1.5 rounded-lg border border-[#1F1F1F] px-4 py-2 text-sm text-[#A0A0A0] transition hover:text-white"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => commitChange(pendingValue)}
                className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#c4a132]"
              >
                <Check size={14} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
