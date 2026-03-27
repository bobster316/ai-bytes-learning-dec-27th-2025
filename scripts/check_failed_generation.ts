
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFailedGeneration() {
    let output = '🔍 Checking Recent Course Generations...\n\n';

    const { data: recentGenerations, error } = await supabase
        .from('course_generation_progress')
        .select(`
            id,
            course_id,
            status,
            current_step,
            error_message,
            created_at,
            updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        output += `❌ Error fetching generations: ${JSON.stringify(error)}\n`;
        fs.writeFileSync('generation_check.log', output);
        return;
    }

    if (!recentGenerations || recentGenerations.length === 0) {
        output += 'No generation records found.\n';
        fs.writeFileSync('generation_check.log', output);
        return;
    }

    for (const gen of recentGenerations) {
        // Fetch course details - wait for promise here properly
        let courseTitle = 'Unknown (Deleted?)';
        try {
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('title')
                .eq('id', gen.course_id)
                .single();

            if (course) {
                courseTitle = course.title;
            }
        } catch (e) {
            // ignore
        }

        output += `Timestamp: ${new Date(gen.created_at).toLocaleString()}\n`;
        output += `Course ID: ${gen.course_id}\n`;
        output += `Course Title: ${courseTitle}\n`;
        output += `Status: ${gen.status.toUpperCase()}\n`;
        output += `Step: ${gen.current_step}\n`;
        if (gen.error_message) {
            output += `❌ Error: ${gen.error_message}\n`;
        }
        output += '-----------------------------------\n';
    }

    fs.writeFileSync('generation_check.log', output);
    console.log('Log written to generation_check.log');
}

checkFailedGeneration().catch(console.error);
