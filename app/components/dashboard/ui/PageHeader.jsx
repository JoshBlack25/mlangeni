import { cn } from "@/lib/utils";

/**
 * The house page header: Playfair title, a muted lead line, actions on the
 * right. The page's only <h1>. `density="dense"` is the admin size.
 */
export default function PageHeader({ title, lead, actions, density = "comfortable", className }) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        density === "dense" ? "mb-6 md:mb-8" : "mb-8 md:mb-12",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        <h1
          className={cn(
            "text-balance font-serif font-medium text-mgh-text",
            density === "dense" ? "text-display-sm" : "text-display-sm md:text-display",
          )}
        >
          {title}
        </h1>
        {lead && (
          <p className={cn("mt-3 text-pretty text-mgh-muted", density === "dense" ? "text-sm" : "text-body")}>
            {lead}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
