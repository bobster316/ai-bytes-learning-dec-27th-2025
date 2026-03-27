import { NextResponse } from "next/server";
import { elevenLabsService } from "@/lib/services/elevenlabs-service";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        const voiceId =
            process.env.ELEVENLABS_STERLING_VOICE_ID ||
            "dcf6B8jyMjZTlgLMxo1h";

        const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId, {
            stability: 0.55,
            similarity_boost: 0.9,
            style: 0.35,
            use_speaker_boost: true
        });

        return NextResponse.json({
            audioBase64: audioBuffer.toString("base64"),
            mime: "audio/mpeg"
        });
    } catch (error: any) {
        console.error("[Sterling TTS] Error:", error?.message || error);
        return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }
}
