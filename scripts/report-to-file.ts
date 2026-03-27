
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';
import * as fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function writeReport() {
    const courseId = 653;
    let report = `Course 653 Video Jobs:\n`;

    const { data: intro } = await supabase.from('courses').select('intro_video_job_id').eq('id', courseId).single();
    report += `Intro: ${intro?.intro_video_job_id}\n`;

    const { data: topics } = await supabase.from('course_topics').select('id, video_job_id').eq('course_id', courseId);
    topics?.forEach((t, i) => report += `Module ${i + 1}: ${t.video_job_id}\n`);

    const topicIds = topics?.map(t => t.id) || [];
    const { data: lessons } = await supabase.from('course_lessons').select('id, video_job_id').in('topic_id', topicIds);
    lessons?.forEach((l, i) => report += `Lesson ${i + 1}: ${l.video_job_id}\n`);

    fs.writeFileSync('b653_report.txt', report);
    console.log('Report written to b653_report.txt');
}

writeReport();
