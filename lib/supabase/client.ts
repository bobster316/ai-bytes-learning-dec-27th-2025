import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not configured. Auth features will not work.");
    // Return a mock client for development
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Legacy export for backwards compatibility
export const supabase = createClient();
