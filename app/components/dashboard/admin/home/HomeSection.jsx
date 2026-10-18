import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState, Panel, SkeletonRows, focusRing } from "@/app/components/dashboard/ui";

/**
 * Shared frame for the admin "Today" lists: a dense panel with a title,
 * a quiet "View all" link, and loading / empty states.
 */
export default function HomeSection({ title, href, items, loadingLabel, emptyText, className, children }) {
  return (
    <Panel density="dense" className={cn("flex flex-col", className)}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-semibold text-mgh-text">{title}</h2>
        {href && (
          <Link
            href={href}
            className={cn("rounded-sm text-caption text-mgh-muted transition-colors hover:text-mgh-text", focusRing)}
          >
            View all
          </Link>
        )}
      </div>
      {items === null ? (
        <SkeletonRows rows={3} label={loadingLabel} />
      ) : items.length === 0 ? (
        <EmptyState density="dense" align="start" title={emptyText} />
      ) : (
        children
      )}
    </Panel>
  );
}

export const rowLink = cn(
  "-mx-2 flex items-center gap-3 rounded-control px-2 py-2.5 text-sm transition-colors hover:bg-mgh-surface-2",
  focusRing,
);
