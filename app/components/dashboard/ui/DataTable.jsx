"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { focusRing } from "./focus";

/**
 * A real <table> from md up; stacked rows on phones.
 *
 * columns: [{ key, header, render?(row), align?: "left"|"right", className?,
 *             primary?: true (title line on mobile), hideOnMobile?: true }]
 * rowHref?(row) makes the primary cell a link; onRowClick?(row) makes it a
 * button (for rows that open a dialog). Either way that cell is the one
 * keyboard stop, and a mouse click anywhere on the row does the same thing.
 */
export default function DataTable({
  columns,
  rows,
  getRowKey = (row, i) => row.id ?? i,
  rowHref,
  onRowClick,
  density = "dense",
  caption,
  empty,
  className,
}) {
  const router = useRouter();
  if (!rows?.length) return empty ?? null;

  const cell = (col, row) => (col.render ? col.render(row) : row[col.key]);
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const rowY = density === "dense" ? "h-11" : "h-16";
  const interactive = Boolean(rowHref || onRowClick);

  const activate = (row) => onRowClick?.(row);
  // Mouse convenience only: keyboard and screen-reader users get the real
  // link or button in the primary cell. Clicks on other controls in the row
  // (or on the primary control itself) are left alone.
  const onRowMouseClick = (e, row, href) => {
    if (e.target.closest("a, button, input, select, textarea, label")) return;
    if (href) router.push(href);
    else activate(row);
  };
  const primaryControl =
    "rounded-sm text-left font-medium text-mgh-text underline-offset-4 decoration-mgh-line-strong group-hover/row:underline";

  return (
    <div className={className}>
      <table className="hidden w-full border-collapse text-left text-body-dense md:table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-mgh-line">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "h-10 px-3 text-label font-semibold uppercase text-mgh-dim first:pl-0 last:pr-0",
                  col.align === "right" && "text-right",
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={getRowKey(row, i)}
                onClick={interactive ? (e) => onRowMouseClick(e, row, href) : undefined}
                className={cn(
                  "group/row border-b border-mgh-line-soft transition-colors duration-[var(--mgh-dur-fast)]",
                  interactive && "cursor-pointer hover:bg-mgh-surface-2 focus-within:bg-mgh-surface-2",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      rowY,
                      "px-3 align-middle text-mgh-text first:pl-0 last:pr-0",
                      col.align === "right" && "text-right tabular-nums lining-nums",
                      col.className,
                    )}
                  >
                    {href && col === primary ? (
                      <Link href={href} className={cn(primaryControl, focusRing)}>
                        {cell(col, row)}
                      </Link>
                    ) : onRowClick && col === primary ? (
                      <button
                        type="button"
                        onClick={() => activate(row)}
                        className={cn(primaryControl, focusRing)}
                      >
                        {cell(col, row)}
                      </button>
                    ) : (
                      cell(col, row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft md:hidden">
        {rows.map((row, i) => {
          const href = rowHref?.(row);
          const body = (
            <>
              <div className="text-[15px] font-medium text-mgh-text">{cell(primary, row)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {columns
                  .filter((c) => c !== primary && !c.hideOnMobile)
                  .map((col) => (
                    <div key={col.key} className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
                        {col.header}
                      </dt>
                      <dd className="truncate text-sm text-mgh-text">{cell(col, row)}</dd>
                    </div>
                  ))}
              </dl>
            </>
          );
          const itemClass = cn("block w-full py-4 text-left", focusRing);
          return (
            <li key={getRowKey(row, i)}>
              {href ? (
                <Link href={href} className={itemClass}>
                  {body}
                </Link>
              ) : onRowClick ? (
                <button type="button" onClick={() => activate(row)} className={itemClass}>
                  {body}
                </button>
              ) : (
                <div className="py-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
