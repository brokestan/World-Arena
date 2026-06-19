import { createClient } from "@supabase/supabase-js";

// Browser-safe client. Uses the anon key only — never import the
// service-role client (lib/supabase-server.ts) into anything that
// ships to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check your environment variables against .env.example.",
  );
}

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
