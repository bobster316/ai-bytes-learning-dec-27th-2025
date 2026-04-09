import fetch from 'node-fetch';
import type { VideoGenerationResult } from './media-errors';

class KieVideoService {
    private readonly kieKey = process.env.KIE_API_KEY || '';
    private readonly supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    private readonly supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    private readonly POLL_INTERVAL_MS = 10000;
    private readonly POLL_MAX_ATTEMPTS = 30; // 5 mins max

    async generateVideo(prompt: string): Promise<VideoGenerationResult> {
        if (!this.kieKey) {
            console.error('[KieVideoService] KIE_API_KEY is missing.');
            return { url: null, source: null, errorCode: 'missing_kie_key', errorMessage: 'KIE API key is missing' };
        }

        console.log(`[KieVideoService] Attempting generation with Wan 2.6...`);

        try {
            // 1. Submit Generation Task
            const submitUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
            let taskId: string | null = null;
            let sourceUsed: 'kie-wan-2.6' | 'kie-kling-2.1' | null = null;

            // Attempt 1: Wan 2.6
            const wanRes = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.kieKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: 'wan/2-6-text-to-video',
                    input: {
                        prompt: prompt,
                        aspect_ratio: '16:9'
                    }
                })
            });

            if (wanRes.ok) {
                const wanData = await wanRes.json() as any;
                if (wanData.code && wanData.code !== 200) {
                     console.warn(`[KieVideoService] Wan 2.6 API Error (Code ${wanData.code}): ${wanData.msg || 'Unknown'}`);
                } else {
                     taskId = wanData.taskId || wanData.data?.taskId || wanData.task_id || wanData.data?.task_id || wanData.id;
                     if (taskId) sourceUsed = 'kie-wan-2.6';
                }
            } else {
                 console.warn(`[KieVideoService] Wan 2.6 failed HTTP ${wanRes.status}:`, await wanRes.text());
            }

            // Attempt 2: Kling V2.1 Standard Fallback
            if (!taskId) {
                console.log(`[KieVideoService] Falling back to Kling V2.1 Standard...`);
                const klingRes = await fetch(submitUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.kieKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'kling/v2-1-standard',
                        input: {
                            prompt: prompt,
                            aspect_ratio: '16:9',
                            duration: '5'
                        }
                    })
                });

                if (klingRes.ok) {
                    const klingData = await klingRes.json() as any;
                    if (klingData.code && klingData.code !== 200) {
                         console.warn(`[KieVideoService] Kling V2.1 API Error (Code ${klingData.code}): ${klingData.msg || 'Unknown'}`);
                    } else {
                         taskId = klingData.taskId || klingData.data?.taskId || klingData.task_id || klingData.data?.task_id || klingData.id;
                         if (taskId) sourceUsed = 'kie-kling-2.1';
                    }
                } else {
                     console.error(`[KieVideoService] Kling V2.1 failed HTTP ${klingRes.status}:`, await klingRes.text());
                }
            }

            if (!taskId || !sourceUsed) {
                return { url: null, source: null, errorCode: 'submission_failed', errorMessage: 'Both Wan 2.6 and Kling V2.1 failed to submit' };
            }

            console.log(`[KieVideoService] Task submitted successfully using ${sourceUsed}. Task ID: ${taskId}`);

            // 2. Poll for Completion
            // Note: Polling endpoint for jobs/createTask is usually recordInfo API.
            const pollUrl = `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`;
            
            let completedVideoUrl: string | null = null;

            for (let i = 1; i <= this.POLL_MAX_ATTEMPTS; i++) {
                console.log(`[KieVideoService] Polling task ${taskId} (Attempt ${i}/${this.POLL_MAX_ATTEMPTS})...`);
                
                // Pause before checking
                await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));

                let pollRes = await fetch(pollUrl, {
                    headers: { 'Authorization': `Bearer ${this.kieKey}` }
                });

                if (!pollRes.ok) {
                    console.warn(`[KieVideoService] Poll failed HTTP ${pollRes.status}`);
                    continue; // Skip one error, might be a temporary hiccup
                }

                let pollData = await pollRes.json() as any;
                
                // Inspect status (could be root or inside data object)
                const payload = pollData.data || pollData;
                const status = payload.status || payload.state;

                if (status === 'completed' || status === 'succeeded' || status === 'success') {
                    // Try to parse resultJson if it's a string from the /jobs API
                    if (typeof payload.resultJson === 'string') {
                        try {
                            const resultObj = JSON.parse(payload.resultJson);
                            completedVideoUrl = resultObj.resultUrls?.[0] || resultObj.url || resultObj?.videos?.[0]?.url;
                        } catch (e) {
                            console.warn('[KieVideoService] Failed to parse resultJson', e);
                        }
                    }
                    
                    if (!completedVideoUrl) {
                         completedVideoUrl = payload.video?.url || payload.url || payload.video_url || payload.outputs?.[0]?.url || payload.videos?.[0]?.url;
                    }

                    console.log(`[KieVideoService] Task completed! Original URL: ${completedVideoUrl}`);
                    break;
                } else if (status === 'failed' || status === 'error') {
                    console.error('[KieVideoService] Task failed on server:', pollData);
                    return { url: null, source: null, errorCode: 'server_failed', errorMessage: 'Kie generation failed on their end.' };
                }
                // else status is queuing/processing, continue loop
            }

            if (!completedVideoUrl) {
                return { url: null, source: null, errorCode: 'timeout', errorMessage: 'Task timed out waiting for Kie.ai completion' };
            }

            // 3. Download the video binary
            console.log(`[KieVideoService] Downloading generated asset from Kie...`);
            const dlRes = await fetch(completedVideoUrl);
            if (!dlRes.ok) {
                 return { url: null, source: null, errorCode: 'download_failed', errorMessage: `Failed to download external video HTTP ${dlRes.status}` };
            }
            const buffer = await dlRes.arrayBuffer();

            // 4. Upload to our Supabase Storage
            console.log(`[KieVideoService] Uploading ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB video to Supabase Storage...`);
            const supabasePublicUrl = await this.uploadBuffer(Buffer.from(buffer));

            if (!supabasePublicUrl) {
                return { url: null, source: null, errorCode: 'upload_failed', errorMessage: 'Failed to mirror Kie video to Supabase Storage' };
            }

            console.log(`[KieVideoService] ✅ Flow complete! Superbase URL: ${supabasePublicUrl}`);

            // Asynchronous cost logging for Kie.ai Video
            if (this.supabaseUrl && this.supabaseKey) {
                fetch(`${this.supabaseUrl}/rest/v1/api_cost_logs`, {
                    method: 'POST',
                    headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ provider: 'kie', operation: 'wan_2_6_video', units: 1, unit_type: 'videos', cost_usd: 0.10 })
                }).catch(() => {});
            }

            return { url: supabasePublicUrl, source: sourceUsed, errorCode: null, errorMessage: null };

        } catch (e: any) {
             console.error('[KieVideoService] Critical Exception:', e);
             return { url: null, source: null, errorCode: 'exception', errorMessage: e.message };
        }
    }

    private async uploadBuffer(videoBuffer: Buffer): Promise<string | null> {
        if (!this.supabaseUrl || !this.supabaseKey) return null;

        try {
            const timestamp = Date.now();
            const randomId  = Math.random().toString(36).substring(7);
            const filePath  = `videos/kie-wan-${timestamp}-${randomId}.mp4`;

            const uploadUrl = `${this.supabaseUrl}/storage/v1/object/course-images/${filePath}`;
            const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.supabaseKey}`,
                    "Content-Type": "video/mp4",
                    "Cache-Control": "3600",
                },
                body: videoBuffer,
            });

            if (!uploadRes.ok) {
                console.error("[KieVideoService] Supabase upload failed:", uploadRes.status, await uploadRes.text());
                return null;
            }

            return `${this.supabaseUrl}/storage/v1/object/public/course-images/${filePath}`;
        } catch (e: any) {
            console.error("[KieVideoService] buffer upload error:", e.message);
            return null;
        }
    }
}

export const kieVideoService = new KieVideoService();
