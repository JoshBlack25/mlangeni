import { cn } from "@/lib/utils";

/**
 * An empty value in a table or detail list: a short hairline that screen
 * readers announce as "Not set", instead of a dash read aloud as punctuation.
 */
export default function Blank({ label = "Not set", className }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span aria-hidden="true" className="inline-block h-px w-3 bg-mgh-line-strong" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
