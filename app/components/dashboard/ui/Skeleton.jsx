import { cn } from "@/lib/utils";

/** Content-shaped loading placeholder. */
export default function Skeleton({ className }) {
  return <span aria-hidden="true" className={cn("mgh-shimmer block rounded-control", className)} />;
}

/** Placeholder list rows with a screen-reader status. */
export function SkeletonRows({ rows = 4, label = "Loading…", className }) {
  return (
    <div role="status" className={cn("divide-y divide-mgh-line-soft", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
