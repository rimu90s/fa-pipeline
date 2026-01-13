import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_* env");

  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
