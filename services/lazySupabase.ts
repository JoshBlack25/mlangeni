/**
 * The browser Supabase client, loaded on first use.
 *
 * The homepage only needs Supabase once a visitor picks a date or submits the
 * enquiry form, so importing the client statically put ~60 KB (gzipped) of
 * auth/realtime/PostgREST code on the critical path of the public landing
 * page. Marketing components import this instead; dashboards, which need the
 * client immediately anyway, keep importing services/supabaseClient directly.
 */
export async function getSupabase() {
  const { supabase } = await import("./supabaseClient");
  return supabase;
}
