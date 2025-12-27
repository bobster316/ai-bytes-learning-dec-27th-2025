"use client";

import { FeaturePageLayout } from "@/components/feature-page-layout";

export default function AIPoweredPage() {
    const content = [
        "It would be ironic—and hypocritical—to teach Artificial Intelligence using only traditional, static methods. At AI Bytes Learning, we practise what we preach. We have embedded the very technologies we teach into the core of our platform, creating a dynamic, responsive, and intelligent learning environment that adapts to you. This is not just learning about AI; it is learning *with* AI.",

        "Our 'AI-Powered' philosophy moves beyond the static textbook model where every student sees the same words in the same order. Instead, we view education as a conversation. Every learner brings unique prior knowledge, unique gaps in understanding, and unique goals. A static course cannot address this diversity. An AI companion can.",

        "Central to this experience is our intelligent study companion, which is available on every lesson page. This is not a generic chatbot; it is a context-aware tutor that has 'read' the specific lesson you are studying. If you find a paragraph confusing, you can highlight it and ask for a simpler explanation. If you want a real-world example of a concept in your specific industry—say, 'how does this apply to real estate?'—the AI can generate one instantly. It transforms passive consumption into active interrogation.",

        "We also use AI to personalise your learning path. Our recommendation engine analyses your performance in quizzes, the lessons you have completed, and the topics you have engaged with. It then suggests the most relevant next steps for you. If you struggled with the basics of Neural Networks, it might suggest a refresher module before you tackle Deep Learning. If you breezed through the beginner content, it might suggest fast-tracking you to the advanced projects. This ensures you are always challenged but never overwhelmed.",

        "Assessment is another area where AI shines. Traditional static quizzes are limited; once you memorize the answers, they lose their value. Our platform generates unique quiz questions on the fly, tailored to your current level of understanding. It can create unlimited variations of practice problems, ensuring that you truly understand the concept rather than just remembering that the answer was 'C'.",

        "For coding lessons, our AI code review tool acts as a senior developer looking over your shoulder. When you submit an exercise, it doesn't just pass or fail you; it provides specific, actionable feedback on your code style, efficiency, and potential bugs. It explains *why* your solution works or fails, providing a depth of feedback that was previously impossible without a human tutor sitting next to you.",

        "We also leverage AI for content updates. The field of AI moves at blistering speed. Traditional courseware becomes obsolete within months. Our AI-assisted content pipeline allows our human experts to update lessons rapidly. When a new version of a tool is released, our systems flag the relevant lessons, and our team creates updates immediately. This ensures that what you are learning is always current.",

        "Beyond just text, we are experimenting with multimodal learning. Future updates will allow you to generate custom study aids—like summaries, flashcards, or even audio podcasts—generated from the course material specifically for your learning style. If you learn best by listening, our AI can convert a written lesson into a dialogue. If you are visual, it can generate diagrams to explain complex relationships.",

        "We also use AI to detect 'struggle points'. By aggregating anonymous data from thousands of learners, our system identifies specific videos or paragraphs where users frequently pause, rewind, or drop off. This data creates a feedback loop for our content team, allowing us to continuously refine and improve the clarity of our material. The platform itself learns and improves, just like you do.",

        "This AI integration also democratises access to expert tuition. Historically, having a personal tutor who knows your strengths and weaknesses was a luxury available only to the very wealthy. AI brings this level of personalised attention to everyone. Your AI companion is patient, available 24/7, and never judges you for asking the same question twice.",

        "However, we are careful to maintain the 'Human in the Loop'. AI is a tool, not a replacement for human expertise. Our curriculum, our core explanations, and our strategic direction are all crafted by human experts who understand the nuance of teaching. The AI amplifies this expertise; it does not replace it. It handles the rote tasks of scaling and personalization, allowing our humans to focus on inspiration and complex reasoning.",

        "By learning on an AI-powered platform, you are also implicitly learning how to work with AI tools. You become comfortable with the interaction paradigms—prompting, refining, verifying—that will define the future of work. The medium itself is part of the message.",

        "Imagine a textbook that rewrites itself to be clearer when you look confused. Imagine a teacher who is always available at 3 AM. Imagine a curriculum that evolves in real-time. This is the reality of AI-Powered learning at AI Bytes.",

        "We are building the educational infrastructure of the future. It is responsive, adaptive, and infinitely scalable. It treats you as an individual, not a statistic.",

        "Join us, and experience the difference between simply watching a video and interacting with an intelligence that is dedicated to your success."
    ];

    const images = [
        {
            src: "/images/features/ai-powered-1.png",
            alt: "A sleek interface showing an AI chat companion assisting a student with code.",
            caption: "Your personal AI tutor, available 24/7 to answer any question."
        },
        {
            src: "/images/features/ai-powered-2.png",
            alt: "Abstract visualization of data points adapting to form a unique path for a user.",
            caption: " adaptive learning paths that evolve based on your performance."
        },
        {
            src: "/images/features/ai-powered-3.png",
            alt: "Human and AI hands reaching towards each other, symbolizing collaboration.",
            caption: "Human expertise amplified by Artificial Intelligence."
        }
    ];

    return (
        <FeaturePageLayout
            title="AI-Powered"
            subtitle="Intelligent study companion and adaptive learning recommendations"
            content={content}
            images={images}
        />
    );
}
