
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function renovate() {
    console.log('--- STARTING DNA RENOVATION ---');

    const { data: courses } = await supabase.from('courses').select('*').limit(100);

    for (const course of courses) {
        let newTitle = course.title;
        let newDesc = course.description;
        let newCat = course.category;

        // 1. Remove "Master" or "Mastery"
        newTitle = newTitle.replace(/Mastery/g, 'Progress').replace(/Mastering/g, 'Understanding').replace(/Master/g, 'Learn');
        newDesc = newDesc.replace(/Mastery/g, 'Progress').replace(/Mastering/g, 'Understanding').replace(/Master/g, 'Learn');

        // 2. Assign Category if null or incorrect
        if (!newCat || newCat === 'AI & Machine Learning') {
            if (newTitle.toLowerCase().includes('prompt')) newCat = 'Prompt Engineering';
            else if (newTitle.toLowerCase().includes('business') || newTitle.toLowerCase().includes('strategy')) newCat = 'AI for Business & Strategy';
            else if (newTitle.toLowerCase().includes('machine learning') || newTitle.toLowerCase().includes('training')) newCat = 'Data & AI Fundamentals';
            else newCat = 'AI Foundations & Fundamentals';
        }

        // 3. Humanize Description if it's too robotic
        if (newDesc.includes('comprehensive beginner course')) {
            newDesc = newDesc.replace('A comprehensive beginner course on', 'A simple, byte-sized guide to');
        }

        if (newTitle !== course.title || newDesc !== course.description || newCat !== course.category) {
            console.log(`Updating [${course.id}]: ${course.title} -> ${newTitle}`);
            await supabase.from('courses').update({
                title: newTitle,
                description: newDesc,
                category: newCat
            }).eq('id', course.id);
        }
    }

    console.log('--- RENOVATION COMPLETE ---');
}

renovate();
