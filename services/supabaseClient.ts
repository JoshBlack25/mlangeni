import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/services/supabaseConfig";

// The browser client. Session lives in localStorage, so this is for client
// components only — see services/supabaseConfig.ts for the server-side note.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
