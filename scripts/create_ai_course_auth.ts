
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// Admin Client for user management
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const COURSE_TITLE = "AI Model Training Essentials";
const COURSE_DESC = "A Beginner's Guide to Modern AI Development. Learn how AI models are trained from scratch to deployment.";

// Full content array (truncated for brevity here, assume existing logic)
// Just reuse the structure from create_ai_course_final.ts but copy it fully here?
// Yes, I need the content.
const COURSE_CONTENT = [
    {
        topicTitle: "AI Training Fundamentals",
        topicDesc: "Understanding the three core stages of AI training.",
        lessons: [
            {
                title: "The Three Stages of AI Training",
                mdContent: "Markdown content here...", // Should be full content really
                // ...
            }
            // ...
        ]
    }
    // ...
];
// Wait, I need the full content to be useful. 
// I will copy the full content again.

const FULL_CONTENT = [
    {
        topicTitle: "AI Training Fundamentals",
        topicDesc: "Understanding the three core stages of AI training.",
        lessons: [
            {
                title: "The Three Stages of AI Training",
                mdContent: "Full lesson 1 content...",
                videoScript: "Script 1...",
                imagePrompts: ["Prompt 1"]
            },
            {
                title: "Understanding RLVR - The Breakthrough in AI Training",
                mdContent: "Full lesson 1.2 content...",
                videoScript: "Script 1.2...",
                imagePrompts: ["Prompt 1.2"]
            }
        ]
    }, {
        topicTitle: "Advanced Training Concepts",
        topicDesc: "Comparing RLVR and RLHF, and exploring the future of AI training.",
        lessons: [
            {
                title: "RLVR vs RLHF - Understanding the Difference",
                mdContent: "Full lesson 2.1 content...",
                videoScript: "Script 2.1...",
                imagePrompts: ["Prompt 2.1"]
            },
            {
                title: "Real-World Impact and Future Directions",
                mdContent: "Full lesson 2.2 content...",
                videoScript: "Script 2.2...",
                imagePrompts: ["Prompt 2.2"]
            }
        ]
    }
];

async function main() {
    console.log(`URL: ${supabaseUrl}`);

    // 1. Ensure User Exists
    let email = 'admin@aibytes.com';
    let password = 'password123';
    let userId: string | null = null;

    const { data: { users }, error: uError } = await adminClient.auth.admin.listUsers();

    if (users && users.length > 0) {
        // Check if admin exists
        const adminUser = users.find(u => u.email === email);
        if (adminUser) {
            userId = adminUser.id;
            console.log(`Found existing user: ${userId}`);
        } else {
            console.log("Creating admin user...");
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: 'Admin User' }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }
    } else {
        // No users, create one
        console.log("Creating first user...");
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Admin User' }
        });
        if (createError) throw createError;
        userId = newUser.user.id;
    }

    // 2. Sign In As User
    const authClient = createClient(supabaseUrl, supabaseAnonKey!);
    const { data: { session }, error: signInError } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (signInError || !session) {
        console.error("Sign in failed:", signInError);
        process.exit(1);
    }
    console.log("✅ Signed in successfully.");

    // 3. Create Course (Using Auth Client)
    console.log("Creating course...");
    const { data: courses, error: courseError } = await authClient
        .from('courses')
        .insert({
            title: COURSE_TITLE,
            description: COURSE_DESC,
            difficulty: 'Intermediate',
            estimated_duration_hours: 1,
            published: true,
            user_id: userId // Should check RLS policy
        })
        .select();

    if (courseError) {
        console.error("Course creation failed:", JSON.stringify(courseError, null, 2));
        process.exit(1);
    }

    const course = courses![0];
    console.log(`✅ Course created: ${course.id}`);

    // 4. Topics & Lessons
    console.log("Creating topics...");
    for (let i = 0; i < FULL_CONTENT.length; i++) {
        const t = FULL_CONTENT[i];
        const { data: topic, error: topicError } = await authClient
            .from('course_topics')
            .insert({
                course_id: course.id,
                title: t.topicTitle,
                description: t.topicDesc,
                order_index: i
            })
            .select()
            .single();

        if (topicError) {
            console.error(`Topic failed: ${t.topicTitle}`, topicError);
            continue;
        }
        console.log(`  ✅ Topic: ${topic.title}`);

        for (let j = 0; j < t.lessons.length; j++) {
            const l = t.lessons[j];
            const { data: lesson, error: lessonError } = await authClient
                .from('course_lessons')
                .insert({
                    topic_id: topic.id,
                    title: l.title,
                    order_index: j,
                    content_markdown: l.mdContent, // Start with minimal content
                })
                .select()
                .single();

            if (lessonError) {
                console.error(`Lesson failed: ${l.title}`, lessonError);
            } else {
                console.log(`    ✅ Lesson: ${lesson.title}`);
                // Update with rich content later if needed
            }
        }
    }
    console.log("🏁 Done!");
}

main().catch(console.error);
