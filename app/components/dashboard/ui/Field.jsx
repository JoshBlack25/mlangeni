"use client";

import { useId, cloneElement, isValidElement } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-control border border-mgh-line bg-mgh-surface-2 px-3 text-sm text-mgh-text " +
  "placeholder:text-mgh-dim outline-none transition-[border-color,box-shadow] duration-[var(--mgh-dur-fast)] ease-mgh " +
  "hover:border-mgh-line-strong focus-visible:border-mgh-gold focus-visible:ring-3 focus-visible:ring-mgh-gold/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-mgh-danger/70";

export function Input({ className, ...props }) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

/** A search box with its glass. Put it in a <Field> so it has a visible label. */
export function SearchInput({ className, ...props }) {
  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mgh-dim"
      />
      <input type="search" className={cn(control, "h-10 pl-9", className)} {...props} />
    </div>
  );
}

export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea rows={rows} className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(control, "h-10 appearance-none bg-no-repeat pr-9", className)} style={{ backgroundImage: CHEVRON, backgroundPosition: "right 0.75rem center", backgroundSize: "12px" }} {...props}>
      {children}
    </select>
  );
}

// Data URIs cannot read CSS variables; %23a0a0a0 is --mgh-text-muted.
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%23a0a0a0' stroke-width='1.5'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E\")";

/**
 * Label + control + hint/error. The single child control receives the
 * generated id and aria wiring, so every input has a visible label.
 */
export default function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const child = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: children.props.required ?? required,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={isValidElement(children) ? (children.props.id ?? id) : undefined} className="text-[13px] font-medium text-mgh-muted">
        {label}
        {required && <span className="ml-0.5 text-mgh-dim">*</span>}
      </label>
      {child}
      {hint && !error && (
        <p id={hintId} className="text-caption text-mgh-dim">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-mgh-danger">
          {error}
        </p>
      )}
    </div>
  );
}
