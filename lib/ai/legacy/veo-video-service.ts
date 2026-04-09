/**
 * Veo Video Service — Vertex AI REST API
 *
 * Uses the predictLongRunning → fetchPredictOperation pattern.
 * Auth via google-auth-library service account (GOOGLE_APPLICATION_CREDENTIALS).
 * Uploads generated video to Supabase Storage.
 */

import { GoogleAuth } from "google-auth-library";
import path from "path";

export interface VideoGenerationResult {
    url: string | null;
    source: string | null;
    errorCode: string | null;
    errorMessage: string | null;
}

export interface VeoVideo {
    url: string;
    caption: string;
}

const PROJECT_ID  = process.env.GOOGLE_CLOUD_PROJECT_ID || "gen-lang-client-0279671242";
const LOCATION    = "us-central1";
const MODEL_ID    = process.env.VEO_MODEL_ID || "veo-3.1-generate-001";
const VERTEX_BASE = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models`;

const POLL_INTERVAL_MS = 12_000;
const POLL_MAX_ATTEMPTS = 20; // ~4 min ceiling — route waits max 2 min extra after images

class VeoVideoService {

    private async getAccessToken(): Promise<string | null> {
        try {
            const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
                || path.join(process.cwd(), "google-application-credentials.json");

            const auth = new GoogleAuth({
                keyFilename: credentialsPath,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"],
            });
            const client = await auth.getClient();
            const tokenResponse = await (client as any).getAccessToken();
            return tokenResponse?.token || tokenResponse || null;
        } catch (e: any) {
            console.warn("[VeoService] Auth failed:", e.message);
            return null;
        }
    }

    /**
     * Generate a short cinematic video clip using Veo on Vertex AI.
     */
    async generateVideo(prompt: string, caption: string): Promise<VideoGenerationResult> {
        const token = await this.getAccessToken();
        if (!token) {
            console.warn("[VeoService] No access token — cannot generate");
            return { url: null, source: null, errorCode: 'auth_failed', errorMessage: 'Veo: failed to obtain Google Cloud access token — check GOOGLE_APPLICATION_CREDENTIALS' };
        }

        try {
            console.log(`[VeoService] Generating video — model: ${MODEL_ID}, prompt: "${prompt.substring(0, 60)}..."`);

            // 1. Fire predictLongRunning
            const generateUrl = `${VERTEX_BASE}/${MODEL_ID}:predictLongRunning`;
            const initRes = await fetch(generateUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({
                    instances: [{ prompt: this.buildVideoPrompt(prompt) }],
                    parameters: {
                        sampleCount:     1,
                        durationSeconds: 8,
                        aspectRatio:     "16:9",
                    },
                }),
            });

            if (!initRes.ok) {
                const errBody = await initRes.text();
                console.error(`[VeoService] predictLongRunning failed HTTP ${initRes.status}:`, errBody);
                return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo HTTP ${initRes.status}: ${errBody.substring(0, 200)}` };
            }

            const initData = await initRes.json();
            const operationName: string = initData?.name;
            if (!operationName) {
                console.error("[VeoService] No operation name in response:", initData);
                return { url: null, source: null, errorCode: 'empty_result', errorMessage: 'Veo: predictLongRunning returned no operation name' };
            }

            console.log(`[VeoService] Operation accepted: ${operationName}`);

            // 2. Poll fetchPredictOperation
            const finalData = await this.pollOperation(operationName, token);
            if (!finalData) {
                return { url: null, source: null, errorCode: 'timeout', errorMessage: `Veo: operation timed out after ${POLL_MAX_ATTEMPTS} polls (${(POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000).toFixed(0)}s)` };
            }

            if (finalData.error) {
                const raw = JSON.stringify(finalData.error).substring(0, 200);
                console.error("[VeoService] Operation error:", finalData.error);
                return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo operation error: ${raw}` };
            }

            const videos = finalData.response?.videos;
            if (!Array.isArray(videos) || videos.length === 0) {
                const filtered = finalData.response?.raiMediaFilteredCount;
                const reasons = finalData.response?.raiMediaFilteredReasons;
                console.warn(`[VeoService] No videos returned. raiMediaFilteredCount=${filtered}`, reasons);
                const isRai = filtered && filtered > 0;
                return {
                    url: null, source: null,
                    errorCode: isRai ? 'content_policy_violation' : 'empty_result',
                    errorMessage: isRai
                        ? `Veo: video blocked by RAI safety filter — reasons: ${JSON.stringify(reasons)}`
                        : 'Veo: operation completed but returned no video data',
                };
            }

            const videoEntry = videos[0];
            const gcsUri: string | undefined = videoEntry?.gcsUri || videoEntry?.uri;
            const base64Data: string | undefined = videoEntry?.bytesBase64Encoded;

            let publicUrl: string | null = null;

            if (base64Data) {
                console.log("[VeoService] Video returned as base64 — uploading directly");
                const videoBuffer = Buffer.from(base64Data, "base64");
                publicUrl = await this.uploadBuffer(videoBuffer);
            } else if (gcsUri) {
                console.log("[VeoService] Video ready at GCS:", gcsUri);
                publicUrl = await this.downloadAndUpload(gcsUri, token);
            } else {
                console.error("[VeoService] Video entry has neither gcsUri nor base64 data:", videoEntry);
                return { url: null, source: null, errorCode: 'empty_result', errorMessage: 'Veo: video entry contains neither GCS URI nor base64 data' };
            }

            if (!publicUrl) {
                return { url: null, source: null, errorCode: 'upload_failed', errorMessage: 'Veo: video generated but Supabase Storage upload failed' };
            }

            console.log("[VeoService] ✅ Uploaded to Supabase:", publicUrl);
            return { url: publicUrl, source: 'veo', errorCode: null, errorMessage: null };

        } catch (err: any) {
            const raw = err?.message || String(err);
            console.error("[VeoService] ❌ Unexpected error:", raw);
            return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo unexpected error: ${raw.substring(0, 200)}` };
        }
    }

    private async pollOperation(operationName: string, token: string): Promise<any> {
        const pollUrl = `${VERTEX_BASE}/${MODEL_ID}:fetchPredictOperation`;

        for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
            console.log(`[VeoService] Poll ${attempt}/${POLL_MAX_ATTEMPTS}...`);

            const res = await fetch(pollUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({ operationName }),
            });

            if (!res.ok) {
                const body = await res.text();
                console.error(`[VeoService] fetchPredictOperation HTTP ${res.status}:`, body);
                return null;
            }

            const data = await res.json();
            if (data.done) {
                console.log(`[VeoService] Operation done after ${attempt} poll(s)`);
                return data;
            }

            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        }

        console.error(`[VeoService] Timed out after ${POLL_MAX_ATTEMPTS} polls`);
        return null;
    }

    private async uploadBuffer(videoBuffer: Buffer): Promise<string | null> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            console.warn("[VeoService] Missing Supabase env vars");
            return null;
        }

        try {
            const timestamp = Date.now();
            const randomId  = Math.random().toString(36).substring(7);
            const filePath  = `videos/veo-${timestamp}-${randomId}.mp4`;

            console.log(`[VeoService] Uploading ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB to Supabase...`);

            const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/course-images/${filePath}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "video/mp4",
                    "Cache-Control": "3600",
                },
                body: new Uint8Array(videoBuffer),
            });

            if (!uploadRes.ok) {
                const body = await uploadRes.text();
                console.error("[VeoService] Supabase upload failed:", uploadRes.status, body);
                return null;
            }

            return `${supabaseUrl}/storage/v1/object/public/course-images/${filePath}`;
        } catch (e: any) {
            console.error("[VeoService] uploadBuffer error:", e.message);
            return null;
        }
    }

    private async downloadAndUpload(gcsUri: string, token: string): Promise<string | null> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            console.warn("[VeoService] Missing Supabase env vars");
            return null;
        }

        try {
            // Convert gs:// URI to HTTPS storage URL for download
            // Pattern: gs://BUCKET/path/to/file.mp4
            const httpsUri = gcsUri.replace(
                /^gs:\/\/([^/]+)\/(.+)$/,
                "https://storage.googleapis.com/$1/$2"
            );

            const videoRes = await fetch(httpsUri, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!videoRes.ok) {
                console.error(`[VeoService] GCS download failed HTTP ${videoRes.status}`);
                return null;
            }

            const videoBuffer = await videoRes.arrayBuffer();
            console.log(`[VeoService] Downloaded ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

            // Upload to Supabase Storage via REST (bypasses SDK size limits)
            const timestamp  = Date.now();
            const randomId   = Math.random().toString(36).substring(7);
            const filePath   = `videos/veo-${timestamp}-${randomId}.mp4`;
            const uploadUrl  = `${supabaseUrl}/storage/v1/object/course-images/${filePath}`;

            const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "video/mp4",
                    "Cache-Control": "3600",
                },
                body: videoBuffer,
            });

            if (!uploadRes.ok) {
                const body = await uploadRes.text();
                console.error("[VeoService] Supabase upload failed:", uploadRes.status, body);
                return null;
            }

            return `${supabaseUrl}/storage/v1/object/public/course-images/${filePath}`;

        } catch (e: any) {
            console.error("[VeoService] downloadAndUpload error:", e.message);
            return null;
        }
    }

    private buildVideoPrompt(basePrompt: string): string {
        // Strip existing SCENE: prefix to avoid double-wrapping (AI's videoPrompt already starts with "SCENE:")
        const cleanPrompt = basePrompt.replace(/^SCENE:\s*/i, '').trim();
        
        return `Create a highly accurate, temporally stable, photorealistic video clip. Prioritize identity consistency, correctness, motion realism, object permanence, lighting continuity, background stability, and smooth frame-to-frame coherence. Do not improvise details.

SCENE: ${cleanPrompt}

ABSOLUTE RULE: Show the LITERAL subject described above. NO metaphors, NO analogies, NO substitutions.
If the scene describes a technology concept, show the ACTUAL technology (screens, interfaces, hardware, data visualizations).
Do NOT replace technical subjects with nature scenes, food preparation, music, crafts, or any other metaphorical domain.

Camera movement: Slow deliberate push-in or subtle orbital movement. Locked stability, zero shake.
Framing: Rule of thirds. Sharp subject, beautifully bokeh'd background.
Lighting: Cinematic and mood-matched — cool blue-hour glow for tech subjects, warm studio for physical subjects. Consistent throughout clip.
Style: photorealistic, cinematic realism, stable continuity
Shot duration: 8 seconds

ACCURACY RULES (MANDATORY):
- Follow the scene description EXACTLY. Do not improvise, stylize, or invent extra details.
- Maintain correct object geometry, perspective, scale, and spatial relationships throughout all frames.
- Keep motion physically believable and temporally stable.
- Keep the scene coherent from frame to frame with no flicker, drift, morphing, or sudden changes.
- Preserve all materials, textures, colours, and lighting consistently across the entire clip.
- If any element is ambiguous, choose the most realistic and conservative interpretation.

NEGATIVE CONSTRAINTS (ABSOLUTELY AVOID):
no flicker, no drift, no morphing, no anatomy errors, no extra fingers, no object duplication, no background instability, no sudden motion jumps, no camera glitches, no warped text, no random environmental changes, no face deformation, no floating objects, no merged features, no text overlays, no captions, no subtitles, no labels, no logos, no watermarks, no human faces, no direct-to-camera shots, no cartoons, no illustrations, no flat design, no fast cuts, no abrupt motion, no metaphorical scenes

IMPORTANT: Accuracy is more important than novelty. Do not creatively reinterpret the request. Do not add cinematic embellishments, stylized flourishes, or invented objects. Keep the result conservative, exact, stable, and production-safe.`;
    }

    isAvailable(): boolean {
        // Can't check synchronously without async auth call — assume available if env vars present
        return !!(
            process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            require("fs").existsSync(path.join(process.cwd(), "google-application-credentials.json"))
        );
    }
}

export const veoVideoService = new VeoVideoService();
