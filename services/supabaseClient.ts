import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseUrl1 = process.env.NEXT_PUBLIC_SUPABASE_URL1!;
const supabaseAnonKey1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1!;

export const supabase1 = createClient(supabaseUrl1, supabaseAnonKey1);
