import { createClient } from "@supabase/supabase-js";

// The anon key is meant to be public — Supabase's access control happens
// through Row Level Security policies (see db/schema.sql), not by hiding
// this key. The service-role key (which bypasses RLS) must NEVER appear
// here or anywhere else in frontend code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set these in frontend/.env (local) " +
    "or as GitHub Actions secrets (deployed). See README.md."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
