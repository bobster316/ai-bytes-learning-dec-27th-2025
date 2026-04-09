import { v4 as uuidv4 } from 'uuid';

export interface ImageGenerationResult {
    url: string | null;
    source: string | null;
    errorCode: string | null;
    errorMessage: string | null;
}

class FalImageService {
    private readonly falKey = process.env.FAL_KEY || '';
    private readonly hfToken = process.env.HUGGINGFACE_API_TOKEN || '';
    private readonly supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    private readonly supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    /**
     * Helper to query Supabase REST directly to avoid requiring the full `@supabase/supabase-js` 
     * client logic inside this server-side utility layer.
     */
    private async checkCache(concept: string): Promise<string | null> {
        if (!this.supabaseUrl || !this.supabaseKey) return null;
        try {
            const url = `${this.supabaseUrl}/rest/v1/asset_library?concept=eq.${encodeURIComponent(concept)}&select=image_url&limit=1`;
            const res = await fetch(url, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });
            if (res.ok) {
                const data = await res.json() as any[];
                if (data && data.length > 0) return data[0].image_url;
            }
        } catch (e) {
            console.error('[FalImageService] Cache check failed:', e);
        }
        return null;
    }

    private async saveToCache(concept: string, imageUrl: string): Promise<void> {
        if (!this.supabaseUrl || !this.supabaseKey) return;
        try {
            const url = `${this.supabaseUrl}/rest/v1/asset_library`;
            await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ concept, image_url: imageUrl })
            });
        } catch (e) {
            console.error('[FalImageService] Cache save failed:', e);
        }
    }

    async generateImage(prompt: string, concept: string): Promise<ImageGenerationResult> {
        console.log(`[FalImageService] Request for concept: "${concept}"`);
        
        const cachedUrl = await this.checkCache(concept);
        if (cachedUrl) {
            console.log(`[FalImageService] 🟢 Cache hit for "${concept}"! URL: ${cachedUrl}`);
            return { url: cachedUrl, source: 'cache', errorCode: null, errorMessage: null };
        }

        if (!this.falKey) {
            console.warn('[FalImageService] FAL_KEY is missing, skipping to fallback');
            return this.generateFallbackHF(prompt, concept);
        }

        try {
            console.log(`[FalImageService] Generating with fal.ai FLUX 2 Pro...`);
            const falUrl = 'https://fal.run/fal-ai/flux-pro/v1.1';
            
            // Note: FAL_KEY includes both identifier and secret (id:secret) 
            // It expects `Authorization: Key ${FAL_KEY}`
            const res = await fetch(falUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.falKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    image_size: 'landscape_16_9',
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    output_format: 'jpeg'
                })
            });

            if (!res.ok) {
                const body = await res.text();
                console.error(`[FalImageService] Fal HTTP ${res.status}:`, body);
                return this.generateFallbackHF(prompt, concept);
            }

            const data = await res.json() as any;
            if (data && data.images && data.images.length > 0) {
                const falCdnUrl = data.images[0].url;
                console.log(`[FalImageService] ✅ fal.ai generation successful, mirroring to Supabase...`);

                // Mirror to Supabase Storage so the URL never expires.
                // fal.ai CDN URLs (fal.media / fal.run) are temporary (~1h TTL).
                const dlRes = await fetch(falCdnUrl);
                let permanentUrl: string | null = null;
                if (dlRes.ok) {
                    const buf = await dlRes.arrayBuffer();
                    permanentUrl = await this.uploadToSupabase(Buffer.from(buf), 'image/jpeg');
                }

                if (!permanentUrl) {
                    // Upload failed — fall back to the temporary URL and log a warning
                    console.warn(`[FalImageService] ⚠️ Supabase mirror failed — falling back to temp fal CDN URL (may expire): ${falCdnUrl}`);
                    permanentUrl = falCdnUrl;
                }

                // Asynchronous Cost Logging for Fal AI
                if (this.supabaseUrl && this.supabaseKey) {
                    fetch(`${this.supabaseUrl}/rest/v1/api_cost_logs`, {
                        method: 'POST',
                        headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                        body: JSON.stringify({ provider: 'fal', operation: 'flux_pro_1_1_image', units: 1, unit_type: 'images', cost_usd: 0.05 })
                    }).catch(() => {});
                }

                await this.saveToCache(concept, permanentUrl!);
                return { url: permanentUrl, source: 'fal.ai', errorCode: null, errorMessage: null };
            }

            console.error('[FalImageService] Invalid fallback payload format:', data);
            return this.generateFallbackHF(prompt, concept);

        } catch (err: any) {
            console.error(`[FalImageService] Exception rendering on Fal: ${err.message}`);
            return this.generateFallbackHF(prompt, concept);
        }
    }

    private async generateFallbackHF(prompt: string, concept: string): Promise<ImageGenerationResult> {
        if (!this.hfToken) return { url: null, source: null, errorCode: 'missing_hf_token', errorMessage: 'No fallback token available' };
        
        console.log(`[FalImageService] Attempting HF Fallback for: "${concept}"`);
        try {
            const hfUrl = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
            const res = await fetch(hfUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.hfToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt })
            });

            if (!res.ok) {
                console.error(`[FalImageService] HF Fallback failed HTTP ${res.status}`);
                return { url: null, source: null, errorCode: 'hf_failed', errorMessage: `HTTP ${res.status}` };
            }

            // HF Inference endpoints return binary blobs
            const imageBlob = await res.arrayBuffer();
            const supabaseUrl = await this.uploadToSupabase(Buffer.from(imageBlob), 'image/jpeg');
            
            if (supabaseUrl) {
                 await this.saveToCache(concept, supabaseUrl);
                 return { url: supabaseUrl, source: 'hf-schnell', errorCode: null, errorMessage: null };
            }

            return { url: null, source: null, errorCode: 'upload_failed', errorMessage: 'Failed to upload HF blob' };

        } catch (e: any) {
            console.error('[FalImageService] HF Exception:', e.message);
            return { url: null, source: null, errorCode: 'hf_exception', errorMessage: e.message };
        }
    }

    private async uploadToSupabase(buffer: Buffer, mimeType: string): Promise<string | null> {
        if (!this.supabaseUrl || !this.supabaseKey) return null;
        try {
            const timestamp = Date.now();
            const randomId  = Math.random().toString(36).substring(7);
            const ext = mimeType === 'image/png' ? 'png' : 'jpg';
            const filePath  = `images/fal-hf-${timestamp}-${randomId}.${ext}`;

            console.log(`[FalImageService] Uploading fallback blob to Supabase...`);

            const uploadUrl = `${this.supabaseUrl}/storage/v1/object/course-images/${filePath}`;
            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': mimeType,
                    'Cache-Control': '3600',
                },
                body: new Uint8Array(buffer),
            });

            if (!uploadRes.ok) {
                console.error('[FalImageService] Supabase upload failed:', uploadRes.status, await uploadRes.text());
                return null;
            }

            return `${this.supabaseUrl}/storage/v1/object/public/course-images/${filePath}`;
        } catch (e: any) {
            console.error('[FalImageService] Upload failed:', e.message);
            return null;
        }
    }
}

export const falImageService = new FalImageService();
