
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    console.log('Testing insert into "courses" table...');

    const { data, error } = await supabase
        .from('courses')
        .insert({
            title: 'Schema Test Course',
            description: 'Testing which columns exist',
            published: false
        })
        .select()
        .single();

    if (error) {
        console.error('Insert without difficulty failed:', error);
    } else {
        console.log('Insert WITHOUT difficulty SUCCESSFUL:', data);
        // Now try with difficulty
        const { data: d2, error: e2 } = await supabase
            .from('courses')
            .insert({
                title: 'Schema Test Course 2',
                difficulty: 'Beginner',
                description: 'Testing if difficulty exists',
                published: false
            })
            .select()
            .single();

        if (e2) {
            console.error('Insert WITH difficulty failed:', e2);
            // Try with difficulty_level
            const { data: d3, error: e3 } = await supabase
                .from('courses')
                .insert({
                    title: 'Schema Test Course 3',
                    difficulty_level: 'Beginner',
                    description: 'Testing if difficulty_level exists',
                    published: false
                })
                .select()
                .single();
            if (e3) {
                console.error('Insert WITH difficulty_level failed:', e3);
            } else {
                console.log('Insert WITH difficulty_level SUCCESSFUL:', d3);
            }
        } else {
            console.log('Insert WITH difficulty SUCCESSFUL:', d2);
        }
    }
}

testInsert();
