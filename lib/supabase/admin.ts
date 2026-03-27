import { createClient } from "@supabase/supabase-js";

// This client is for server-side use only as it uses the Service Role key
// and bypasses Row Level Security (RLS).
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
