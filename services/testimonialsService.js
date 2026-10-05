import { supabase } from "@/services/supabaseClient";

/**
 * Reads for the testimonials feature, plus the "is migration 005 installed?"
 * detection every surface needs.
 *
 * WHY THE PUBLIC READ IS AN RPC
 * RLS on `public.customer` is granted to `authenticated` only, so an anonymous
 * visitor asking PostgREST for `customer(first_name)` alongside a testimonial
 * gets `customer: null` — a carousel of reviews with nobody's name on them. A
 * signed-in customer hits the same wall for everyone else's row, since the
 * policy is "own row only". `get_public_testimonials()` is SECURITY DEFINER so
 * it can do that join once, server side, and return only a display name and
 * initials. See `db/005_testimonials_curation.sql`.
 *
 * DEGRADING WHEN 005 HAS NOT BEEN RUN
 * Same contract `useAvailability` uses for `get_booked_slots`: a missing
 * function or column reports `unsupported`, never `error`. Callers must then
 * render nothing rather than an error — this section sits on the marketing
 * homepage, and a red failure box there is worse than no section at all.
 */

const PUBLIC_RPC = "get_public_testimonials";

// Module-level so a missing migration warns once per page load, not per render.
let warnedUnsupported = false;

/** The function isn't installed, or isn't granted to this role. */
export function isMissingFunction(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "");
  return (
    code === "PGRST202" || // PostgREST: not found in the schema cache
    code === "42883" || // postgres: undefined_function
    code === "404" ||
    error.status === 404 ||
    /could not find the function|does not exist|schema cache/i.test(message)
  );
}

/**
 * One of `order_id` / `featured` / `display_order` is missing, i.e. the table
 * is still in its pre-005 shape.
 */
export function isMissingColumn(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "");
  return (
    code === "42703" || // postgres: undefined_column
    code === "PGRST204" || // PostgREST: column not found in the schema cache
    /column .* does not exist|could not find the '.*' column/i.test(message)
  );
}

/** Either of the above — "this feature needs db/005 run first". */
export function isSetupMissing(error) {
  return isMissingFunction(error) || isMissingColumn(error);
}

function warnOnce(error, what) {
  if (warnedUnsupported) return;
  warnedUnsupported = true;
  console.warn(
    `[testimonials] ${what} unavailable (${error?.code ?? error?.message}). ` +
      "Run db/005_testimonials_curation.sql to enable customer reviews. " +
      "Review surfaces will stay hidden until then.",
  );
}

/**
 * Approved reviews, in the order the admin arranged them.
 *
 * `featuredOnly` true (the marketing homepage) returns only what the admin
 * pinned; false (the dashboard card) returns every approved review with the
 * featured ones first.
 *
 * Resolves to `{ testimonials, unsupported, error }`. `unsupported` means 005
 * has not been run; `error` is a genuine failure worth surfacing to an admin
 * but not to a visitor.
 */
export async function fetchPublicTestimonials(limit = 12, featuredOnly = true) {
  const { data, error } = await supabase.rpc(PUBLIC_RPC, {
    p_featured_only: featuredOnly,
    p_limit: limit,
  });

  if (error) {
    if (isSetupMissing(error)) {
      warnOnce(error, "public review list");
      return { testimonials: [], unsupported: true, error: null };
    }
    return { testimonials: [], unsupported: false, error };
  }

  return { testimonials: data ?? [], unsupported: false, error: null };
}

/** `"2026-03-04"` → `"March 2026"`. Empty string for anything unparseable. */
export function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

/** Initials for a name the RPC did not supply them for (admin-side rows). */
export function initialsFrom(firstName, lastName) {
  return (
    [firstName, lastName]
      .filter(Boolean)
      .map((value) => String(value).charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "C"
  );
}

/** `"Thandi"`, `"Mokoena"` → `"Thandi M."`, matching the public RPC's shape. */
export function displayNameFrom(firstName, lastName) {
  const first = String(firstName ?? "").trim();
  const initial = String(lastName ?? "").trim().charAt(0);
  if (!first && !initial) return "A customer";
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}
