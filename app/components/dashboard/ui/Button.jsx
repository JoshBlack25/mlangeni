import Link from "next/link";
import { cn } from "@/lib/utils";
import { focusRing } from "./focus";

const variants = {
  // Gold fill: the one primary action in a view.
  primary:
    "bg-mgh-gold font-semibold text-mgh-gold-ink hover:bg-mgh-gold-hover",
  secondary:
    "border border-mgh-line-strong text-mgh-text hover:border-mgh-dim hover:bg-mgh-surface-2",
  quiet: "text-mgh-muted hover:bg-mgh-surface-2 hover:text-mgh-text",
  danger:
    "border border-mgh-danger/40 text-mgh-danger hover:border-mgh-danger hover:bg-mgh-danger/10",
};

const sizes = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

export function buttonClasses({ variant = "secondary", size = "md", className } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-control font-medium",
    "transition-[background-color,border-color,color,transform] duration-[var(--mgh-dur-fast)] ease-mgh active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    focusRing,
    variants[variant],
    sizes[size],
    className,
  );
}

/**
 * Button, or a Link styled as one when `href` is given.
 * Variants: primary | secondary | quiet | danger. Sizes: sm | md | lg.
 */
export default function Button({
  variant = "secondary",
  size = "md",
  href,
  className,
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}) {
  const classes = buttonClasses({ variant, size, className });

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
