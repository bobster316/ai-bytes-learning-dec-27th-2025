import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('Fetching existing courses...');
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (courses && courses.length > 0) {
        console.log('Sample course structure:');
        console.log(JSON.stringify(courses[0], null, 2));
        console.log('\nColumn names:', Object.keys(courses[0]));
    } else {
        console.log('No courses found. Checking course_topics...');
        const { data: topics, error: topicError } = await supabase
            .from('course_topics')
            .select('*')
            .limit(1);

        if (topicError) {
            console.error('Topics error:', topicError);
        } else if (topics && topics.length > 0) {
            console.log('Sample topic:', JSON.stringify(topics[0], null, 2));
        } else {
            console.log('No topics found either.');
        }
    }
}

inspect();
