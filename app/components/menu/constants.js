export const CATEGORY_MATCHERS = {
  starters: /^(starters?|appetizers?|entrees?|entr(ée|ee)s?)$/i,
  mains: /^(mains?|main\s*courses?|main dishes?|plat(?:s)?\s*principaux?)$/i,
  desserts: /^(desserts?|sweets?|puddings?)$/i,
  beverages: /^(beverages?|drinks?|bar|liquids?|refreshments?)$/i,
};

export function matchCategoryKey(categoryName) {
  if (!categoryName) return null;
  for (const [key, re] of Object.entries(CATEGORY_MATCHERS)) {
    if (re.test(categoryName.trim())) return key;
  }
  return null;
}

export const NAME_COLUMN_CANDIDATES = [
  "name",
  "event_name",
  "type_name",
  "type",
  "label",
  "title",
  "description",
];

export function pickNameColumn(row, idColumn) {
  if (!row || typeof row !== "object") return null;
  for (const key of NAME_COLUMN_CANDIDATES) {
    if (typeof row[key] === "string" && row[key].trim()) return key;
  }
  const SKIP = new Set([idColumn, "created_at", "updated_at", "id", "uuid"]);
  for (const [key, val] of Object.entries(row)) {
    if (SKIP.has(key)) continue;
    if (typeof val === "string" && val.trim()) return key;
  }
  return null;
}

export function rowDisplayName(row, idColumn) {
  const col = pickNameColumn(row, idColumn);
  return col ? row[col] : row[idColumn];
}

export const TAG_COLORS = {
  alcoholic: "border-red-900/40 bg-red-950/30 text-red-400",
  "non-alcoholic": "border-emerald-900/40 bg-emerald-950/30 text-emerald-400",
  vegetarian: "border-emerald-900/40 bg-emerald-950/30 text-emerald-400",
  vegan: "border-teal-900/40 bg-teal-950/30 text-teal-400",
  "gluten-free": "border-amber-900/40 bg-amber-950/30 text-amber-400",
};

export const STEPS = [
  "Starters",
  "Mains",
  "Desserts",
  "Beverages",
  "Event Details",
  "Your Quote",
];
