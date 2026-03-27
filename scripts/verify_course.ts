import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    const { data: course } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            description,
            course_topics (
                id,
                title,
                course_lessons (
                    id,
                    title
                )
            )
        `)
        .eq('title', 'AI Model Training Essentials')
        .single();

    if (course) {
        console.log('✅ Course found:', course.title);
        console.log(`   ID: ${course.id}`);
        console.log(`   Topics: ${course.course_topics?.length || 0}`);

        course.course_topics?.forEach((topic: any, i: number) => {
            console.log(`\n   Topic ${i + 1}: ${topic.title}`);
            console.log(`   Lessons: ${topic.course_lessons?.length || 0}`);
            topic.course_lessons?.forEach((lesson: any, j: number) => {
                console.log(`     ${j + 1}. ${lesson.title}`);
            });
        });
    } else {
        console.log('❌ Course not found');
    }
}

verify();
