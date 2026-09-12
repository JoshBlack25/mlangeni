export const CATEGORY_MATCHERS = {
  starters: /^(starters?|appetizers?|entrees?|entr(ée|ee)s?)$/i,
  mains: /^(mains?|main\s*courses?|main dishes?|plat(?:s)?\s*principaux?)$/i,
  desserts: /^(desserts?|sweets?|puddings?)$/i,
  beverages: /^(beverages?|drinks?|bar|liquids?|refreshments?)$/i,
};

/**
 * Normalise an admin-entered category name so it can be compared:
 * lowercase, accents stripped, punctuation collapsed to spaces.
 */
export function normalizeCategory(name) {
  if (!name) return "";
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Explicit escape hatch for the category names admins actually type, which
 * the strict CATEGORY_MATCHERS regexes reject. Keys are normalised singulars.
 */
export const CATEGORY_ALIASES = {
  canape: "starters",
  salad: "starters",
  soup: "starters",
  snack: "starters",
  "finger food": "starters",
  side: "mains",
  platter: "mains",
  grill: "mains",
  braai: "mains",
  buffet: "mains",
  carvery: "mains",
  cake: "desserts",
  pastry: "desserts",
  patisserie: "desserts",
  dessert: "desserts",
  cocktail: "beverages",
  mocktail: "beverages",
  wine: "beverages",
  beer: "beverages",
  spirit: "beverages",
  juice: "beverages",
  coffee: "beverages",
  tea: "beverages",
};

/** Last-resort keyword scan, so "Hot Beverages" or "Kids Mains" still land. */
const CATEGORY_KEYWORDS = [
  [/\b(starter|appetiser|appetizer|canape|salad|soup)s?\b/, "starters"],
  [/\b(main|entree|platter|grill|braai|buffet|carvery|side)s?\b/, "mains"],
  [/\b(dessert|sweet|pudding|cake|pastry|patisserie)s?\b/, "desserts"],
  [
    /\b(beverage|drink|bar|refreshment|cocktail|mocktail|wine|beer|spirit|juice|coffee|tea)s?\b/,
    "beverages",
  ],
];

export function matchCategoryKey(categoryName) {
  if (!categoryName) return null;

  const raw = String(categoryName).trim();

  // 1. the original strict regexes — unchanged behaviour for known names
  for (const [key, re] of Object.entries(CATEGORY_MATCHERS)) {
    if (re.test(raw)) return key;
  }

  const norm = normalizeCategory(raw);
  if (!norm) return null;

  // 2. alias table, tolerant of a trailing plural
  const singular = norm.replace(/s$/, "");
  if (CATEGORY_ALIASES[norm]) return CATEGORY_ALIASES[norm];
  if (CATEGORY_ALIASES[singular]) return CATEGORY_ALIASES[singular];

  // 3. keyword scan
  for (const [re, key] of CATEGORY_KEYWORDS) {
    if (re.test(norm)) return key;
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

/** Pull the joined category name off a `menu_item` row from Supabase. */
export function readCategoryName(row) {
  if (!row) return undefined;
  return Array.isArray(row.category) ? row.category[0]?.name : row.category?.name;
}

/**
 * Turn raw `menu_item` rows into the shape the wizard renders.
 *
 * Anything whose category doesn't map to a known course lands in `extras`
 * rather than being silently dropped, which is what used to happen — items
 * simply vanished from the builder with no trace.
 *
 * @returns {{
 *   starters: object[], mains: object[], desserts: object[],
 *   beverages: { alcoholic: object[], non_alcoholic: object[] },
 *   extras: object[], unmatchedCategories: string[],
 * }}
 */
export function groupMenuItems(rows) {
  const grouped = {
    starters: [],
    mains: [],
    desserts: [],
    beverages: { alcoholic: [], non_alcoholic: [] },
    extras: [],
  };
  const unmatched = new Set();

  for (const row of rows || []) {
    const categoryName = readCategoryName(row);
    const key = matchCategoryKey(categoryName);

    const tags = [];
    if (key === "beverages") {
      tags.push(row.is_alcoholic ? "alcoholic" : "non-alcoholic");
    }

    const item = {
      item_id: row.item_id,
      category_id: row.category_id,
      category_name: categoryName,
      name: row.name,
      description: row.description,
      price: row.price,
      is_alcoholic: row.is_alcoholic,
      image_url: row.image_url,
      available: row.available,
      tags,
    };

    if (key === "beverages") {
      if (row.is_alcoholic) grouped.beverages.alcoholic.push(item);
      else grouped.beverages.non_alcoholic.push(item);
    } else if (key) {
      grouped[key].push(item);
    } else {
      grouped.extras.push(item);
      if (categoryName) unmatched.add(String(categoryName).trim());
    }
  }

  grouped.unmatchedCategories = [...unmatched];
  return grouped;
}

export const STEPS = [
  "Starters",
  "Mains",
  "Desserts",
  "Beverages",
  "Event Details",
  "Your Quote",
];
