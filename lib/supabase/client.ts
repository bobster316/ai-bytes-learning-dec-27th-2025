import { createBrowserClient } from "@supabase/ssr";

let cachedBrowserClient: any | null = null;

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not configured. Auth features will not work.");
    // Return a mock client for development
    return null as any;
  }

  if (!cachedBrowserClient) {
    cachedBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedBrowserClient;
};

// Legacy export for backwards compatibility
export const supabase = createClient();
