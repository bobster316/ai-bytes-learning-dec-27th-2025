/**
 * AI Bytes Learning - Aria Knowledge Base
 * Comprehensive company and platform information for the AI voice assistant
 */

export const COMPANY_INFO = {
    name: "AI Bytes Learning",

    mission: "Democratize AI education by breaking down complex AI concepts into digestible, 15-minute lessons accessible to everyone.",

    philosophy: [
        "Byte-sized learning: 15-minute focused lessons",
        "Accessibility first: Ages 10-60, all backgrounds welcome",
        "Zero assumptions: Beginner content assumes NO prior knowledge",
        "British English: We use 'colour', 'optimise', 'programme'",
        "Premium quality: 800-1000 word lessons with 4 educational diagrams each"
    ],

    tagline: "AI education for everyone, not just computer scientists"
};

export const DIFFICULTY_LEVELS = {
    beginner: {
        ageRange: "10-60 years",
        wordCount: "800+ words per lesson",
        assumptions: "ZERO prior knowledge",
        style: "Simple everyday analogies, short sentences (15-20 words), explain every technical term",
        example: "Think of a neural network like learning to ride a bike..."
    },

    intermediate: {
        ageRange: "14-60 years",
        wordCount: "900+ words per lesson",
        assumptions: "Basic familiarity with core concepts",
        style: "Technical terminology with brief explanations, practical applications"
    },

    advanced: {
        ageRange: "18-60 years",
        wordCount: "1000+ words per lesson",
        assumptions: "Strong foundational knowledge",
        style: "Free use of technical terminology, research-level depth"
    }
};

export const COURSE_STRUCTURE = {
    totalDuration: "~60 minutes per course",
    topics: "3-4 modules per course",
    lessons: "2-4 lessons per topic",
    images: "4 educational diagrams per lesson",
    quizzes: "1 assessment quiz per topic",

    hierarchy: `
    Course (60 minutes)
    ├── Topic 1 (Module)
    │   ├── Lesson 1.1 (800+ words, 4 images)
    │   ├── Lesson 1.2
    │   └── Quiz 1
    ├── Topic 2
    └── Topic 3
  `
};

export const PRICING = {
    currency: "GBP (British Pounds)",
    symbol: "£",
    free: "Select courses available for free",
    premium: "£39 per premium course"
};

export const PLATFORM_FEATURES = [
    "AI-generated courses using Gemini and GPT",
    "Professional educational diagrams (Midjourney, DALL-E, Replicate)",
    "Text-to-speech lessons (ElevenLabs)",
    "Progress tracking and analytics",
    "Interactive quizzes with explanations",
    "Admin course management dashboard",
    "Student personal dashboard",
    "Responsive design (mobile, tablet, desktop)"
];

export const NAVIGATION_MAP = {
    "/": "Homepage with AI news feed and course highlights",
    "/courses": "Browse all available courses in the catalogue",
    "/courses/[id]": "Course overview page with curriculum",
    "/courses/[id]/lessons/[lessonId]": "Individual lesson viewer",
    "/dashboard": "Personal student dashboard with progress",
    "/admin": "Admin panel for course management",
    "/admin/courses": "Course list with edit/delete options",
    "/admin/courses/new": "AI course generator interface",
    "/admin/courses/edit/[id]": "Course editor"
};

export const AI_TOPICS_EXPERTISE = [
    "Machine Learning (supervised, unsupervised, reinforcement learning)",
    "Neural Networks (feedforward, convolutional CNNs, recurrent RNNs)",
    "Deep Learning architectures (ResNet, VGG, Inception, U-Net)",
    "Natural Language Processing (NLP, tokenization, embeddings)",
    "Large Language Models (GPT, BERT, T5, Claude, Gemini)",
    "Transformers and attention mechanisms",
    "Computer Vision (object detection, segmentation, image classification)",
    "Generative AI (GANs, VAEs, Diffusion models, Stable Diffusion)",
    "AI Ethics and responsible AI development",
    "AI Applications (healthcare, finance, education, robotics)",
    "Model training and optimization",
    "Transfer learning and fine-tuning",
    "AI deployment and MLOps"
];

export const HELP_CATEGORIES = {
    navigation: {
        "How do I start learning?": "Visit /courses, select a course, and click 'Start Learning'",
        "Where's my dashboard?": "Click 'Dashboard' in the navigation or visit /dashboard",
        "How do I find courses?": "Browse the catalogue at /courses",
        "Where are my enrolled courses?": "They're on your dashboard (/dashboard)"
    },

    courses: {
        "How long is a course?": "Each course is approximately 60 minutes total",
        "How many lessons per course?": "Typically 6-12 lessons across 3-4 topics",
        "What's a topic?": "A topic is a module/chapter containing 2-4 related lessons",
        "Are there quizzes?": "Yes! Each topic has an assessment quiz at the end"
    },

    difficulty: {
        "Which level should I choose?": "Beginner if new to AI, Intermediate if you know basics, Advanced if you have strong foundation",
        "Can a 10-year-old understand beginner?": "Absolutely! Beginner courses are designed for ages 10-60 with zero assumptions",
        "What if I'm stuck?": "Ask me to explain any concept! I can break it down further"
    },

    pricing: {
        "How much do courses cost?": "Some are free, premium courses are £39",
        "Are there free courses?": "Yes! We have select free courses available",
        "What currency?": "British Pounds (£)"
    }
};

export const CONVERSATION_STYLE = {
    tone: "Warm, encouraging, professional yet friendly",
    language: "British English (colour, optimise, programme)",
    length: "Concise for voice (2-4 sentences), can expand if asked",
    approach: "Use 'we' and 'us' for collaborative learning",
    personality: "Patient, supportive, enthusiastic about learning"
};

export const EXAMPLE_ANALOGIES = {
    neuralNetworks: "Think of a neural network like learning to ride a bike. Your brain creates connections, and each time you practise, those connections get stronger. A computer neural network does the same—it learns from examples and gets better with practice!",

    machineLearning: "Imagine teaching a child to recognise dogs. You show them lots of pictures, they learn what makes a dog a dog (four legs, tail, ears). Machine learning works the same way—the computer learns patterns from examples!",

    backpropagation: "Think of it like learning from mistakes when playing darts. If you miss the target, you adjust your throw based on how far off you were. Backpropagation does this for computers—it adjusts based on errors.",

    deepLearning: "Imagine learning to bake. First you learn basic cooking (heat, mixing), then baking (ovens, timing), then decorating. Deep learning works in layers like this, with each layer learning something more complex!",

    transformers: "Think of reading a book and understanding context. You don't read each word in isolation—you remember what came before. Transformers help computers do the same thing with text, remembering context to understand meaning."
};
