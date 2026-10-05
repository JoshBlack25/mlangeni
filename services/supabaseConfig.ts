/**
 * The project URL and publishable key, with no side effects.
 *
 * This exists so server code can talk to PostgREST without importing
 * `supabaseClient.ts`. That module calls `createClient` at module scope, which
 * on the server becomes a singleton shared across every request with an auth
 * refresh timer attached — unwanted for an anonymous, sessionless read.
 *
 * The literals are the fallback rather than the source of truth: they are what
 * `supabaseClient.ts` has always shipped, kept here so nothing breaks if the
 * environment variables are missing, while still letting `.env.local` win.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hzifwowfenglxigvpalb.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6aWZ3b3dmZW5nbHhpZ3ZwYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjMxOTMsImV4cCI6MjEwMDEzOTE5M30.5XhHf4p79pKu7QOGJNTfsrnHmNsM3rGizPDaxKLqNNw";
