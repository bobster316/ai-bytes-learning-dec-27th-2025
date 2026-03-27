
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { QualityAssuranceService } from '@/lib/services/quality-assurance';

dotenv.config({ path: '.env.local' });

async function run() {
    console.log('🔍 Initializing QA Manual Run...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get latest course
    const { data: course, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !course) {
        console.error('❌ No course found or error:', error);
        return;
    }

    console.log(`🎯 Targeting Course: "${course.title}" (${course.id})`);

    // Get lessons via topics
    const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', course.id);
    const topicIds = topics?.map(t => t.id) || [];

    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title')
        .in('topic_id', topicIds);

    if (!lessons || lessons.length === 0) {
        console.log('⚠️ No lessons found.');
        return;
    }

    console.log(`📚 Found ${lessons.length} lessons. Starting QA service...`);

    const qaService = new QualityAssuranceService();
    await qaService.initialize();

    for (const [i, lesson] of lessons.entries()) {
        console.log(`[${i + 1}/${lessons.length}] Checking lesson: ${lesson.title}`);
        try {
            await qaService.runQualityChecks(lesson.id);
        } catch (e) {
            console.error(`Error checking lesson ${lesson.id}:`, e);
        }
    }

    console.log('✅ QA Run Complete!');
}

run().catch(console.error);
