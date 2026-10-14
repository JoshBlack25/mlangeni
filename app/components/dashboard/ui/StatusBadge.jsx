import { cn } from "@/lib/utils";

// One status vocabulary for every dashboard list. Tone is always paired
// with the text label, so status never relies on colour alone.
const TONES = {
  ok: "bg-mgh-ok",
  warn: "bg-mgh-warn",
  danger: "bg-mgh-danger",
  neutral: "bg-mgh-muted",
  quiet: "bg-mgh-line-strong",
};

const STATUS_TONE = {
  paid: "ok",
  confirmed: "ok",
  approved: "ok",
  completed: "ok",
  complete: "ok",
  succeeded: "ok",
  success: "ok",
  resolved: "ok",
  responded: "ok",
  published: "ok",
  pending: "warn",
  requested: "warn",
  sent: "warn",
  due: "warn",
  awaiting: "warn",
  "awaiting payment": "warn",
  new: "warn",
  overdue: "danger",
  cancelled: "danger",
  canceled: "danger",
  rejected: "danger",
  failed: "danger",
  declined: "danger",
  scheduled: "neutral",
  active: "neutral",
  "in progress": "neutral",
  in_progress: "neutral",
  open: "neutral",
  contacted: "neutral",
  draft: "quiet",
  closed: "quiet",
  archived: "quiet",
};

export function statusTone(status) {
  const key = String(status ?? "").trim().toLowerCase().replace(/-/g, " ");
  return STATUS_TONE[key] ?? STATUS_TONE[key.replace(/ /g, "_")] ?? "neutral";
}

/** "in_progress" → "In Progress". The one label rule for every status. */
export function statusLabel(status, fallback = "Unknown") {
  const words = String(status ?? "").split(/[_\s-]+/).filter(Boolean);
  if (!words.length) return fallback;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** `<StatusBadge status="overdue" />` or override with `label` / `tone`. */
export default function StatusBadge({ status, label, tone, className }) {
  const t = tone ?? statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-label font-semibold uppercase text-mgh-muted",
        t === "danger" && "text-mgh-danger",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TONES[t])} />
      {label ?? statusLabel(status)}
    </span>
  );
}
