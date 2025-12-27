
import { createClient } from "@/lib/supabase/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export class TextToSpeechService {
    async generateSpeech(text: string): Promise<string | null> {
        // 1. Try ElevenLabs (Best for "Real UK Voice")
        if (ELEVENLABS_API_KEY) {
            try {
                // standardized 'Alice' voice ID or similar for British Female
                // Nicole: piTKgcLEGmPE4e6mEKli (Whispering) - No
                // Alice (standard news): Xb7hH8MSUJpSbSDYk0k2
                // We'll use a generic "British" looking one or default to a known good one.
                // Required: "Real UK English Young Woman". 
                // "Charlotte" or "Alice" are common.
                // Let's assume a default ID if not configured.
                const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2"; // Default to Alice if not set
                // optimize_streaming_latency=3 (Max speed, still good quality)
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3`, {
                    method: "POST",
                    headers: {
                        "xi-api-key": ELEVENLABS_API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                        model_id: "eleven_monolingual_v1",
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                        }
                    })
                });

                if (response.ok) {
                    const audioBuffer = await response.arrayBuffer();
                    // In a real app, upload to Supabase Storage and return URL.
                    // For latency, returning Base64 is faster but heavier.
                    // Let's use Base64 for instant feedback on the widget.
                    const start = Buffer.from(audioBuffer).toString("base64");
                    return `data:audio/mpeg;base64,${start}`;
                }
            } catch (e) {
                console.error("ElevenLabs TTS failed:", e);
            }
        }

        // 2. Try OpenAI (Good fallback)
        if (OPENAI_API_KEY) {
            try {
                // OpenAI 'Fable' is British-ish? 'Shimmer' is clear female.
                // User wants "UK". 
                // Unfortunately OpenAI voices are limited.
                const OpenAI = (await import("openai")).default;
                const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

                const mp3 = await openai.audio.speech.create({
                    model: "tts-1",
                    voice: "shimmer", // Female
                    input: text,
                });

                const buffer = Buffer.from(await mp3.arrayBuffer());
                const base64 = buffer.toString("base64");
                return `data:audio/mpeg;base64,${base64}`;
            } catch (e) {
                console.error("OpenAI TTS failed:", e);
            }
        }

        return null; // Fallback to browser
    }
}

export const ttsService = new TextToSpeechService();
