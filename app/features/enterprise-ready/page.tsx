"use client";

import { FeaturePageLayout } from "@/components/feature-page-layout";

export default function EnterpriseReadyPage() {
    const content = [
        "The biggest competitive advantage in the next decade will not be your software stack or your patent portfolio; it will be the AI literacy of your workforce. Companies that successfully integrate AI into their daily workflows will outperform those that don't by an order of magnitude. However, upskilling an entire organisation is a logistical and pedagogical nightmare. At AI Bytes Learning, we solve this with our 'Enterprise Ready' platform.",

        "We are not just a B2C platform; we are a robust B2B solution designed for scale. We understand the specific needs of Learning & Development (L&D) managers, CTOs, and Team Leads. You need visibility, control, and measurable ROI. You need a partner that can handle five users or five thousand with equal ease.",

        "Our Enterprise Dashboard is the control tower for your organisation's upskilling initiative. From a single interface, you can manage licenses, assign courses, and track progress. No more managing learning via spreadsheets and email chains. We provide a centralized hub where you can onboard new employees in seconds and revoke access for leavers just as quickly.",

        "We offer 'Bulk Certificate Generation' and management. When your data science team completes their 'Advanced NLP' module, you can generate and distribute their certificates instantly. This is vital for compliance and for internal morale. Celebrating these wins publicly helps build a culture of continuous learning within your firm.",

        "Our 'Team Analytics' are granular and actionable. You can see not just who has watched a video, but who has passed the assessments. You can identify your internal champions—the employees who are engaging most deeply—and your stragglers who might need more support or time. This data allows you to measure the effectiveness of your training budget. You can prove to the board that the investment in AI Bytes Learning is translating into verified skill acquisition.",

        "Security is paramount for enterprise. We support Single Sign-On (SSO) integration with major identity providers like Okta, Azure AD, and Google Workspace. This means your employees don't need another password to remember. They log in with their corporate credentials, ensuring a seamless and secure user experience. It also means you retain control over access; if an employee leaves, their access is automatically revoked.",

        "We also understand that every company is different. We offer 'Custom Learning Paths'. You can curate a specific playlist of modules for your Marketing team, a different one for your Engineering team, and a third for your Executive leadership. You can map our content to your internal competency frameworks, ensuring that everyone learns exactly what they need for their specific role.",

        "For larger enterprise contracts, we offer 'White Glove' support. This includes dedicated account management and even the option for custom content creation. If you need a specific module on your internal proprietary AI tools, we can work with you to build it and host it on our platform alongside our public content. This creates a unified learning experience for your staff.",

        "We also provide 'Cohort-Based Learning' features. You can group employees into cohorts who take a course together. This fosters peer-to-peer learning and accountability. They can discuss the material in your internal Slack or Teams channels (which we can provide discussion prompts for), turning solitary study into a team-building exercise.",

        "The ROI of an AI-literate workforce is massive. Imagine if every employee in your company could use generative AI to automate their administrative tasks, write better emails, and analyse data faster. You effectively gain hours of productivity per person, per day. It is like hiring 20% more staff without increasing headcount. Our platform remains the most cost-effective way to unlock this productivity.",

        "We also help you retain talent. Top performers want to work for companies that invest in their growth. By providing premium, high-quality AI training, you signal to your employees that you value their future. It is a powerful retention tool in a competitive talent market.",

        "Implementation is rapid. Because we are a cloud-native SaaS platform, there is no software to install. You can pilot with a single team today and roll out to the whole company next week. We provide onboarding materials, email templates, and launch guides to help you drive adoption internally.",

        "Don't let your company get left behind. The AI revolution is happening now. Equip your team with the tools and knowledge they need to win. Choose a platform that is secure, scalable, and built for business.",

        "AI Bytes Enterprise: Your strategic partner in the intelligence economy."
    ];

    const images = [
        {
            src: "/images/features/enterprise-ready-1.png",
            alt: "A comprehensive admin dashboard showing team statistics and license management.",
            caption: "Manage your entire organization's learning from a single, powerful dashboard."
        },
        {
            src: "/images/features/enterprise-ready-2.png",
            alt: "A diverse corporate team collaborating in a modern office, with digital overlays showing their skills.",
            caption: "Build a culture of continuous learning and AI literacy."
        },
        {
            src: "/images/features/enterprise-ready-3.png",
            alt: "Visual representation of Single Sign-On (SSO) security integration.",
            caption: "Enterprise-grade security with seamless SSO integration."
        }
    ];

    return (
        <FeaturePageLayout
            title="Enterprise Ready"
            subtitle="Team management with bulk certificate generation and comprehensive admin dashboards"
            content={content}
            images={images}
        />
    );
}

