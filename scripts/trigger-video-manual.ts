
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function triggerAllVideos(courseId: number) {
    console.log(`🚀 Starting Global Manual Trigger for Course ${courseId}`);

    // 1. Course Intro
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
    if (course) {
        console.log(`\n🎙️  Course Intro: ${course.title}`);
        const script = `Welcome to the ${course.title}. I am Sarah, your AI guide.`;
        const audio = await elevenLabsService.generateSpeech(script, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl } = await audioStorageService.uploadAudio(audio, `c-${courseId}-intro.mp3`);
        const { jobId } = await heyGenService.generateVideo({ audioUrl: publicUrl, avatarType: 'sarah', title: 'Course Intro', test: false });
        await supabase.from('courses').update({ intro_video_job_id: jobId, intro_video_status: 'processing' }).eq('id', courseId);
        console.log(`✅ Job: ${jobId}`);
    }

    // 2. Module Intros (course_topics)
    const { data: topics } = await supabase.from('course_topics').select('*').eq('course_id', courseId);
    console.log(`\n🔍 Found ${topics?.length || 0} Modules (course_topics)`);
    for (const t of topics || []) {
        console.log(`🎙️  Module: ${t.title}`);
        const script = `In this module, we'll explore ${t.title}.`;
        const audio = await elevenLabsService.generateSpeech(script, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl } = await audioStorageService.uploadAudio(audio, `t-${t.id}-intro.mp3`);
        const { jobId } = await heyGenService.generateVideo({ audioUrl: publicUrl, avatarType: 'sarah', title: `Module: ${t.title}`, test: false });
        await supabase.from('course_topics').update({ video_job_id: jobId, video_status: 'processing' }).eq('id', t.id);
        console.log(`✅ Job: ${jobId}`);
    }

    // 3. Lesson Intros (course_lessons)
    const topicIds = topics?.map(t => t.id) || [];
    const { data: lessons } = await supabase.from('course_lessons').select('*').in('topic_id', topicIds);
    console.log(`\n🔍 Found ${lessons?.length || 0} Lessons (course_lessons)`);
    for (const l of lessons || []) {
        console.log(`🎙️  Lesson: ${l.title}`);
        const script = `Let's dive into our lesson: ${l.title}.`;
        const audio = await elevenLabsService.generateSpeech(script, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl } = await audioStorageService.uploadAudio(audio, `l-${l.id}-intro.mp3`);
        const { jobId } = await heyGenService.generateVideo({ audioUrl: publicUrl, avatarType: 'sarah', title: `Lesson: ${l.title}`, test: false });
        await supabase.from('course_lessons').update({ video_job_id: jobId, video_status: 'processing' }).eq('id', l.id);
        console.log(`✅ Job: ${jobId}`);
    }

    console.log('\n🌟 All jobs triggered successfully.');
}

triggerAllVideos(653);
