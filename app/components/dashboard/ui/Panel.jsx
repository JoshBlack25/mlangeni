import { cn } from "@/lib/utils";

/**
 * The dashboard's single container. `feature` adds the gold hairline and is
 * reserved for the one focal panel on a page. `density="dense"` is the
 * admin rhythm.
 */
export default function Panel({
  as: Tag = "section",
  variant = "default",
  density = "comfortable",
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "rounded-card border bg-mgh-surface",
        variant === "feature" ? "border-mgh-gold/35" : "border-mgh-line",
        density === "dense" ? "p-4 md:p-5" : "p-5 md:p-7",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Title row for a panel: serif for customer, sans for dense admin panels. */
export function PanelHeader({ title, titleId, description, action, density = "comfortable", className }) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", density === "dense" && "mb-4", className)}>
      <div className="min-w-0">
        <h2
          id={titleId}
          className={cn(
            density === "dense"
              ? "text-[15px] font-semibold text-mgh-text"
              : "font-serif text-xl font-medium text-mgh-text md:text-title",
          )}
        >
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-mgh-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
