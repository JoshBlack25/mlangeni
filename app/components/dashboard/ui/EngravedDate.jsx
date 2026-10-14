import { cn } from "@/lib/utils";
import { toDate } from "./format";

const SIZES = {
  sm: { day: "text-2xl", meta: "text-[10px] tracking-[0.14em]", gap: "gap-0.5", width: "w-11", rule: "w-5" },
  md: { day: "text-[2rem]", meta: "text-label tracking-[0.16em]", gap: "gap-1", width: "w-14", rule: "w-6" },
  lg: { day: "text-[4rem]", meta: "text-label tracking-[0.2em]", gap: "gap-2", width: "w-24", rule: "w-10" },
};

/**
 * The dashboard's signature: an event led by its date, set like engraved
 * stationery. `next` marks the upcoming event with the gold hairline.
 */
export default function EngravedDate({ date, size = "md", next = false, className }) {
  const d = toDate(date);
  const s = SIZES[size];

  if (!d) {
    return (
      <div className={cn("flex shrink-0 flex-col items-center", s.width, s.gap, className)}>
        <span className={cn("font-semibold uppercase text-mgh-dim", s.meta)}>Date</span>
        <span aria-hidden="true" className={cn("h-px bg-mgh-line-strong", s.rule)} />
        <span className={cn("font-semibold uppercase text-mgh-dim", s.meta)}>TBC</span>
      </div>
    );
  }

  const day = d.toLocaleDateString("en-ZA", { day: "numeric" });
  const month = d.toLocaleDateString("en-ZA", { month: "short" }).replace(".", "");
  const weekday = d.toLocaleDateString("en-ZA", { weekday: "short" }).replace(".", "");

  return (
    <time
      dateTime={d.toISOString()}
      className={cn("flex shrink-0 flex-col items-center text-center", s.width, s.gap, className)}
    >
      <span className={cn("font-semibold uppercase text-mgh-muted", s.meta)}>{month}</span>
      <span
        className={cn(
          "font-serif leading-[0.9] tabular-nums lining-nums text-mgh-text",
          size === "lg" ? "font-normal tracking-[-0.02em]" : "font-medium",
          s.day,
        )}
      >
        {day}
      </span>
      <span aria-hidden="true" className={cn("h-px", s.rule, next ? "bg-mgh-gold" : "bg-mgh-line-strong")} />
      <span className={cn("font-semibold uppercase text-mgh-dim", s.meta)}>{weekday}</span>
    </time>
  );
}
