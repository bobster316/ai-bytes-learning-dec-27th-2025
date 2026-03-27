
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { magicHourClient } from '../lib/magichour/client';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkTable(tableName: string, colName: string) {
    console.log(`\n🔍 Checking ${tableName}.${colName} for pending jobs...`);
    const { data: rows, error } = await supabase
        .from(tableName)
        .select(`id, ${colName}`)
        .ilike(colName, 'JOB_PENDING:%');

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log("No pending jobs.");
        return;
    }

    console.log(`Found ${rows.length} pending jobs.`);

    for (const row of rows) {
        const val = row[colName] as string;
        const jobId = val.split('JOB_PENDING:')[1];
        console.log(`ID: ${row.id} | Job: ${jobId}`);

        try {
            const status = await magicHourClient.getVideoStatus(jobId);
            console.log(`   > Status: ${status.status}`);

            const downloadUrl = (status as any).download?.url || (status as any).download_url;

            if (status.status === 'completed' && downloadUrl) {
                console.log(`   ✅ Completed! URL: ${downloadUrl}`);
                await supabase.from(tableName)
                    .update({ [colName]: downloadUrl })
                    .eq('id', row.id);
            } else if (status.status === 'failed') {
                console.log(`   ❌ Failed.`);
                await supabase.from(tableName)
                    .update({ [colName]: null })
                    .eq('id', row.id);
            }
        } catch (e) {
            console.error(`   ⚠️ Check Failed: ${(e as any).message}`);
        }
    }
}

async function pollAll() {
    await checkTable('courses', 'intro_video_url');
    await checkTable('course_topics', 'video_url');
    await checkTable('course_lessons', 'video_url');
}

pollAll();
