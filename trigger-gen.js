
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function generateCourse() {
    console.log("Triggering generation...");
    try {
        const response = await fetch('http://localhost:3000/api/admin/generate/full', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: "Advanced Computer Vision",
                difficulty: "intermediate",
                description: "A comprehensive guide to modern computer vision techniques."
            })
        });

        const data = await response.json();
        console.log("Generation complete:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

generateCourse();
