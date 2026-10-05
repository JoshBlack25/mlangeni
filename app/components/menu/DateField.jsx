"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Calendar } from "@/app/components/package/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/package/popover";
import { cn } from "@/lib/utils";
import { formatDateLong, toDateKey } from "./availability";

/**
 * Date picker for the menu builder, annotated with what's already booked.
 *
 * Deliberately NOT `PackageCalendar` — that component is styled by the
 * `.mgh-date-btn` / `.mgh-date-popover` rules the packages page depends on,
 * and it takes no props for disabling or marking days.
 *
 * @param {Set<string>} busyDates  "yyyy-MM-dd" keys with at least one booking
 * @param {Set<string>} fullDates  "yyyy-MM-dd" keys with no room left
 */
export function DateField({
  id = "eventDate",
  label = "Event Date",
  required = false,
  value = null,
  onChange,
  month,
  onMonthChange,
  minDate,
  maxDate,
  busyDates,
  fullDates,
  error,
  hint,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const busy = busyDates ?? new Set();
  const full = fullDates ?? new Set();

  const isBusyDay = (day) => busy.has(toDateKey(day));
  const isFullDay = (day) => full.has(toDateKey(day));

  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-wider text-mgh-muted"
      >
        {label}
        {required && <span className="ml-1 text-mgh-gold">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={describedBy}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm",
              "bg-mgh-surface-2 transition-colors duration-150",
              "focus:border-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-mgh-danger/70 focus:ring-mgh-danger/30"
                : "border-mgh-line hover:border-mgh-line-strong",
              value ? "text-mgh-text" : "text-mgh-faint",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <CalendarDays
                size={16}
                className="shrink-0 text-mgh-gold"
                aria-hidden="true"
              />
              <span className="truncate">
                {value ? formatDateLong(value) : "Select a date"}
              </span>
            </span>
            <ChevronDown
              size={16}
              className="shrink-0 text-mgh-faint"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto rounded-xl border-mgh-line bg-mgh-surface p-0"
        >
          <Calendar
            mode="single"
            className="mgh-menu-calendar rounded-xl"
            selected={value ?? undefined}
            defaultMonth={value ?? month ?? undefined}
            month={month ?? undefined}
            onMonthChange={onMonthChange}
            startMonth={minDate ?? undefined}
            endMonth={maxDate ?? undefined}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
              isFullDay,
            ]}
            modifiers={{ busy: isBusyDay, full: isFullDay }}
            modifiersClassNames={{
              busy: "mgh-day-busy",
              full: "mgh-day-full",
            }}
            onSelect={(selected) => {
              onChange?.(selected ?? null);
              if (selected) setOpen(false);
            }}
          />

          <div className="flex items-center gap-4 border-t border-mgh-line-soft px-4 py-2.5 text-[10px] uppercase tracking-wider text-mgh-faint">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-mgh-gold"
                aria-hidden="true"
              />
              Partly booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="line-through opacity-50" aria-hidden="true">
                00
              </span>
              Fully booked
            </span>
          </div>
        </PopoverContent>
      </Popover>

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-mgh-faint">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-mgh-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
