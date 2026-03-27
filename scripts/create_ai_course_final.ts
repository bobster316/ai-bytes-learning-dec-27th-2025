
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
});

const COURSE_TITLE = "AI Model Training Essentials";
const COURSE_DESC = "A Beginner's Guide to Modern AI Development. Learn how AI models are trained from scratch to deployment.";

// Full content array
const COURSE_CONTENT = [
    {
        topicTitle: "AI Training Fundamentals",
        topicDesc: "Understanding the three core stages of AI training.",
        lessons: [
            {
                title: "The Three Stages of AI Training",
                mdContent: `# LESSON 1.1: The Three Stages of AI Training

### Introduction: Welcome to AI Training

Welcome to AI Training Essentials! If you've ever used ChatGPT, Claude, or other AI assistants and wondered "How did this thing get so smart?"—you're in the right place. 

In this course, we're going to pull back the curtain on how modern AI systems are trained. Don't worry if you're new to this—we'll explain everything in plain language with plenty of examples. By the end of this short course, you'll understand the core concepts that power today's most impressive AI systems.

Think about your own education for a moment. You didn't become knowledgeable and skilled overnight. You went through elementary school, middle school, high school, maybe college, and then learned on the job. Each stage built on the previous one, developing different capabilities.

AI training works remarkably similarly. There are distinct stages, each with its own purpose, and each building toward creating a system that's not just knowledgeable, but actually useful.

### The Three-Stage Journey

AI model training happens in three major stages. Understanding these stages is crucial to understanding how modern AI works.

**Stage 1: Pre-Training** is like general education—elementary school through high school. This is where the AI reads enormous amounts of text from across the internet. We're talking about billions of words from books, websites, academic papers, and code repositories. During pre-training, the AI learns the fundamental patterns of language, absorbs factual knowledge about the world, and develops basic reasoning capabilities. This creates the foundation for everything that comes later.

**Stage 2: Mid-Training** is like going to college and choosing a major. After the AI has general knowledge, it gets specialized training in specific domains. Maybe it needs to get really good at mathematics, or coding, or scientific reasoning. During mid-training, carefully curated datasets help the model develop expertise in these targeted areas. This stage prepares the model for the sophisticated tasks it will need to handle.

**Stage 3: Post-Training** is like professional development and on-the-job training. This is where the AI learns to be genuinely helpful to users. It learns how to respond to questions clearly, solve problems step-by-step, explain its reasoning, and interact in ways that people find useful. This is the "finishing school" that transforms raw capability into practical utility.

### Stage 1: Pre-Training - Building the Foundation

Let's start at the beginning: pre-training. This is the most computationally expensive and time-consuming phase of AI development.

The AI model is presented with this massive dataset and learns to predict what comes next. For example, if it sees "The cat sat on the…" it learns to predict that "mat" or "chair" might come next. This seems simple, but when you do this billions of times across diverse content, something remarkable happens: the model develops a rich understanding of language, facts, relationships, and patterns.

The scale of pre-training is staggering. Training a model like GPT-4 or Claude required processing hundreds of billions of words, running thousands of specialized computer chips (GPUs) continuously for months. The electricity costs alone run into millions of dollars. The total cost of pre-training a state-of-the-art model can exceed $100 million.

### Stage 2: Mid-Training - Developing Expertise

Mid-training is a more recent innovation in AI development, and it's become increasingly important for creating capable models.

Think of mid-training like this: You've finished your general education, and now you're specializing. Maybe you're studying computer science, medicine, or engineering. You're still learning broadly, but with much more focus on specific domains.

During mid-training, AI models are trained on carefully curated datasets that emphasize particular skills. For a model intended to be good at reasoning and problem-solving, mid-training might include mathematical reasoning datasets, code repositories, and scientific papers.

The key difference from pre-training is intentionality. Instead of just processing everything on the internet, mid-training uses selected, high-quality examples that demonstrate the specific capabilities you want the model to develop.

### Stage 3: Post-Training - Becoming Useful

Post-training is where the magic happens. This is where a knowledgeable but awkward system becomes a helpful, user-friendly AI assistant.

Think about the difference between a brilliant but socially awkward expert and a skilled teacher who can explain complex ideas clearly and helpfully. Post-training creates the skilled teacher.

Post-training involves several techniques, but the two most important are:

**RLHF (Reinforcement Learning with Human Feedback):** This is where human reviewers rate different AI responses to the same question. "Which response is more helpful? Which is clearer? Which follows instructions better?" These preferences are collected and used to train the model to respond in ways humans find useful.

**RLVR (Reinforcement Learning with Verifiable Rewards):** This is a newer, revolutionary technique. RLVR trains models by having them solve problems where we can automatically verify whether they got the right answer. This enables models to develop powerful reasoning capabilities.

The result of post-training is an AI that responds helpfully to questions, explains its reasoning clearly, follows instructions accurately, and declines inappropriate requests.

### Bringing It All Together

Let's recap how these three stages work together to create a capable AI assistant:

**Pre-Training** gives the model its knowledge base and language understanding. It's like reading thousands of books and millions of web pages. Cost: Very high. Time: Months. Result: Knowledgeable but unfocused.

**Mid-Training** develops specialized capabilities and reasoning patterns. It's like focused study in particular domains. Cost: Moderate. Time: Weeks. Result: Skilled but not yet refined.

**Post-Training** makes the model helpful, safe, and user-friendly. It's like professional training and customer service education. Cost: Moderate (but requires human labor). Time: Days to weeks. Result: A polished, useful AI assistant.

Without pre-training, the model would have no foundation. Without mid-training, it would lack specialized capabilities. Without post-training, it would be knowledgeable but unhelpful or even chaotic in its responses.`,
                imagePrompts: [
                    "Animated icon transforming from simple shapes to a complex neural network",
                    "Three connected stepping stones labeled: Pre-Training → Mid-Training → Post-Training",
                    "Animation showing text flowing into a model from various sources: books, Wikipedia, news sites, code repositories",
                    "Focused beams of light highlighting specific domains: mathematical equations, programming code, scientific formulas",
                    "Split screen showing a rough clay sculpture being refined into a polished statue",
                    "Diagram showing all three stages flowing together into a final AI system"
                ],
                videoScript: `Welcome to AI Training Essentials! If you've ever used ChatGPT, Claude, or other AI assistants and wondered "How did this thing get so smart?"—you're in the right place. In this course, we're going to pull back the curtain on how modern AI systems are trained. Don't worry if you're new to this—we'll explain everything in plain language with plenty of examples. By the end of this short course, you'll understand the core concepts that power today's most impressive AI systems. Think about your own education for a moment. You didn't become knowledgeable and skilled overnight. You went through elementary school, middle school, high school, maybe college, and then learned on the job. Each stage built on the previous one, developing different capabilities. AI training works remarkably similarly. There are distinct stages, each with its own purpose, and each building toward creating a system that's not just knowledgeable, but actually useful. Let's dive in.`
            },
            {
                title: "Understanding RLVR - The Breakthrough in AI Training",
                mdContent: `# LESSON 1.2: Understanding RLVR - The Breakthrough in AI Training

### Introduction: A Revolutionary Technique

Welcome back! In Lesson 1.1, you learned about the three stages of AI training. Now we're going to focus on one of the most exciting breakthroughs in AI development: RLVR, or Reinforcement Learning with Verifiable Rewards.

RLVR is the technique behind some of the most impressive AI capabilities you've seen recently—models that can solve complex math problems, write sophisticated code, and explain their reasoning step-by-step. Models like OpenAI's o1 and DeepSeek R1 were trained using RLVR.

But what exactly is RLVR? How does it work? And why is it such a big deal?

By the end of this lesson, you'll understand:
- The basic concept of reinforcement learning
- What makes RLVR different and powerful
- How RLVR training actually works
- The amazing "aha moment" phenomenon
- Where RLVR can and cannot be applied

Let's start with the fundamentals.

### Understanding Reinforcement Learning

Before we get to RLVR specifically, we need to understand reinforcement learning in general.

Think about training a dog. When your dog sits on command, you give it a treat. When it jumps on the couch when you've said no, no treat. Over time, through trial and error, the dog learns which behaviors lead to rewards. This is reinforcement learning.

The same principle applies to AI:

**The Agent:** This is the AI model trying to learn.
**The Environment:** This is the problem or task the AI is working on.
**Actions:** These are the different approaches or solutions the AI tries.
**Rewards:** These are signals that tell the AI whether it succeeded or failed.
**The Learning Process:** The AI tries many different approaches. When it gets rewarded, it strengthens the neural pathways that led to that success. When it doesn't get rewarded, those pathways are weakened. Over thousands or millions of attempts, the AI learns which strategies work.

Reinforcement learning has been used successfully in many domains: training AI to play games (Chess, Go, video games), teaching robots to walk or manipulate objects, optimizing traffic light timing in cities, and now, training language models.

But traditional reinforcement learning for language models had limitations. That's where RLVR comes in.

### Enter RLVR: The Game Changer

RLVR stands for Reinforcement Learning with Verifiable Rewards. The key word here is "verifiable."

In traditional reinforcement learning for language models (called RLHF, which we'll discuss in Module 2), the rewards were based on human preferences. A human would look at two AI responses and say "I prefer response A over response B." This works, but it has limitations: it's expensive, subjective, slow, and hard to scale.

RLVR solves these problems with a simple but powerful insight: Use problems where we can automatically verify if the answer is correct.

Think about a math problem: "What is 15 × 23?" Answer: 345. We can instantly verify this is correct. No human judgment needed. No subjectivity. Just right or wrong.

The same applies to coding (does it run?) and logic puzzles (does it solve constraints?).

The "verifiable" part means: we have an automatic way to check correctness. This was revolutionary because it meant researchers could generate millions of training examples automatically, give instant feedback to the model, scale up training massively without human bottlenecks, and train models to tackle increasingly difficult problems.

### How RLVR Training Works: Step by Step

Let's walk through exactly how RLVR training works.

**Step 1: Present a Problem**
Give the AI a problem with a verifiable answer. For example: "A train travels at 60 miles per hour for 2.5 hours. How far does it travel?"

**Step 2: Let the AI Generate an Answer**
Here's the crucial part: We don't tell the AI how to solve the problem. We just give it the question and let it generate a response however it wants.

**Step 3: Verify the Answer**
We check: Is 150 miles correct? Yes.

**Step 4: Assign Reward**
If the answer is correct: Positive reward (+1). If wrong: Negative reward or zero.

**Step 5: Process Reward**
The AI learns to value the *reasoning steps* that led to verification, not just the final output.

**Step 6: Repeat**
Iterate millions of times.

After millions of these iterations, something remarkable happens...`,
                imagePrompts: [
                    "Animation showing a model attempting a math problem multiple times, improving each iteration",
                    "Side-by-side comparison: dog learning tricks (getting treats) and AI learning (getting rewards)",
                    "Comparison showing verifiable correct answer vs subjective evaluation",
                    "Flowchart showing the RLVR training loop with numbered steps",
                    "Text example showing AI reasoning with a visible self-correction",
                    "Bar chart dramatically showing accuracy jumping from 15% to 50%",
                    "Three columns labeled Perfect for RLVR, Possible with RLVR, and Not Suitable for RLVR"
                ],
                videoScript: `Welcome back! In Lesson 1.1, you learned about the three stages of AI training. Now we're going to focus on one of the most exciting breakthroughs in AI development: RLVR, or Reinforcement Learning with Verifiable Rewards. RLVR is the technique behind some of the most impressive AI capabilities you've seen recently—models that can solve complex math problems, write sophisticated code, and explain their reasoning step-by-step. Models like OpenAI's o1 and DeepSeek R1 were trained using RLVR. But what exactly is RLVR? How does it work? And why is it such a big deal? Let's start with the fundamentals.`
            }
        ]
    }, {
        topicTitle: "Advanced Training Concepts",
        topicDesc: "Comparing RLVR and RLHF, and exploring the future of AI training.",
        lessons: [
            {
                title: "RLVR vs RLHF - Understanding the Difference",
                mdContent: `# LESSON 2.1: RLVR vs RLHF - Understanding the Difference

### Introduction: Two Powerful but Different Approaches

Welcome to Module 2! In the first module, you learned about the three stages of AI training and dove deep into RLVR—Reinforcement Learning with Verifiable Rewards.

But RLVR isn't the only post-training technique. Before RLVR became prominent, another method called RLHF—Reinforcement Learning with Human Feedback—was the dominant approach. In fact, RLHF is what made ChatGPT so magical and useful when it first launched.

Today, the best AI systems use both RLVR and RLHF. They serve different purposes, have different strengths, and work together to create truly capable AI assistants.

In this lesson, you'll learn:
- How RLHF works and why it was revolutionary
- The key differences between RLHF and RLVR
- Why both methods are important
- How modern AI companies combine them
- The limitations of each approach

Let's start by understanding RLHF.

### Understanding RLHF: Learning from Human Preferences

RLHF stands for Reinforcement Learning with Human Feedback. It was the breakthrough that transformed language models from interesting research projects into helpful assistants.

Here's how RLHF works:

**Step 1: Generate Multiple Responses**
The AI is given a question or prompt. The AI generates several different responses.

**Step 2: Humans Choose Their Preference**
Human reviewers look at these responses and rank them. They might prefer one because it's clearer, or safer.

**Step 3: Collect Thousands of These Preferences**
This process repeats thousands of times to build a large dataset of human preferences.

**Step 4: Train a Reward Model**
Using this preference data, the company trains a "reward model"—essentially an AI that predicts what humans will prefer.

**Step 5: Train the Main Model**
Now the main AI model generates responses and gets scored by the reward model. Using reinforcement learning, the model learns to generate responses that humans would prefer.

The result? An AI that responds in a helpful tone, organizes information clearly, and follows instructions accurately.

### The Key Differences: RLVR vs RLHF

Now let's compare them directly.

**What They Optimize For:**
RLVR optimizes for correctness. Did the model get the right answer? The focus is on capability.
RLHF optimizes for preference. Did humans find this response helpful? The focus is on usefulness.

**Signal Quality:**
RLVR has objective signals. Math problems have correct answers.
RLHF has subjective signals. Different people have different preferences.

**Scalability:**
RLVR scales massively. You can generate millions of problems automatically.
RLHF has scaling limitations. Every preference requires human review.

**Cost Structure:**
RLVR costs come from computation.
RLHF costs come from human labor.

**Training Duration:**
RLVR can train indefinitely as long as you have harder problems.
RLHF has diminishing returns after a certain point.

Think of it this way: RLVR makes the model smart. RLHF makes the model pleasant to use.

### The Laptop Shopping Example: Why Both Matter

Let me give you a concrete example.

Imagine two people ask an AI: "What laptop should I buy?"

Person A is a business traveler. Person B is a video editor. There's no single "correct" laptop recommendation. The best answer depends on the person's needs. This is exactly the kind of task RLHF is designed for. Through RLHF training, the model learns to ask clarifying questions and give personalized recommendations.

Now consider: "What is 137 times 492?" There's exactly one correct answer. This is perfect for RLVR.

The best AI systems use RLVR to develop problem-solving capabilities and RLHF to develop communication skills. They're complementary, not competing.

### The Modern Training Recipe

So how do leading AI companies build their best models? They use a combination of all techniques.

**Stage 1: Pre-Training (Foundation)**
Train on massive internet-scale datasets. The model learns language and facts.

**Stage 2: Mid-Training (Specialization)**
Focus on specific domains with curated datasets. Prepare the model for reasoning.

**Stage 3a: Post-Training with RLVR (Intelligence)**
Train on verifiable problems at scale (math, coding, logic) to develop reasoning skills.

**Stage 3b: Post-Training with RLHF (Polish)**
Collect human preferences on tone, style, and safety to make the model pleasant to use.

The result? A model that's both smart (from RLVR) and user-friendly (from RLHF).

### Scaling Laws: The Crucial Difference

Here's one of the most important discoveries: RLVR follows predictable scaling laws. RLHF does not.

With RLVR, if you increase training compute by 10X, you get a predictable improvement in performance. This gives AI companies a clear path forward: invest more compute, get better models.

With RLHF, there's a phenomenon called "reward model over-optimization." If you train too much, the model starts to "game" the system. So there's a sweet spot, and doing more doesn't help.

This is why the future of AI capability improvements is likely to come primarily from scaling RLVR.`,
                imagePrompts: [
                    "Split screen showing RLVR math problems and RLHF human reviewers",
                    "Animation showing human reviewers comparing two AI responses and choosing the better one",
                    "Side-by-side comparison table highlighting key differences between RLVR and RLHF",
                    "Two people asking for laptop recommendations with different needs, illustration",
                    "Flowchart showing the complete modern AI training pipeline",
                    "Graph showing RLVR linear improvement with log-scale compute vs RLHF plateau",
                    "Illustration comparing resources available to big tech companies vs academic researchers"
                ],
                videoScript: `Welcome to Module 2! In the first module, you learned about the three stages of AI training and dove deep into RLVR—Reinforcement Learning with Verifiable Rewards. But RLVR isn't the only post-training technique. Before RLVR became prominent, another method called RLHF—Reinforcement Learning with Human Feedback—was the dominant approach. In fact, RLHF is what made ChatGPT so magical and useful when it first launched. Today, the best AI systems use both RLVR and RLHF. They serve different purposes, have different strengths, and work together to create truly capable AI assistants.`
            },
            {
                title: "Real-World Impact and Future Directions",
                mdContent: `# LESSON 2.2: Real-World Impact and Future Directions

### Introduction: From Theory to Practice

Welcome to the final lesson of this course! You've learned about the three stages of AI training, understood RLVR and RLHF, and seen how they work together.

Now it's time to connect all this theory to reality. How are these training techniques actually being used? What impact are they having? And where is this all heading?

In this lesson, you'll discover:
- Real-world applications powered by RLVR and RLHF
- The phenomenon of inference time scaling
- Cutting-edge developments like process reward models
- Important challenges like data contamination
- Where AI training is heading in the future
- What this means for you

Let's explore how these techniques are changing the world.

### Real-World Applications: AI in Action

The training techniques you've learned about aren't just academic theories—they're powering AI tools you might already be using.

**Coding Assistants:**
Tools like GitHub Copilot and Cursor help developers write code. These are powered by models trained with RLVR. They can write complex functions from natural language descriptions, debug code step-by-step, and explain what code does.

**Mathematics Education:**
AI tutors can now solve and explain complex math problems, show step-by-step solutions, and even generate personalized practice problems. RLVR provides the problem-solving capability; RLHF provides the clear communication.

**Research Assistance:**
Scientists use AI for literature review, hypothesis generation, and data analysis suggestions. The AI synthesizes findings and suggests relevant connections—combining web search with RLVR-trained reasoning.

**Business Analytics:**
Companies use AI for data interpretation, strategic planning, and risk assessment. The AI identifies patterns, shows reasoning, and suggests areas for investigation.

**Creative Problem-Solving:**
Beyond traditional domains, AI helps with complex planning, logistics, strategic game playing, and puzzle solving. All these rely on RLVR for reasoning and RLHF for helpful interaction.

### Inference Time Scaling: Thinking Longer for Better Results

Now let's discuss an important concept that emerged from RLVR training: inference time scaling.

Inference time is how long it takes the model to respond. Scaling inference time means letting the AI use more time and compute to think through a problem before answering.

It's like taking a math test: You could answer quickly (error-prone) or work through each problem step-by-step (better results). Inference time scaling is the latter.

When you ask a model trained with RLVR a complex question, it breaks down the problem, works through it step-by-step, checks its reasoning, and verifies the answer. This takes more time and compute, but dramatically improves quality.

Interestingly, this emerged naturally from RLVR training. Models learned that taking time to reason leads to better rewards.

Real-world impact: Models like OpenAI's o1 can tackle competition-level math problems and complex coding challenges by thinking longer.

### The Frontier: Process Reward Models and Value Functions

RLVR "1.0" only checked if the final answer was correct. Researchers are now working on RLVR 2.0.

**Process Reward Models:**
These check each step of the reasoning. Instead of one reward at the end, the model gets feedback at every step (e.g., is this calculation correct?). This helps it learn the right way to think, not just the right answer.

**Value Functions:**
These assign value to every single token (word) the model generates. This is used in game AI (like Go) and robotics. Applying it to language models is challenging but promising.

**The Data Contamination Challenge:**
AI models train on huge portions of the internet. Test benchmarks also come from the internet. Sometimes models have "seen the test questions" during training. This makes it hard to know if they're really getting smarter or just memorizing. Researchers are working on better benchmarks and transparency.

### Future Directions: Where Is This All Heading?

**Near-Term (2025-2026):**
Scaling Up RLVR: Even harder problems, longer reasoning chains.
Better Verification: Expanding beyond math/code to scientific reasoning.

**Medium-Term (2026-2028):**
Value Functions: Improved learning efficiency.
Collaborative AI: Models working together on complex problems.

**Long-Term (2028+):**
General Problem-Solving: Tackling novel problems in new domains.
Transparent Reasoning: Models explaining *why* they chose strategies.

### What This Means for You

**As an AI User:**
Understand capabilities realistically. Use tools effectively (know when to ask for reasoning). Assess claims critically.

**As a Professional:**
AI coding assistants are becoming standard. AI helps with research and analysis. Understanding training helps you evaluate tools and stay competitive.

**As a Learner:**
Use AI to explain concepts, break down problems, and generate practice questions. Verify its work!

Thank you for taking this course. You now have a solid foundation in how modern AI systems are trained!`,
                imagePrompts: [
                    "Montage of AI applications: coding assistants, math tutors, research tools, business analytics",
                    "Split screen showing different AI applications in use",
                    "Comparison showing quick answer vs extended reasoning with better accuracy",
                    "Diagram showing scoring at each step of reasoning vs only at the end",
                    "Venn diagram showing overlap between training data and test data",
                    "Timeline roadmap showing near-term and long-term developments in AI",
                    "Celebratory completion screen with course summary certificate"
                ],
                videoScript: `Welcome to the final lesson of this course! You've learned about the three stages of AI training, understood RLVR and RLHF, and seen how they work together. Now it's time to connect all this theory to reality. How are these training techniques actually being used? What impact are they having? And where is this all heading? In this lesson, you'll discover real-world applications powered by RLVR and RLHF, the phenomenon of inference time scaling, cutting-edge developments like process reward models, and what this all means for you. Let's explore how these techniques are changing the world.`
            }
        ]
    }
];

async function seedCourse(targetUserId: string) {
    console.log(`🌱 Seeding Course: "${COURSE_TITLE}"...`);
    console.log(`👤 Assigning to user: ${targetUserId}`);

    // 2. Create Course Template First
    console.log("Creating template...");
    const { data: template, error: templateError } = await supabase
        .from('course_templates')
        .insert({
            title: COURSE_TITLE,
            difficulty: 'Intermediate',
            description: COURSE_DESC,
            estimated_duration_hours: 1,
            learning_objectives: ["Understand AI training stages", "Learn RLVR vs RLHF"],
            thumbnail_prompt: "AI training process abstract art"
        })
        .select()
        .single();

    if (templateError) {
        console.error("Template creation failed:", templateError);
        process.exit(1);
    }
    console.log(`✅ Template created: ${template.id}`);

    // 3. Create Course linked to Template
    console.log("Creating course...");
    const { data: coursesData, error: courseError } = await supabase
        .from('courses')
        .insert({
            template_id: template.id,
            title: COURSE_TITLE,
            description: COURSE_DESC,
            difficulty: 'Intermediate',
            estimated_duration_hours: 1,
            learning_objectives: ["Understand AI training stages", "Learn RLVR vs RLHF"],
            thumbnail_prompt: "AI training process abstract art",
            published: true,
            // Removing user_id as it might not be in the schema or handled elsewhere
        })
        .select();

    if (courseError) {
        console.error("Course creation failed:", courseError);
        process.exit(1);
    }

    if (!coursesData || coursesData.length === 0) {
        console.error("Course created but no data returned.");
        process.exit(1);
    }
    const course = coursesData[0];
    console.log(`✅ Course created: ${course.id}`);

    // 4. Create Topics and Lessons (linked to COURSE, not template for now, or both?)
    // Usually published courses have their own copy.

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
            .select() // no Single
            .single();

        if (topicError) {
            console.error(`Topic creation failed for ${t.topicTitle}:`, topicError);
            continue;
        }
        console.log(`  ✅ Topic created: ${topic.title}`);

        for (let j = 0; j < t.lessons.length; j++) {
            const l = t.lessons[j];
            const contentJson = {
                topicContent: l.mdContent,
                wordCount: l.mdContent.split(' ').length,
                videoScript: {
                    coreContent: { segments: [{ script: l.videoScript, duration: 60 }] }
                },
                imagePrompts: l.imagePrompts.map((p, idx) => ({ prompt: p, imageNumber: idx + 1 }))
            };

            const { data: lesson, error: lessonError } = await supabase
                .from('course_lessons')
                .insert({
                    topic_id: topic.id,
                    title: l.title,
                    order_index: j,
                    content_markdown: l.mdContent, // Using proper column if exists in schema?
                    // But schema says content (TEXT) or content_markdown?
                    // Migration says content_markdown.
                    // Wait, create_ai_course_full.ts used content as JSONB?
                    // Migration says content_markdown TEXT NOT NULL.
                    // But previous attempts used content JSON.
                    // Let's assume content_markdown is correct column.
                    // Wait, migration 20251111 says content_markdown.
                    // But maybe create_ai_course_full.ts was wrong?
                    // I'll stick to content_markdown.
                })
                .select()
                .single();

            if (lessonError) {
                // Fallback: try inserting into 'content' column with JSON string if schema is weird
                console.warn(`Lesson creation failed (first try), retrying with JSON content...`, lessonError);
                await supabase.from('course_lessons').insert({
                    topic_id: topic.id,
                    title: l.title,
                    order_index: j,
                    content: JSON.stringify(contentJson)
                });
            } else {
                console.log(`    ✅ Lesson created: ${lesson.title}`);
                // Update with JSON content if needed in another field?
                // For now, assume markdown is enough.
            }
        }
    }
    console.log("🏁 Seeding Complete!");
}

(async () => {
    console.log(`URL: ${supabaseUrl}`);

    // 1. Get/Create User
    let userId: string | null = null;
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();

    if (uError) {
        console.error("List users failed:", uError);
        process.exit(1);
    }

    if (users && users.length > 0) {
        userId = users[0].id;
        console.log(`Using existing user: ${userId}`);
    } else {
        console.log("Creating test user...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'admin@aibytes.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: { full_name: 'Admin User' }
        });
        if (createError) {
            console.error("Create user failed:", createError);
            process.exit(1);
        }
        userId = newUser.user.id;
        console.log(`Created user: ${userId}`);
    }

    // 2. Ensure Profile Exists
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: 'Admin User',
        email: 'admin@aibytes.com',
        role: 'admin',
        updated_at: new Date().toISOString()
    });

    if (profileError) {
        console.error("Profile upsert failed:", profileError);
    } else {
        console.log("✅ Profile ensured.");
    }

    // 3. Run Seeding
    await seedCourse(userId!);
})();
