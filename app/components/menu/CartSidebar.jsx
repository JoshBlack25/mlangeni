"use client";

import { useState } from "react";
import { Calendar, ChevronUp, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Sheet, focusRing } from "@/app/components/dashboard/ui";
import { useMenu } from "./MenuContext";
import { computeTotals, formatZAR, guestCount } from "./pricing";
import { formatDateShort } from "./availability";

const CATEGORIES = [
  { label: "Starters", key: "starters" },
  { label: "Mains", key: "mains" },
  { label: "Desserts", key: "desserts" },
  { label: "Beverages", key: "beverages" },
];

export function CartSidebar() {
  const { state, dispatch } = useMenu();
  const [sheetOpen, setSheetOpen] = useState(false);

  const categories = CATEGORIES.map((c) => ({
    ...c,
    items: state.selections[c.key] ?? [],
  }));

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const hasItems = totalItems > 0;
  const guests = guestCount(state.guests);
  const totals = computeTotals(state.selections, guests);

  const remove = (key, id) =>
    dispatch({ type: "REMOVE_ITEM", payload: { category: key, id } });

  // The menu as it would be printed for the table: courses, dishes, then the
  // bill. Shared by the desktop rail and the phone sheet.
  const body = (
    <>
      {!hasItems ? (
        <EmptyState align="start" className="py-6" title="Nothing chosen yet">
          Choose dishes from the menu to build your custom catering package.
        </EmptyState>
      ) : (
        <div className="mt-2 max-h-[420px] space-y-6 overflow-y-auto pr-1">
          {categories.map(
            (cat) =>
              cat.items.length > 0 && (
                <section key={cat.key} aria-label={cat.label}>
                  <h3 className="text-label font-semibold uppercase text-mgh-muted">
                    {cat.label}
                  </h3>

                  <ul className="mt-2 divide-y divide-mgh-line-soft">
                    {cat.items.map((item) => (
                      <li key={item.item_id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-[15px] text-mgh-text">
                            {item.name}
                          </p>
                          <p className="text-caption tabular-nums text-mgh-dim">
                            {formatZAR(item.price)} per guest
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(cat.key, item.item_id)}
                          aria-label={`Remove ${item.name}`}
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-control text-mgh-dim transition-colors hover:bg-mgh-surface-2 hover:text-mgh-danger",
                            focusRing,
                          )}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      )}

      {hasItems && (
        <div className="mt-6 border-t border-mgh-line pt-4">
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-mgh-muted">
              <dt>Per guest</dt>
              <dd className="tabular-nums">{formatZAR(totals.perGuest)}</dd>
            </div>
            <div className="flex items-center justify-between text-mgh-muted">
              <dt>Guests</dt>
              <dd className="tabular-nums">× {guests}</dd>
            </div>
            <div className="flex items-baseline gap-2 pt-3">
              <dt className="text-sm font-medium text-mgh-text">Estimated total</dt>
              <span aria-hidden="true" className="flex-1 border-b border-dotted border-mgh-line-strong" />
              <dd className="font-serif text-2xl font-medium tabular-nums lining-nums text-mgh-text">
                {formatZAR(totals.total)}
              </dd>
            </div>
          </dl>

          {(state.guests || state.eventDate) && (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-caption text-mgh-muted">
              {state.guests && (
                <p className="flex items-center gap-1.5">
                  <Users size={13} className="text-mgh-dim" aria-hidden="true" />
                  {state.guests} guests planned
                </p>
              )}
              {state.eventDate && (
                <p className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-mgh-dim" aria-hidden="true" />
                  {formatDateShort(state.eventDate)}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-caption leading-relaxed text-mgh-dim">
            An estimate for food and beverage. Staffing, transport and special
            arrangements are quoted separately.
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        aria-labelledby="cart-title"
        className="hidden w-full rounded-card border border-mgh-line bg-mgh-surface p-6 lg:sticky lg:top-24 lg:block lg:w-[360px] lg:shrink-0"
      >
        <div className="flex items-baseline justify-between border-b border-mgh-line-soft pb-4">
          <h2 id="cart-title" className="font-serif text-xl font-medium text-mgh-text">
            Your Menu
          </h2>
          {hasItems && (
            <span className="text-caption tabular-nums text-mgh-muted">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </span>
          )}
        </div>
        {body}
      </aside>

      {/* Phones: a summary bar above the tab bar that opens the same menu as a sheet. */}
      {hasItems && (
        <div className="lg:hidden">
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-mgh-line bg-mgh-bg/95 px-4 py-2.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className={cn(
                "flex h-12 w-full items-center justify-between gap-3 rounded-control border border-mgh-line-strong bg-mgh-surface px-4 text-left",
                "transition-[border-color,transform] duration-[var(--mgh-dur-fast)] ease-mgh active:scale-[0.99]",
                focusRing,
              )}
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-serif text-lg font-medium tabular-nums text-mgh-text">
                  {formatZAR(totals.total)}
                </span>
                <span className="truncate text-caption text-mgh-muted">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm text-mgh-text">
                View menu <ChevronUp size={15} aria-hidden="true" />
              </span>
            </button>
          </div>

          {/* Keeps the summary bar from covering the step's own buttons. */}
          <div className="h-20" aria-hidden="true" />

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Your menu">
            <div className="px-5 pb-6">{body}</div>
          </Sheet>
        </div>
      )}
    </>
  );
}
