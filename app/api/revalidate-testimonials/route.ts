import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/services/supabaseConfig";

/**
 * Publish the homepage's testimonial section immediately after an admin
 * changes what should appear on it.
 *
 * WHY THIS EXISTS
 * The homepage is statically prerendered and its testimonial fetch is tagged
 * and revalidated on a timer, which makes it fast and cheap but means an
 * approved review took up to the revalidate window to appear. An admin
 * approving a review and then finding the site unchanged reasonably concludes
 * the feature is broken. This lets the admin screen say "that's published now".
 *
 * WHY IT IS NOT OPEN
 * An unauthenticated revalidate endpoint is a free cache-buster for anyone who
 * finds it — harmless to data, but an easy way to make the site do needless
 * work. The caller must present the Supabase access token of a signed-in admin,
 * which is checked against the same is_admin() the RLS policies use, so there
 * is no second definition of "admin" to keep in step.
 */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // The caller's own token, so is_admin() answers for them and not for us.
  // No service-role key is involved — this client has exactly their rights.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  }

  // From a Route Handler, revalidatePath marks the path so the NEXT visit gets
  // fresh data — which is what the admin is about to do. revalidateTag with the
  // "max" profile additionally covers any other route that fetches this tag;
  // it is stale-while-revalidate, so it is the backstop rather than the fix.
  revalidatePath("/");
  revalidateTag("testimonials", "max");

  return NextResponse.json({ revalidated: true });
}
