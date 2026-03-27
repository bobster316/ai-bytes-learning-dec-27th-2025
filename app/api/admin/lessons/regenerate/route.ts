import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pcmToWav } from "@/lib/utils/audio-utils";
import { veoVideoService } from "@/lib/ai/veo-video-service";
import { NextResponse } from "next/server";

// --- Constants (Shared with generate-v2) ---
const AUDIO_OVERVIEW_PROMPT = `Generate a high-velocity, high-impact audio overview of this lesson. 
Focus on explaining concepts through everyday metaphors. Use a friendly, expert-yet-approachable tone.
Both speakers MUST speak with a clear, professional, and natural British English accent. Avoid any Americanized inflections.

CRITICAL CONSTRAINTS:
1. TERMINOLOGY: Always refer to the content as a "lesson" or "deep dive". NEVER use the word "module".
2. OPENING: NEVER start with "Alright", "Okay", or "So". 
3. HOOK: Host A MUST start with a unique, compelling hook tailored to the specific lesson content below. 
4. VARIETY: Use conversational transitions like "Picture this:", "The cool thing about this is...", or "Let's dive into the heart of...".

Keep it under 3 minutes of speaking time.`;

const VIDEO_OVERVIEW_PROMPT = `Produce a cinematic, abstract visual overview that represents the core concepts of:`;

// --- Helper (Shared with generate-v2) ---
function prepareLessonBrief(content: any) {
    if (!content) return "No content provided.";

    let textSummary = "";
    if (content.blocks) {
        textSummary = content.blocks
            .filter((b: any) => b.type === 'text' || b.type === 'objective')
            .map((b: any) => b.heading ? `${b.heading}: ${b.paragraphs?.join(' ')}` : b.paragraphs?.join(' '))
            .join('\n\n');
    } else {
        textSummary = content.topicContent || JSON.stringify(content);
    }

    return textSummary.slice(0, 3000); // Token safety
}

export async function POST(req: Request) {
    try {
        const { lessonId, type } = await req.json();
        if (!lessonId || !type) return NextResponse.json({ error: "Missing lessonId or type" }, { status: 400 });

        const supabase = await createClient();

        // 1. Fetch Lesson Data
        const { data: lesson, error: fetchErr } = await supabase
            .from('course_lessons')
            .select(`
                *,
                topic:course_topics(course_id)
            `)
            .eq('id', lessonId)
            .single();

        if (fetchErr || !lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

        const courseId = lesson.topic?.course_id;
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

        // 2. Regenerate logic
        if (type === 'audio') {
            const lessonBrief = prepareLessonBrief({ blocks: lesson.content_blocks });
            const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

            const audioResult = await (audioModel as any).generateContent({
                contents: [{ role: 'user', parts: [{ text: `${AUDIO_OVERVIEW_PROMPT}\n\nLESSON BRIEF:\n${lessonBrief}` }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: [
                                { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sadaltager" } }, speaker: "Host A" },
                                { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }, speaker: "Host B" }
                            ]
                        }
                    }
                } as any
            });

            const audioResponse = await audioResult.response;
            const audioPart = audioResponse.candidates[0].content.parts.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/'));

            if (audioPart?.inlineData?.data) {
                const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
                const audioBuffer = pcmToWav(pcmBuffer);
                const fileName = `lessons/${courseId}/${lessonId}/overview.wav`;

                const { error: uploadErr } = await supabase.storage
                    .from('course-assets')
                    .upload(fileName, audioBuffer, { contentType: 'audio/wav', upsert: true });

                if (uploadErr) throw uploadErr;

                const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(fileName);

                await supabase.from('course_lessons').update({ audio_url: publicUrl }).eq('id', lessonId);
                return NextResponse.json({ success: true, url: publicUrl });
            }
        } else if (type === 'video') {
            const videoPrompt = `${VIDEO_OVERVIEW_PROMPT} ${lesson.title}.`;
            const veoResult = await veoVideoService.generateVideo(videoPrompt, `Regen: ${lesson.title}`);

            if (veoResult) {
                await supabase.from('course_lessons').update({
                    video_url: veoResult.url,
                    video_overview_url: veoResult.url
                }).eq('id', lessonId);
                return NextResponse.json({ success: true, url: veoResult.url });
            }
        } else if (type === 'video_block') {
            // Re-trigger Veo for video_snippet blocks that have a videoPrompt but no videoUrl
            const blocks: any[] = Array.isArray(lesson.content_blocks) ? lesson.content_blocks : [];
            const pendingBlocks = blocks.filter((b: any) => b.type === 'video_snippet' && b.videoPrompt && !b.videoUrl);

            if (pendingBlocks.length === 0) {
                return NextResponse.json({ error: "No pending video_snippet blocks found (all may already have URLs)" }, { status: 400 });
            }

            let generated = 0;
            for (const block of pendingBlocks) {
                const veoResult = await veoVideoService.generateVideo(block.videoPrompt, block.caption || lesson.title);
                if (veoResult?.url) {
                    block.videoUrl = veoResult.url;
                    generated++;
                }
            }

            if (generated > 0) {
                await supabase.from('course_lessons').update({ content_blocks: blocks }).eq('id', lessonId);
                return NextResponse.json({ success: true, generated, total: pendingBlocks.length });
            }
        }

        return NextResponse.json({ error: "Generation failed" }, { status: 500 });

    } catch (e: any) {
        console.error("[Regenerate-API] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
