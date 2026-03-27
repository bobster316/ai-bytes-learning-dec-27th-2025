
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class CacheService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn("CacheService: Missing env vars. Caching disabled.");
            // Create a dummy client or handle gracefully? 
            // We'll throw or empty.
            // Better to throw so we catch it early in dev, but in prod we might want fallback.
            // Actually, if we are server-side, key SHOULD be there.
        }

        this.supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const { data, error } = await this.supabase
                .from('cache_entries')
                .select('value, expires_at')
                .eq('key', key)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // PGRST116 is "Row not found" (single() failed)
                    // console.warn(`Cache Get Error [${key}]:`, error.message);
                }
                return null;
            }

            if (!data) return null;

            // Check expiry
            if (new Date(data.expires_at) < new Date()) {
                // Expired
                // We could delete it asynchronously here
                this.invalidate(key).catch(e => console.error("Background invalidate failed", e));
                return null;
            }

            return data.value as T;
        } catch (e) {
            console.error("Cache Read Exception:", e);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
        try {
            const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
            const { error } = await this.supabase
                .from('cache_entries')
                .upsert({
                    key,
                    value: value as any,
                    expires_at: expiresAt
                });

            if (error) {
                console.error(`Cache Set Error [${key}]:`, error.message);
            }
        } catch (e) {
            console.error("Cache Write Exception:", e);
        }
    }

    async invalidate(key: string): Promise<void> {
        try {
            await this.supabase
                .from('cache_entries')
                .delete()
                .eq('key', key);
        } catch (e) {
            console.error("Cache Invalidate Exception:", e);
        }
    }
}

export const instance = new CacheService();
