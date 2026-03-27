
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMockCertificate() {
    console.log("Starting mock certificate creation...");
    const certId = uuidv4();
    const mockCert = {
        id: certId,
        user_id: '00000000-0000-0000-0000-000000000000', // Default fallback
        course_id: '',
        certificate_number: 'CERT-' + Math.floor(Math.random() * 1000000),
        issue_date: new Date().toISOString(),
        completion_date: new Date().toISOString(),
        final_score: 95,
        metadata: {
            studentName: "John Doe",
            courseTitle: "AI Mastery 101",
            score: 95
        }
    };

    // 1. Get a valid Course ID
    const { data: courses, error: courseError } = await supabase.from('courses').select('id, title').limit(1);
    if (courses && courses.length > 0) {
        mockCert.course_id = courses[0].id;
        mockCert.metadata.courseTitle = courses[0].title;
        console.log(`Found Course: ${courses[0].title}`);
    } else {
        console.error("No courses found! Cannot create certificate without course_id.");
        return;
    }

    // 2. Get a valid User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (users && users.length > 0) {
        mockCert.user_id = users[0].id;
        console.log(`Found User: ${users[0].email} (${users[0].id})`);
    } else {
        console.log("No users found. Trying to proceed with placeholder UUID, but this will likely fail if FK exists.");
    }

    // 3. Insert Certificate
    const { data, error } = await supabase.from('certificates').insert([mockCert]).select();

    if (error) {
        console.error("Error creating mock certificate:", error);
    } else {
        console.log("\nSUCCESS! Mock Certificate Created.");
        console.log(`Certificate ID: ${data[0].id}`);
        console.log(`URL: http://localhost:3000/certificate/${data[0].id}`);
    }
}

createMockCertificate();
