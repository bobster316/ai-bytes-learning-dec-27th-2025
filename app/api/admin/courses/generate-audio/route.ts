import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 600;

// 10 structurally distinct recap templates.
// Each has a different narrative shape, tone, opening style, and closing move.
// The template index is injected per-module so no two consecutive modules sound alike.
const RECAP_TEMPLATES = [
    {
        id: 'core_fact',
        instruction: `Open with one confident, declarative sentence that names the single most important idea from this topic — no preamble, just the fact itself. Then spend 2–3 sentences unpacking why it matters. Close with what the student is now positioned to do next.
Tone: authoritative, precise. No filler words.
Example opening: "Transformers don't read text. They process relationships between tokens simultaneously."`,
    },
    {
        id: 'before_after',
        instruction: `Open by naming what a student without this knowledge would misunderstand or get wrong. Then briefly describe the corrected mental model. Close with one sentence about where this understanding leads.
Tone: corrective but encouraging — like a mentor fixing a common misconception.
Example opening: "Most people think neural networks learn rules. They don't. They learn weights."`,
    },
    {
        id: 'so_what',
        instruction: `Open with a "so what" — the real-world consequence or implication of this topic. Don't explain the mechanics; start with the impact. Then work backwards to briefly explain what produces that impact. Close with a practical takeaway.
Tone: direct, slightly provocative.
Example opening: "The reason AI can now pass bar exams isn't raw intelligence. It's scale, and knowing how that scale works changes how you use these tools."`,
    },
    {
        id: 'capability_unlock',
        instruction: `Open with a specific thing the student can now do, read, or understand that they couldn't before. Be concrete — name something real. Then explain briefly what knowledge enables that capability. Close by pointing forward.
Tone: confident, empowering without cliché.
Example opening: "You can now read an arXiv paper on attention mechanisms and follow the argument. That's not a small thing."`,
    },
    {
        id: 'the_question',
        instruction: `Open with a single rhetorical question that captures the central tension or puzzle of this topic. Answer it in one sentence. Then spend the rest synthesising the key ideas that support that answer. Close with what comes next.
Tone: curious, Socratic.
Example opening: "Why does the same prompt produce wildly different outputs? The answer sits in how probability distributions work at inference time."`,
    },
    {
        id: 'mental_model',
        instruction: `Open by naming the mental model or analogy the student now holds for this topic. Describe it briefly. Then show 2–3 things that model explains or predicts. Close with one honest caveat or limitation of that model.
Tone: analytical, intellectually honest.
Example opening: "Think of a language model as a very sophisticated compression algorithm. That framing explains a lot — including why it occasionally makes things up."`,
    },
    {
        id: 'then_vs_now',
        instruction: `Open with a brief snapshot of how practitioners thought about this topic before the current understanding existed. Then contrast that with what we know now. Close with why that shift matters for what the student is building or learning.
Tone: historical, contextual — makes the learning feel earned.
Example opening: "For decades, AI researchers hand-crafted features. Then end-to-end learning changed everything, and the field never looked back."`,
    },
    {
        id: 'the_surprising_part',
        instruction: `Open with the single most counterintuitive or surprising fact from this topic — something a non-expert would not expect. Let the surprise land before explaining it. Close with what that surprise implies for the student going forward.
Tone: engaging, slightly mischievous.
Example opening: "The surprising part? More parameters doesn't always mean better reasoning. Size and capability are related, but not linearly."`,
    },
    {
        id: 'practitioners_lens',
        instruction: `Open from the perspective of someone applying this knowledge professionally — what does a practitioner actually think about or watch out for? Ground the recap in real usage, not theory. Close with a practical watchpoint or heuristic the student can carry forward.
Tone: pragmatic, no-nonsense, like a senior colleague debriefing after a project.
Example opening: "In practice, the failure mode isn't the model being wrong. It's the model being confidently wrong. Knowing why that happens is your first line of defence."`,
    },
    {
        id: 'the_thread',
        instruction: `Open by naming the single thread that runs through everything in this topic — the organising principle that ties the concepts together. Then trace how that thread connects 2–3 of the key ideas. Close with how that thread continues into what comes next.
Tone: reflective, cohesive — helps the student see the big picture.
Example opening: "Everything in this topic comes back to one idea: that representations matter more than rules."`,
    },
] as const;

const BASE_RULES = `You are writing a short spoken module recap for an AI learning platform.
This plays AFTER the student has completed all lessons in a module.

Universal rules — apply regardless of template:
- British English throughout
- 70–85 words total (roughly 40–45 seconds spoken)
- No stage directions, no speaker labels, no markdown — spoken words only
- Do NOT name individual lessons, lesson numbers, or lesson titles
- Synthesise into a single cohesive voice — not a list
- BANNED WORDS/PHRASES: "we covered", "in this module", "throughout this module", "in this lesson", "you've learned", "you've completed", "today we", "by now you", "demystify", "delve", "dive into", "unpack", "explore", "journey", "game-changer", "cutting-edge", "leverage", "unlock", "empower", "transformative", "deep dive", "it's worth noting", "in conclusion", "to summarise"
- Short sentences. Each sentence is one thought. Let the pauses breathe.`;

// Extract plain-text summary from a lesson's content_blocks or content_markdown
function extractLessonText(lesson: any): string {
    // Try content_blocks first (structured JSON)
    if (lesson.content_blocks && Array.isArray(lesson.content_blocks)) {
        const texts: string[] = [];
        for (const block of lesson.content_blocks) {
            if (block.type === 'text_section' || block.type === 'core_explanation') {
                texts.push(block.body || block.content || block.text || '');
            } else if (block.type === 'key_takeaway' || block.type === 'teaching_line') {
                texts.push(block.text || block.content || '');
            } else if (block.type === 'hook') {
                texts.push(block.question || block.statement || block.text || '');
            }
        }
        const joined = texts.filter(Boolean).join(' ').trim();
        if (joined.length > 40) return joined.slice(0, 600); // Cap at 600 chars per lesson
    }
    // Fallback: content_markdown (plain text)
    if (lesson.content_markdown && typeof lesson.content_markdown === 'string') {
        const raw = lesson.content_markdown.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (raw.length > 40) return raw.slice(0, 600);
    }
    // Last resort: just use the title
    return lesson.title || '';
}

function buildTopicBrief(topic: any, lessons: any[], topicIndex: number): string {
    const contentSections = lessons.map((l: any) => extractLessonText(l)).filter(Boolean);
    const combinedContent = contentSections.join(' ');
    const template = RECAP_TEMPLATES[topicIndex % RECAP_TEMPLATES.length];

    return `MODULE TOPIC: ${topic.title}
TEMPLATE FOR THIS RECAP (follow the structural instruction exactly):
${template.instruction}

Module content to draw from (synthesise — do NOT reference individual lessons):
${combinedContent || 'An introduction to ' + topic.title}`;
}

async function generateScript(brief: string): Promise<string> {
    const groqKey = process.env.GROQ_STERLING_API_KEY;
    if (!groqKey) throw new Error("GROQ_STERLING_API_KEY is missing in environment");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: BASE_RULES },
                { role: "user", content: brief }
            ],
            temperature: 0.9,
            max_tokens: 300,
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API Error: ${err}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content?.trim();

    if (!text) throw new Error("Groq returned an empty script");
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

/**
 * OpenAI TTS — fable voice (British accent), MP3 output.
 * Uses the existing OPENAI_API_KEY (same key as DALL-E 3).
 * Swap for Amazon Polly (en-GB Neural2) once AWS account is accessible.
 */
async function generateOpenAISpeech(text: string): Promise<Buffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set — cannot generate audio');

    // Strip SSML tags (OpenAI TTS doesn't support SSML — plain text only)
    const plainText = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'tts-1',       // tts-1-hd for higher quality if needed
            voice: 'fable',       // British-accented narrator
            input: plainText,
            response_format: 'mp3',
            speed: 0.95,          // Slightly slower — clearer for learning content
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI TTS API Error [${res.status}]: ${err}`);
    }

    return Buffer.from(await res.arrayBuffer());
}

function sseMsg(data: object): Uint8Array {
    return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /api/admin/courses/generate-audio
// Body: { courseId: string, force?: boolean }
// Generates one audio overview per MODULE (topic), not per lesson.
// Uses Llama-3.3-70b-versatile via Groq to write the script, ElevenLabs to speak it.
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

                // Fetch all topics with their lessons (including content for script generation)
                const { data: topics, error } = await supabase
                    .from("course_topics")
                    .select(`
                        id, title, audio_url,
                        course_lessons(id, title, order_index, content_markdown, content_blocks)
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
                        const brief = buildTopicBrief(topic, lessons, i);

                        // Step 1: Generate the script (text only — free, no quota used yet)
                        console.log(`[BulkAudio] Generating script for: ${topic.title}`);
                        const script = await generateScript(brief);
                        console.log(`[BulkAudio] Script (${script.length} chars):\n${script.substring(0, 200)}...`);

                        // Step 2: Convert script to speech via OpenAI TTS (fable — British accent).
                        // INTENTIONAL: Do NOT switch this to ElevenLabs.
                        // ElevenLabs is reserved for Sterling live voice + HeyGen avatar audio only.
                        // OpenAI TTS handles all bulk narration — ~$0.004 per module recap.
                        // Swap for Amazon Polly (en-GB Neural) once AWS account is accessible.
                        console.log(`[BulkAudio] Converting to speech with OpenAI TTS (fable)...`);
                        const audioBuffer = await generateOpenAISpeech(script);

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
                    errors: errors.length > 0 ? errors : undefined,
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
