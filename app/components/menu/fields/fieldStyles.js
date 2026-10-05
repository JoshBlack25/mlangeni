import { cn } from "@/lib/utils";

/**
 * The one control style for the booking forms. This used to be a class string
 * copy-pasted into every input, which meant the error state and the focus ring
 * drifted between fields.
 */
export function controlClass({ invalid = false, className } = {}) {
  return cn(
    "w-full rounded-xl border bg-mgh-surface-2 px-4 py-3 text-sm text-mgh-text",
    "placeholder:text-mgh-faint transition-colors duration-150",
    "focus:border-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40",
    "disabled:cursor-not-allowed disabled:opacity-50",
    invalid
      ? "border-mgh-danger/70 focus:border-mgh-danger focus:ring-mgh-danger/30"
      : "border-mgh-line hover:border-mgh-line-strong",
    className,
  );
}

/** Value for `aria-describedby`, or undefined when there's nothing to point at. */
export function describedBy(id, { hint, error } = {}) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
