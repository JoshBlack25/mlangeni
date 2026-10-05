import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/services/supabaseConfig";

/**
 * Server-side read of the approved, featured reviews for the marketing
 * homepage.
 *
 * WHY THIS IS NOT A CLIENT FETCH LIKE EVERYTHING ELSE IN THE APP
 * Every other Supabase read here happens in a client component, and that is
 * right for them — they sit behind a login, where nobody is reading the HTML
 * but the browser. This one is different: the testimonial text IS marketing
 * copy. Fetched in a `useEffect`, a crawler sees an empty gold box where the
 * social proof should be. Fetched here, the quotes are in the served HTML.
 *
 * It costs nothing, because the query is anonymous — no session, no cookies —
 * so the page stays statically prerendered and revalidates on a timer instead
 * of hitting Supabase per visit.
 *
 * WHY PLAIN fetch AND NOT A SUPABASE CLIENT
 * `lib/supabase/server.ts` awaits `cookies()`, a Request-time API, which would
 * force the whole homepage to render dynamically on every request for a query
 * with no session to read. `services/supabaseClient.ts` builds a module-scope
 * client, which on the server is a cross-request singleton. An RPC is one HTTP
 * GET with the key in a header; that is all this needs.
 *
 * GET rather than POST because `get_public_testimonials` is declared STABLE,
 * which is what lets PostgREST expose it over GET — and GET is what Next
 * deduplicates within a render pass.
 */

export type PublicTestimonial = {
  testimonial_id: string;
  rating: number;
  message: string;
  display_name: string;
  initials: string;
  event_name: string | null;
  created_at: string;
};

/**
 * Fallback ceiling on how long a newly approved review can take to reach the
 * homepage. In practice it is immediate: the admin screen pings
 * /api/revalidate-testimonials, which republishes the page. This timer only
 * matters if that ping never lands.
 */
export const TESTIMONIALS_REVALIDATE_SECONDS = 60;

/**
 * Returns the reviews, or `null` when the read could not be made at all.
 *
 * The distinction matters to the caller: `[]` is "there are genuinely no
 * featured reviews", which the section renders as its invitation state, while
 * `null` is "we could not find out", which makes the section retry from the
 * browser before concluding anything.
 */
export async function getPublicTestimonials(
  limit = 8,
): Promise<PublicTestimonial[] | null> {
  const params = new URLSearchParams({
    p_featured_only: "true",
    p_limit: String(limit),
  });

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_public_testimonials?${params}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
        // Without an explicit revalidate, a statically prerendered route would
        // fetch this once at build time and never again — a review approved
        // after deploy would never appear. This is the single easiest thing to
        // get wrong in the whole feature.
        next: {
          revalidate: TESTIMONIALS_REVALIDATE_SECONDS,
          tags: ["testimonials"],
        },
      },
    );

    if (!response.ok) {
      // A 404 means db/005 has not been run yet. Either way the homepage must
      // never fail to build over a testimonial: null hands the decision to the
      // client, which retries once on mount.
      console.warn(
        `[testimonials] public read failed with ${response.status}. ` +
          "Run db/005_testimonials_curation.sql if this is a 404.",
      );
      return null;
    }

    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn("[testimonials] public read threw:", error);
    return null;
  }
}
