"use client";

import { FeaturePageLayout } from "@/components/feature-page-layout";

export default function ProgressAnalyticsPage() {
    const content = [
        "In the philosophy of management, there is an old adage: 'What gets measured, gets managed.' This applies as much to your own brain as it does to a business. Yet, most self-education is flown blind. You watch a few videos, read a few articles, and have a vague sense that you might know more today than you did yesterday—but you have no hard data. Without feedback, progress stalls. At AI Bytes Learning, we replace this ambiguity with precision through our advanced 'Progress Analytics'.",

        "Your learning dashboard is the command centre of your educational journey. It transforms the abstract concept of 'learning' into concrete, actionable metaphors. At a glance, you can see exactly where you stand. Every completed lesson, every passed quiz, and every mastered skill is tracked and visualized. This is not just about gamification; it is about cognitive accountability.",

        "We track progress across multiple dimensions. The most obvious is 'Coverage'—what percentage of the curriculum have you encountered? But coverage is not mastery. So we also track 'Competence'. based on your quiz scores and challenge results, we assign a proficiency score to each topic. You might have 100% coverage on Neural Networks but only 60% competence. Our analytics highlight these discrepancies, showing you exactly where you need to review.",

        "We also visualize your 'Learning Velocity'. This metric tracks how much new material you are absorbing over time. Are you accelerating? Are you stalling? Seeing a dip in your velocity can be a powerful wake-up call to re-engage with your habit. Conversely, seeing a steady upward trend provides a dopamine-fuelled feedback loop that reinforces your daily study routine.",

        "Our 'Topic Heatmap' is a favourite feature among our users. It displays your skills as a colour-coded grid. Green areas are your strengths; red areas are your weaknesses. This allows for surgical learning. Instead of vaguely 'studying AI', you can look at your heatmap, see that your understanding of 'Reinforcement Learning' is weak, and target that specific area. It converts a massive, intimidating subject into a series of small, fixable problems.",

        "We also provide 'Benchmark Analytics'. For those who are competitive or simply curious, we allow you to compare your progress against the community average or against specific career goals. If you want to be a Data Scientist, how does your current skill profile match the industry standard for that role? Our analytics bridge the gap between where you are and where you want to be.",

        "For enterprise teams, these analytics are aggregated into powerful admin dashboards. Managers can see at a glance which team members are engaging, who is excelling, and who might need support. It allows L&D budgets to be deployed with surgical precision, ensuring that training investment translates into actual skill acquisition.",

        "The psychological impact of these analytics cannot be overstated. Learning a complex skill is a marathon, not a sprint. In the middle of the marathon, the finish line looks very far away, and the start line is out of sight. It is easy to feel like you are running on a treadmill. Our analytics serve as mile markers. They prove to you that you are moving forward. They validate your effort.",

        "We also use 'Streak Tracking' to encourage consistency. We know that the biggest predictor of success is not intelligence, but persistence. By visualizing your daily streak, we leverage the psychological principle of 'loss aversion'. You won't want to break the chain. This simple mechanic has helped thousands of our users turn sporadic interest into a daily discipline.",

        "All this data belongs to you. We believe in data portability. You can export your learning record at any time. This comprehensive transcript serves as proof of your dedication and your skills, which can be shared with employers or added to your professional portfolio. It is a data-backed CV of your continuous development.",

        "We are also working on predictive analytics. By analysing your past performance, our system will soon be able to predict your future readiness. It might tell you: 'At your current pace, you will be ready for the certification exam in three weeks.' This helps you plan your life and set realistic goals.",

        "Data is the language of the modern world. By using data to manage your own learning, you are not just learning a subject; you are adopting a mindset. You are treating your own professional development with the rigour and seriousness it deserves.",

        "Stop guessing what you know. Stop wondering if you are making progress. Let the data show you the way. With AI Bytes Learning, you don't just feel like you're learning; you can prove it."
    ];

    const images = [
        {
            src: "/images/features/progress-analytics-1.png",
            alt: "A sleek dashboard displaying colourful graphs and heatmaps on a monitor.",
            caption: "Visualize your mastery with our comprehensive analytics dashboard."
        },
        {
            src: "/images/features/progress-analytics-2.png",
            alt: "A close up of a 'Topic Heatmap' showing green and red skill areas.",
            caption: "Identify your strengths and target your weaknesses with surgical precision."
        },
        {
            src: "/images/features/progress-analytics-3.png",
            alt: "A futuristic holographic display of a user's skill tree growing.",
            caption: "Watch your knowledge grow in real-time."
        }
    ];

    return (
        <FeaturePageLayout
            title="Progress Analytics"
            subtitle="Track your learning journey with detailed completion and performance insights"
            content={content}
            images={images}
        />
    );
}
