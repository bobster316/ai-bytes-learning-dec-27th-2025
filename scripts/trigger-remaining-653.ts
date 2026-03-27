
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function triggerRemaining(courseId: number) {
    console.log(`🚀 Triggering Modules & Lessons for Course ${courseId}`);

    // 1. Modules (course_topics)
    const { data: topics } = await supabase.from('course_topics').select('*').eq('course_id', courseId);
    console.log(`\n🔍 Found ${topics?.length || 0} Modules`);

    for (const t of topics || []) {
        console.log(`🎙️  Module: ${t.title}`);
        const script = `This module is titled ${t.title}. Let's get started.`;
        const audio = await elevenLabsService.generateSpeech(script, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl } = await audioStorageService.uploadAudio(audio, `t-${t.id}-intro.mp3`);
        const { jobId } = await heyGenService.generateVideo({ audioUrl: publicUrl, avatarType: 'sarah', title: `Topic: ${t.title}`, test: false });
        await supabase.from('course_topics').update({ video_job_id: jobId, video_status: 'processing' }).eq('id', t.id);
        console.log(`✅ Job: ${jobId}`);

        // 2. Lessons (course_lessons) for this topic
        const { data: lessons } = await supabase.from('course_lessons').select('*').eq('topic_id', t.id);
        console.log(`   - Found ${lessons?.length || 0} Lessons`);
        for (const l of lessons || []) {
            console.log(`   🎙️  Lesson: ${l.title}`);
            const lScript = `Welcome to the lesson: ${l.title}.`;
            const lAudio = await elevenLabsService.generateSpeech(lScript, '0sGQQaD2G2X1s87kHM5b');
            const { publicUrl: lUrl } = await audioStorageService.uploadAudio(lAudio, `l-${l.id}-intro.mp3`);
            const { jobId: lJob } = await heyGenService.generateVideo({ audioUrl: lUrl, avatarType: 'sarah', title: `Lesson: ${l.title}`, test: false });
            await supabase.from('course_lessons').update({ video_job_id: lJob, video_status: 'processing' }).eq('id', l.id);
            console.log(`   ✅ Job: ${lJob}`);
        }
    }

    console.log('\n🌟 All Remaining Jobs Triggered.');
}

triggerRemaining(653);
