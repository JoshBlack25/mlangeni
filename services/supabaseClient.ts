// import { createClient } from "@supabase/supabase-js";

// // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// // export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// // const supabaseUrl1 = process.env.NEXT_PUBLIC_SUPABASE_URL1!;
// // const supabaseAnonKey1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1!;

// // export const supabase1 = createClient(supabaseUrl1, supabaseAnonKey1);
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hzifwowfenglxigvpalb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6aWZ3b3dmZW5nbHhpZ3ZwYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjMxOTMsImV4cCI6MjEwMDEzOTE5M30.5XhHf4p79pKu7QOGJNTfsrnHmNsM3rGizPDaxKLqNNw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
