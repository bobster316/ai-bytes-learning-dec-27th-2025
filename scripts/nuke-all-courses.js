const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function nukeAll() {
    console.log("🚀 Starting Global Nuke of All Courses...");

    // 1. Fetch ALL IDs
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id');

    if (error) {
        console.error("Failed to list courses:", error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("✅ No courses found to delete.");
        return;
    }

    const allIds = courses.map(c => c.id);
    console.log(`Found ${allIds.length} courses to delete.`);

    // 2. Process in chunks calling the local API
    // We use the API to ensure 'revalidatePath' is triggered and cascading logic runs
    const BATCH_SIZE = 5; // Conservative batch size
    const API_URL = 'http://localhost:3000/api/course/bulk-delete';

    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const batch = allIds.slice(i, i + BATCH_SIZE);
        console.log(`💥 Deleting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)...`);

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: batch })
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(`❌ Batch failed: ${res.status} - ${txt}`);
            } else {
                const json = await res.json();
                console.log(`✅ Batch complete. Deleted: ${json.count}`);
            }
        } catch (e) {
            console.error("❌ Network/Fetch Error:", e.message);
        }
    }

    console.log("🏁 Global Nuke Complete.");
}

nukeAll();
