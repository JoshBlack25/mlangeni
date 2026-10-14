import { cn } from "@/lib/utils";

/**
 * One serif line, one sentence, at most one action. No icon tile.
 * `density="dense"` is the admin size: a quiet sans line for small lists.
 */
export default function EmptyState({
  title,
  children,
  action,
  align = "center",
  density = "comfortable",
  className,
}) {
  const dense = density === "dense";
  return (
    <div
      className={cn(
        "flex flex-col",
        dense ? "gap-1 py-6" : "gap-2 py-12",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {!dense && <span aria-hidden="true" className="mb-3 h-px w-8 bg-mgh-line-strong" />}
      <p
        className={cn(
          "text-balance text-mgh-text",
          dense ? "text-sm font-medium" : "font-serif text-xl md:text-[1.375rem]",
        )}
      >
        {title}
      </p>
      {children && (
        <p className={cn("max-w-sm text-pretty leading-relaxed text-mgh-muted", dense ? "text-caption" : "text-sm")}>
          {children}
        </p>
      )}
      {action && <div className={dense ? "mt-2" : "mt-4"}>{action}</div>}
    </div>
  );
}
