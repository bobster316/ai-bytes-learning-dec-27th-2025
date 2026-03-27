
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { generateLessonHTML } from '../lib/utils/lesson-renderer-v2';
import { imageService } from '../lib/ai/image-service';
import { VideoScript, CompleteCourse, CompletedLesson } from '../lib/types/course-upgrade';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- CONTENT DEFINITIONS ---

const COURSE_TITLE = "AI Model Training Essentials";
const COURSE_DESC = "A Beginner's Guide to Modern AI Development. Learn how AI models are trained from scratch to deployment, including revolutionary techniques like RLVR.";

const TOPIC_1_TITLE = "AI Training Fundamentals";
const TOPIC_1_DESC = "Understanding the three core stages of AI training: Pre-training, Mid-training, and Post-training.";

const TOPIC_2_TITLE = "Advanced Training Concepts";
const TOPIC_2_DESC = "Deep dive into RLVR vs RLHF, real-world applications, and the future of AI training.";

// Helper to create video script object
const createVideoScript = (duration: number, hook: string, core: string, recap: string): VideoScript => ({
    hook: { duration: 5, script: hook, visualCues: [] },
    context: { duration: 5, script: "Context...", visualCues: [] },
    coreContent: {
        duration: duration - 15,
        segments: [{ title: "Core", duration: duration - 15, script: core, visualCues: [], codeSegments: [] }]
    },
    demonstration: { duration: 0, script: "", codeToShow: "", visualCues: [] },
    recap: { duration: 5, script: recap, keyPoints: [] },
    transition: { duration: 0, script: "" },
    totalDuration: duration,
    pronunciationGuide: {}
});

// --- FULL CONTENT STRUCTURE ---
// Note: I am truncating the full text for brevity in this scratchpad, but normally I would put the full text here.
// I will use the "content" field to store the Markdown provided by the user.

const lessonsData = [
    {
        topicIndex: 0, // Module 1
        title: "The Three Stages of AI Training",
        content: `
# LESSON 1.1: The Three Stages of AI Training

### Introduction: Welcome to AI Training

Welcome to AI Training Essentials! If you've ever used ChatGPT, Claude, or other AI assistants and wondered "How did this thing get so smart?"—you're in the right place. 

In this course, we're going to pull back the curtain on how modern AI systems are trained. Don't worry if you're new to this—we'll explain everything in plain language with plenty of examples. By the end of this short course, you'll understand the core concepts that power today's most impressive AI systems.

Think about your own education for a moment. You didn't become knowledgeable and skilled overnight. You went through elementary school, middle school, high school, maybe college, and then learned on the job. Each stage built on the previous one, developing different capabilities.

AI training works remarkably similarly. There are distinct stages, each with its own purpose, and each building toward creating a system that's not just knowledgeable, but actually useful.

### The Three-Stage Journey

AI model training happens in three major stages. Understanding these stages is crucial to understanding how modern AI works.

**Stage 1: Pre-Training** is like general education—elementary school through high school. This is where the AI reads enormous amounts of text from across the internet. We're talking about billions of words.

**Stage 2: Mid-Training** is like going to college. The AI gets specialized training in specific domains like math or coding.

**Stage 3: Post-Training** is like professional development. This is where the AI learns to be genuinely helpful to users, friendly, and safe.

### Stage 1: Pre-Training - Building the Foundation

Let's start at the beginning: pre-training. This is the most computationally expensive and time-consuming phase.

Imagine if you could read the entire internet. Not skim it—actually read and process billions of pages. That's essentially what happens. The AI learns to predict the next word. "The cat sat on the..." becomes "mat".

It learns:
* Language Structure
* Factual Knowledge
* Common Patterns
* Context Understanding

Training a model like GPT-4 costs over $100 million. But after this, the model isn't useful yet—it just knows a lot.

### Stage 2: Mid-Training - Developing Expertise

Mid-training is where we specialize. We use high-quality data:
* Math problems with steps
* Code with comments
* Scientific papers

This teaches the model *how* to think in specific domains.

### Stage 3: Post-Training - Becoming Useful

This is where the magic happens. We use:
* **RLHF (Reinforcement Learning with Human Feedback):** Humans rate responses to teach tone and safety.
* **RLVR (Reinforcement Learning with Verifiable Rewards):** We'll cover this next! It helps with reasoning.

### Bringing It All Together

Pre-training = Foundation (Months)
Mid-Training = Specialization (Weeks)
Post-Training = Polish (Days)

All three are essential.
`,
        imagePrompts: [
            "Animated icon transforming from simple shapes to a complex neural network, 3d render, high quality",
            "Three connected stepping stones labeled Pre-Training, Mid-Training, Post-Training, isometric 3d style",
            "Animation showing text flowing into a model from various sources books wikipedia news, digital art visualization",
            "Focused beams of light highlighting specific domains mathematical equations programming code, cinematic lighting",
            "Split screen showing a rough clay sculpture being refined into a polished statue, artistic metaphor"
        ],
        videoScript: `Welcome to AI Training Essentials! If you've ever used ChatGPT, Claude, or other AI assistants and wondered "How did this thing get so smart?"—you're in the right place. In this course, we're going to pull back the curtain on how modern AI systems are trained. Don't worry if you're new to this—we'll explain everything in plain language with plenty of examples. By the end of this short course, you'll understand the core concepts that power today's most impressive AI systems. Think about your own education for a moment. You didn't become knowledgeable and skilled overnight. You went through elementary school, middle school, high school, maybe college, and then learned on the job. Each stage built on the previous one, developing different capabilities. AI training works remarkably similarly. There are distinct stages, each with its own purpose, and each building toward creating a system that's not just knowledgeable, but actually useful. Let's dive in.`
    },
    // ... I will add other lessons ... 
    // For brevity I am implementing just the first one fully to test, but I should implement all 4. 
    // I'll add the others in the full implementation below.
];


async function seedCourse() {
    console.log(`🌱 Seeding Course: "${COURSE_TITLE}"...`);

    // 1. Create Course
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            title: COURSE_TITLE,
            description: COURSE_DESC,
            user_id: '00000000-0000-0000-0000-000000000000', // System user or similar
            difficulty_level: 'intermediate',
            target_duration: 45
        })
        .select()
        .single();

    if (courseError) throw courseError;
    console.log(`✅ Course created: ${course.id}`);

    // Define Topics
    const topicsData = [
        { title: TOPIC_1_TITLE, description: TOPIC_1_DESC },
        { title: TOPIC_2_TITLE, description: TOPIC_2_DESC }
    ];

    for (let i = 0; i < topicsData.length; i++) {
        const topicInfo = topicsData[i];

        // 2. Create Topic
        const { data: topic, error: topicError } = await supabase
            .from('course_topics')
            .insert({
                course_id: course.id,
                title: topicInfo.title,
                description: topicInfo.description,
                order_index: i
            })
            .select()
            .single();

        if (topicError) throw topicError;
        console.log(`  ✅ Topic created: ${topic.title}`);

        // Filter lessons for this topic
        // I will implement the full array mapping here
        // For now, let's just insert one lesson as proof of concept if I can't fit all into file.
        // But I should try to fit all.
    }
}

// ... I will write the full script in the actual tool call ...
