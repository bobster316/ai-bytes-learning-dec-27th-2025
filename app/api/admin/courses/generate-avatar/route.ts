import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { videoGenerationService } from '@/lib/services/video-generation';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * POST /api/admin/courses/generate-avatar
 * Body: { courseId: string, avatar?: 'sarah' | 'gemma' }
 *
 * Generates a new intro script for an existing course and queues a HeyGen avatar video.
 * Use this to add avatar videos to courses that were generated when ENABLE_HEYGEN_AVATAR=false.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient(true);

    const { courseId, avatar = 'sarah' } = await req.json();
    if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    if (process.env.ENABLE_HEYGEN_AVATAR !== 'true') {
        return NextResponse.json({ error: 'ENABLE_HEYGEN_AVATAR is not enabled — set it to true in .env.local' }, { status: 503 });
    }

    // 1. Fetch course details
    const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, title, description, difficulty_level, intro_video_url, intro_video_status')
        .eq('id', courseId)
        .single();

    if (courseErr || !course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 2. Generate intro script via Gemini
    let script: string;
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const prompt = `Write a warm, engaging 45-second video intro script (approximately 110 words) for an AI micro-learning course called "${course.title}".

The script should:
- Open with a curiosity hook about the topic
- Briefly say what learners will be able to do after the course
- End with an invitation to start the first lesson
- Sound natural when spoken aloud
- Match difficulty level: ${course.difficulty_level || 'beginner'}

Return ONLY the script text, no stage directions, no speaker labels, no formatting.`;

            const result = await model.generateContent(prompt);
            script = result.response.text().trim();
        } catch (e) {
            console.error('[GenerateAvatar] Gemini script generation failed:', e);
            // Simple fallback script
            script = `Welcome to ${course.title}. In this course, you'll build real understanding of one of the most important topics in AI today. By the end, you'll have the knowledge and confidence to apply what you've learned in practical situations. Whether you're completely new or looking to deepen your expertise, this course meets you where you are. Let's get started — your first lesson is waiting.`;
        }
    } else {
        script = `Welcome to ${course.title}. In this course, you'll build real understanding of one of the most important topics in AI today. By the end, you'll have the knowledge and confidence to apply what you've learned in practical situations. Let's get started — your first lesson is waiting.`;
    }

    console.log(`[GenerateAvatar] Script for "${course.title}" (${script.length} chars): ${script.substring(0, 100)}...`);

    // 3. Queue HeyGen video
    try {
        const videoResults = await videoGenerationService.triggerCourseVideoBatch(
            courseId,
            course.title,
            [{
                type: 'course_introduction',
                entityId: courseId,
                script,
                avatar: avatar as 'sarah' | 'gemma',
            }],
            { useHeyGen: true, checkQuota: false }
        );

        const jobId = videoResults[courseId];
        if (!jobId) {
            return NextResponse.json({ error: 'HeyGen did not return a job ID' }, { status: 502 });
        }

        // 4. Save job ID to DB
        await supabase.from('courses').update({
            intro_video_job_id: jobId,
            intro_video_status: 'queued',
        }).eq('id', courseId);

        console.log(`[GenerateAvatar] ✅ Queued HeyGen job ${jobId} for course ${courseId}`);
        return NextResponse.json({ ok: true, courseId, jobId, scriptPreview: script.substring(0, 80) });

    } catch (e: any) {
        console.error('[GenerateAvatar] HeyGen trigger failed:', e);
        return NextResponse.json({ error: e.message || 'HeyGen trigger failed' }, { status: 500 });
    }
}
