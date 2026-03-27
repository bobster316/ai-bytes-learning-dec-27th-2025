import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { elevenLabsService } from "@/lib/services/elevenlabs-service";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 600;

const SCRIPT_PROMPT = `You are writing a short spoken lesson recap for an AI learning platform.
This plays AFTER the student has completed the lesson. Your job is to briefly summarise what was covered — reinforcing the key points.

Rules:
- Write in British English, past tense ("In this lesson, we covered...")
- Conversational, warm, direct tone — like a teacher wrapping up a class
- Target length: 70–85 words (roughly 40–45 seconds when spoken aloud) — keep it tight
- No stage directions, no speaker labels, no markdown — just the spoken words
- Briefly touch on what the lesson covered so the student has a clear mental summary
- End with one sentence that connects the lesson to the bigger picture
- TERMINOLOGY: Always refer to the content as a "lesson" or "deep dive". NEVER use the word "module".
- STRICTLY AVOID: "demystify", "delve", "dive into", "unpack", "explore", "journey", "game-changer", "cutting-edge", "leverage", "unlock", "empower", "transformative", "deep dive", "buckle up", "let's get started", "in conclusion"
- Write short sentences. Each sentence should its own thought. Natural pauses matter.`;

function buildTopicBrief(topic: any, lessons: any[]): string {
    const lessonTitles = lessons.map((l: any) => `- ${l.title}`).join("\n");
    return `LESSON: ${topic.title}\n\nConcepts in this lesson:\n${lessonTitles}`;
}

async function generateScript(brief: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(`${SCRIPT_PROMPT}\n\n${brief}`);
    const text = result.response.text().trim();

    if (!text) throw new Error("Gemini returned an empty script");
    return addPauseMarkers(text);
}

// Injects ElevenLabs SSML break markers to create natural breathing pauses.
// Sentence endings get a longer pause; commas and dashes get a shorter one.
function addPauseMarkers(text: string): string {
    return text
        // Long pause after sentence endings
        .replace(/([.!?])\s+/g, '$1<break time="0.5s"/> ')
        // Short pause after commas, colons, semicolons
        .replace(/([,:;])\s+/g, '$1<break time="0.25s"/> ')
        // Short pause around em-dashes
        .replace(/\s*—\s*/g, '<break time="0.3s"/>— ');
}

function sseMsg(data: object): Uint8Array {
    return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /api/admin/courses/generate-audio
// Body: { courseId: string, force?: boolean }
// Generates one audio overview per MODULE (topic), not per lesson.
// Uses Gemini Flash to write the script, ElevenLabs to speak it.
// Streams SSE progress events.
export async function POST(req: Request) {
    const { courseId, force = false } = await req.json();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => controller.enqueue(sseMsg(data));

            try {
                if (!courseId) {
                    send({ type: "error", message: "Missing courseId" });
                    controller.close();
                    return;
                }

                const supabase = await createClient();

                // Fetch all topics with their lessons
                const { data: topics, error } = await supabase
                    .from("course_topics")
                    .select(`
                        id, title, audio_url,
                        course_lessons(id, title)
                    `)
                    .eq("course_id", courseId)
                    .order("order_index");

                if (error) {
                    send({ type: "error", message: error.message });
                    controller.close();
                    return;
                }

                const queue = (topics || []).filter((t: any) => force || !t.audio_url);
                const total = queue.length;
                const alreadyDone = (topics?.length || 0) - total;

                if (total === 0) {
                    send({ type: "done", generated: 0, skipped: alreadyDone, total: topics?.length || 0 });
                    controller.close();
                    return;
                }

                send({ type: "start", total, skipped: alreadyDone });

                let generated = 0;
                const errors: string[] = [];

                for (let i = 0; i < queue.length; i++) {
                    const topic = queue[i];
                    send({ type: "progress", done: i, total, lessonTitle: topic.title });

                    try {
                        const lessons = (topic.course_lessons || []).sort(
                            (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
                        );
                        const brief = buildTopicBrief(topic, lessons);

                        // Step 1: Generate the script with Gemini
                        console.log(`[BulkAudio] Generating script for: ${topic.title}`);
                        const script = await generateScript(brief);
                        console.log(`[BulkAudio] Script (${script.length} chars):\n${script.substring(0, 200)}...`);

                        // Step 2: Convert script to speech with ElevenLabs using Sterling's voice
                        const sterlingVoiceId = process.env.ELEVENLABS_STERLING_VOICE_ID;
                        if (!sterlingVoiceId) throw new Error("ELEVENLABS_STERLING_VOICE_ID not set in environment");

                        console.log(`[BulkAudio] Converting to speech with ElevenLabs (Sterling)...`);
                        const audioBuffer = await elevenLabsService.generateSpeech(
                            script,
                            sterlingVoiceId,
                            { stability: 0.55, similarity_boost: 0.85, style: 0.2 }
                        );

                        // Step 3: Upload MP3 to Supabase Storage (admin client bypasses RLS)
                        const fileName = `topics/${courseId}/${topic.id}/overview.mp3`;
                        const { error: uploadErr } = await supabaseAdmin.storage
                            .from("course-assets")
                            .upload(fileName, audioBuffer, { contentType: "audio/mpeg", upsert: true });

                        if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

                        const { data: { publicUrl } } = supabaseAdmin.storage.from("course-assets").getPublicUrl(fileName);
                        const { error: updateErr } = await supabaseAdmin
                            .from("course_topics")
                            .update({ audio_url: publicUrl })
                            .eq("id", topic.id);

                        if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

                        generated++;
                        console.log(`[BulkAudio] Done: ${topic.title}`);
                        send({ type: "lesson_done", done: i + 1, total, lessonTitle: topic.title });

                    } catch (e: any) {
                        console.error(`[BulkAudio] Failed for topic ${topic.id}:`, e.message);
                        errors.push(`${topic.title}: ${e.message}`);
                        send({ type: "lesson_error", done: i + 1, total, lessonTitle: topic.title, error: e.message });
                    }
                }

                send({
                    type: "done",
                    generated,
                    skipped: alreadyDone,
                    total: topics?.length || 0,
                    errors: errors.length > 0 ? errors : undefined
                });

            } catch (e: any) {
                console.error("[BulkAudio] Error:", e);
                send({ type: "error", message: e.message });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    });
}
