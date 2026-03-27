import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const COURSE_TITLE = "AI Model Training Essentials";
const COURSE_DESC = "A Beginner's Guide to Modern AI Development. Learn how AI models are trained from scratch to deployment.";

const COURSE_CONTENT = [
    {
        topicTitle: "AI Training Fundamentals",
        topicDesc: "Understanding the three core stages of AI training.",
        lessons: [
            {
                title: "The Three Stages of AI Training",
                mdContent: `# The Three Stages of AI Training

Welcome to AI Training Essentials! This course will teach you how modern AI systems are trained.

## The Three-Stage Journey

AI model training happens in three major stages:

**Stage 1: Pre-Training** - Like general education. The AI reads enormous amounts of text from across the internet, learning fundamental patterns of language and absorbing factual knowledge.

**Stage 2: Mid-Training** - Like specializing in college. The AI gets focused training in specific domains like mathematics, coding, or scientific reasoning.

**Stage 3: Post-Training** - Like professional development. The AI learns to be genuinely helpful to users through techniques like RLHF and RLVR.

Each stage builds on the previous one to create a capable AI assistant.`,
            },
            {
                title: "Understanding RLVR",
                mdContent: `# Understanding RLVR - The Breakthrough in AI Training

RLVR (Reinforcement Learning with Verifiable Rewards) is one of the most exciting breakthroughs in AI development.

## What is RLVR?

RLVR trains AI models using problems where we can automatically verify if the answer is correct. Think math problems, coding challenges, or logic puzzles.

This was revolutionary because it meant researchers could:
- Generate millions of training examples automatically
- Give instant feedback to the model
- Scale up training massively without human bottlenecks
- Train models to tackle increasingly difficult problems

Models like OpenAI's o1 and DeepSeek R1 were trained using RLVR.`,
            }
        ]
    },
    {
        topicTitle: "Advanced Training Concepts",
        topicDesc: "Comparing RLVR and RLHF, and exploring the future of AI training.",
        lessons: [
            {
                title: "RLVR vs RLHF",
                mdContent: `# RLVR vs RLHF - Understanding the Difference

Today, the best AI systems use both RLVR and RLHF.

## Key Differences

**RLVR** optimizes for correctness - did the model get the right answer? It uses objective signals and scales massively.

**RLHF** optimizes for preference - did humans find this response helpful? It uses subjective signals and requires human review.

Think of it this way: RLVR makes the model smart. RLHF makes the model pleasant to use.

The best AI systems use RLVR to develop problem-solving capabilities and RLHF to develop communication skills.`,
            },
            {
                title: "Real-World Impact",
                mdContent: `# Real-World Impact and Future Directions

The training techniques you've learned about are powering AI tools you might already be using.

## Applications

**Coding Assistants** - Tools like GitHub Copilot help developers write code using RLVR-trained models.

**Mathematics Education** - AI tutors can solve and explain complex math problems step-by-step.

**Research Assistance** - Scientists use AI for literature review and hypothesis generation.

**Business Analytics** - Companies use AI for data interpretation and strategic planning.

Thank you for taking this course!`,
            }
        ]
    }
];

async function seedCourse() {
    console.log(`🌱 Seeding Course: "${COURSE_TITLE}"...`);

    // Create Course using actual schema
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: COURSE_TITLE,
            description: COURSE_DESC,
            difficulty_level: 'beginner',
            duration: 60, // minutes
            published: true,
            is_published: true,
            status: 'published',
            category: 'AI & Machine Learning',
            categories: ['AI', 'Machine Learning', 'Training'],
            passing_score: 70,
            certificate_enabled: true,
            price: 0
        })
        .select();

    if (courseError) {
        console.error("Course creation failed:", JSON.stringify(courseError, null, 2));
        process.exit(1);
    }

    if (!courses || courses.length === 0) {
        console.error("Course created but no data returned.");
        process.exit(1);
    }

    const course = courses[0];
    console.log(`✅ Course created: ${course.id}`);

    // Create Topics
    for (let i = 0; i < COURSE_CONTENT.length; i++) {
        const t = COURSE_CONTENT[i];

        const { data: topic, error: topicError } = await supabase
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
            console.error(`Topic creation failed for ${t.topicTitle}:`, topicError);
            continue;
        }
        console.log(`  ✅ Topic created: ${topic.title}`);

        // Create Lessons
        for (let j = 0; j < t.lessons.length; j++) {
            const l = t.lessons[j];

            const { data: lesson, error: lessonError } = await supabase
                .from('course_lessons')
                .insert({
                    topic_id: topic.id,
                    title: l.title,
                    order_index: j,
                    content_markdown: l.mdContent,
                    estimated_duration_minutes: 15
                })
                .select()
                .single();

            if (lessonError) {
                console.error(`Lesson creation failed for ${l.title}:`, lessonError);
            } else {
                console.log(`    ✅ Lesson created: ${lesson.title}`);
            }
        }
    }

    console.log("🏁 Seeding Complete!");
    console.log(`\n📚 Course "${COURSE_TITLE}" has been created with ${COURSE_CONTENT.length} topics.`);
}

seedCourse().catch(console.error);
