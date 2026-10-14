import { cn } from "@/lib/utils";
import { formatCurrency, currencyParts } from "./format";

/**
 * An amount set like a printed bill: the currency mark and cents drop to a
 * smaller size so the rand figure carries the line. The full amount stays in
 * the text for screen readers and copy-paste.
 */
export default function Money({ value, className }) {
  const parts = currencyParts(value);
  if (!parts) return <span className={className}>{formatCurrency(value)}</span>;

  return (
    <span className={cn("whitespace-nowrap tabular-nums lining-nums", className)}>
      {parts.sign}
      <span className="mr-[0.12em] align-baseline text-[0.58em] font-normal opacity-70">{parts.symbol}</span>
      {parts.whole}
      <span className="align-baseline text-[0.62em] opacity-70">{parts.fraction}</span>
    </span>
  );
}
