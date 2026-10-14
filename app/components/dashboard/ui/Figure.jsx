import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";

/**
 * A key figure: Playfair lining numerals over a quiet label. `emphasis`
 * turns the figure gold; use it only for the number that asks for action.
 * Pass <Money value={…} /> as `value` for amounts.
 */
export function Figure({ label, value, hint, emphasis = false, loading = false, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-label font-semibold uppercase text-mgh-dim">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p
          className={cn(
            "mt-1.5 font-serif text-figure font-medium tabular-nums lining-nums tracking-[-0.01em]",
            emphasis ? "text-mgh-gold" : "text-mgh-text",
          )}
        >
          {value}
        </p>
      )}
      {hint && <p className="mt-1 text-caption text-mgh-dim">{hint}</p>}
    </div>
  );
}

/** Figures divided by hairlines; stacks on phones. Not cards. */
export function FigureRow({ children, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-6 md:flex md:gap-0 md:divide-x md:divide-mgh-line",
        "md:[&>*]:flex-1 md:[&>*]:px-6 md:[&>*:first-child]:pl-0 md:[&>*:last-child]:pr-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
