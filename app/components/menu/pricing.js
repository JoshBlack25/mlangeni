/**
 * Quote pricing.
 *
 * The wizard used to show unit prices on screen while writing `price × guests`
 * to the database, so the number the customer saw was never the number they
 * were quoted. Everything that displays or submits a price now goes through
 * here so there is exactly one rule.
 */

export const COURSE_LABELS = {
  starters: "Starters",
  mains: "Main Courses",
  desserts: "Desserts",
  beverages: "Beverages",
};

export const COURSE_ORDER = ["starters", "mains", "desserts", "beverages"];

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

export function formatZAR(amount) {
  const n = Number(amount);
  return zar.format(Number.isFinite(n) ? n : 0);
}

/** Guest count as a usable integer, whatever the input field left in state. */
export function guestCount(guests) {
  const n = parseInt(guests, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Flatten the wizard's selections into priced line items.
 * @returns {{ item, category, course, name, unitPrice, quantity, lineTotal }[]}
 */
export function lineItems(selections, guests) {
  const qty = guestCount(guests);
  const rows = [];

  for (const category of COURSE_ORDER) {
    for (const item of selections?.[category] ?? []) {
      const unitPrice = Number(item.price) || 0;
      rows.push({
        item,
        category,
        course: COURSE_LABELS[category],
        name: item.name,
        unitPrice,
        quantity: qty,
        lineTotal: unitPrice * qty,
      });
    }
  }

  return rows;
}

/** Line items regrouped per course, empty courses omitted. */
export function courseGroups(selections, guests) {
  const rows = lineItems(selections, guests);
  return COURSE_ORDER.map((category) => ({
    category,
    label: COURSE_LABELS[category],
    rows: rows.filter((r) => r.category === category),
  })).filter((g) => g.rows.length > 0);
}

/**
 * @returns {{ itemCount, perGuest, subtotal, total, guests }}
 *   `perGuest` is the sum of unit prices — what one cover costs.
 *   `total` is what gets written to `orders.total_price`.
 */
export function computeTotals(selections, guests) {
  const qty = guestCount(guests);
  const rows = lineItems(selections, guests);
  const perGuest = rows.reduce((sum, r) => sum + r.unitPrice, 0);

  return {
    itemCount: rows.length,
    guests: qty,
    perGuest,
    subtotal: perGuest * qty,
    total: perGuest * qty,
  };
}
