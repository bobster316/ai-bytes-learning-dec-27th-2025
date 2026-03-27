/**
 * Veo Smoke Test — Vertex AI REST API
 *
 * Tests the full predictLongRunning → fetchPredictOperation flow.
 * Uses google-auth-library + service account for auth.
 *
 * GET /api/test-veo?model=veo-3.1-generate-001&fast=true
 *   model  — override model id (default: veo-3.1-generate-001)
 *   fast   — if "true", use veo-3.1-fast-generate-001
 *   prompt — override the test prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import path from "path";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || "gen-lang-client-0279671242";
const LOCATION    = "us-central1";
const SAFE_PROMPT = "A calm paper airplane gliding slowly across a clear blue sky, cinematic wide shot, no people, no text";

const VERTEX_BASE = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models`;

async function getAccessToken(): Promise<string> {
    // Prefer explicit credentials file, fall back to ADC
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        || path.join(process.cwd(), "google-application-credentials.json");

    const auth = new GoogleAuth({
        keyFilename: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await (client as any).getAccessToken();
    const token = tokenResponse?.token || tokenResponse;
    if (!token) throw new Error("Failed to obtain access token from service account");
    return token;
}

async function pollOperation(
    modelId: string,
    operationName: string,
    token: string,
    maxAttempts = 30,
    intervalMs = 12_000
): Promise<any> {
    const pollUrl = `${VERTEX_BASE}/${modelId}:fetchPredictOperation`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`[test-veo] Poll attempt ${attempt}/${maxAttempts}...`);

        const res = await fetch(pollUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({ operationName }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(`fetchPredictOperation HTTP ${res.status}: ${JSON.stringify(data)}`);
        }

        if (data.done) return data;

        // Not done yet — wait before next poll
        await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error(`Operation did not complete after ${maxAttempts} polls (${(maxAttempts * intervalMs) / 1000}s)`);
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fastMode = searchParams.get("fast") === "true";
    const modelId  = searchParams.get("model")
        || (fastMode ? "veo-3.1-fast-generate-001" : "veo-3.1-generate-001");
    const prompt   = searchParams.get("prompt") || SAFE_PROMPT;

    const log: Record<string, any> = {
        model:     modelId,
        projectId: PROJECT_ID,
        location:  LOCATION,
        prompt,
    };

    try {
        // 1. Get auth token
        const token = await getAccessToken();
        log.auth = "✅ service account token obtained";

        // 2. Fire predictLongRunning
        const generateUrl = `${VERTEX_BASE}/${modelId}:predictLongRunning`;
        log.generateUrl = generateUrl;

        const generateBody = {
            instances: [{ prompt }],
            parameters: {
                sampleCount:     1,
                durationSeconds: 6,
                aspectRatio:     "16:9",
            },
        };

        const initRes = await fetch(generateUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(generateBody),
        });

        const initData = await initRes.json();
        log.initStatus     = initRes.status;
        log.initResponse   = initData;
        log.operationName  = initData?.name;

        if (!initRes.ok) {
            log.error = `predictLongRunning failed: HTTP ${initRes.status}`;
            return NextResponse.json({ success: false, log }, { status: 200 });
        }

        if (!initData?.name) {
            log.error = "No operation name returned — request may have been rejected";
            return NextResponse.json({ success: false, log }, { status: 200 });
        }

        log.initResult = "✅ operation accepted";

        // 3. Poll fetchPredictOperation
        const finalData = await pollOperation(modelId, initData.name, token);

        log.done                     = finalData.done;
        log.error                    = finalData.error;
        log.raiMediaFilteredCount    = finalData.response?.raiMediaFilteredCount;
        log.raiMediaFilteredReasons  = finalData.response?.raiMediaFilteredReasons;

        // Summarise videos — don't include raw base64 (3MB+) in the response
        const rawVideos: any[] = finalData.response?.videos || [];
        log.videos = rawVideos.map((v: any) => ({
            gcsUri:       v.gcsUri || v.uri || null,
            mimeType:     v.mimeType || null,
            base64Bytes:  v.bytesBase64Encoded ? `${Math.round(v.bytesBase64Encoded.length * 0.75 / 1024)}KB (inline)` : null,
        }));

        const success = finalData.done === true
            && !finalData.error
            && rawVideos.length > 0;

        log.verdict = success
            ? "✅ Veo generation WORKING — video produced"
            : "❌ Veo generation reached done:true but no videos returned — check raiMediaFilteredReasons";

        return NextResponse.json({ success, log }, { status: 200 });

    } catch (err: any) {
        log.thrown = err.message;
        log.verdict = "❌ Exception thrown — see 'thrown' field";
        return NextResponse.json({ success: false, log }, { status: 200 });
    }
}
