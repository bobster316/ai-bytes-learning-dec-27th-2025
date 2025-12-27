"use client";

import { FeaturePageLayout } from "@/components/feature-page-layout";

export default function VerifiedCertificationPage() {
    const content = [
        "In the digital age, skills are the new currency. But like any currency, skills require a reliable mechanism of verification to hold value. You can tell an employer you know how to fine-tune a Large Language Model, but can you prove it? In a sea of embellished CVs and self-proclaimed experts, trust is scarce. At AI Bytes Learning, we solve the trust equation with our 'Verified Certification' system.",

        "Our certificates are not merely PDFs that you print and hang on a wall. They are digital assets, backed by blockchain technology, that serve as irrefutable proof of your competence. When you complete a course with us, you don't just get a pat on the back; you get a verifiable credential that carries weight in the job market.",

        "We have partnered with leading digital credentialing platforms to ensure that every certificate we issue is cryptographically unique and tamper-proof. This means an employer can click a link on your certificate and instantly verify its authenticity directly against our records. There is no faking it. This integrity protects the value of the credential for everyone; because our certificates cannot be forged, they remain a high-trust signal of quality.",

        "Integration is key to utility. We know that your professional identity lives on LinkedIn. That is why our certification system is designed for 'One-Click Integration'. As soon as you pass your final assessment, you can push your credential directly to the 'Licenses & Certifications' section of your LinkedIn profile. It appears with our official logo and a verification link, instantly signalling to recruiters and your network that you are up-skilling.",

        "But a certificate is only as valuable as the rigour behind it. We reject the 'participation trophy' model of online education where you get a certificate simply for letting a video play in the background. To earn an AI Bytes certificate, you must pass verified assessments. You must prove you know the material. This rigour is what gives our certificates value. Employers know that an AI Bytes certificate represents actual knowledge, not just attendance.",

        "We offer tiered certification levels. You can earn badges for individual skills—like 'Prompt Engineering' or 'Python Basics'—which stack up into larger 'Role-Based Certifications', such as 'AI Product Manager' or 'AI Developer'. This allows you to signal micro-skills immediately while working towards a larger qualification. It gamifies your professional development.",

        "The visual design of our certificates is professional and premium. We want you to be proud to share them. They are designed to look great on a slide deck, in a portfolio, or framed on a desk. They are a celebration of your hard work and intellectual curiosity.",

        "In the freelance and consulting world, these certificates are even more critical. They act as a trust bridge between you and potential clients. Being 'AI Bytes Certified' helps you stand out in competitive bidding processes. It provides immediate third-party validation of your claims, reducing the perceived risk for the client.",

        "We also maintain a public graduate directory (with your permission). Top employers use this directory to headhunt talent. By earning a certification, you make yourself visible to companies that are specifically looking for AI-literate professionals. You are opting into a talent pool where the demand far outstrips the supply.",

        "Our certification is also dynamic. We are exploring 'Living Certificates' that show not just that you passed a test once, but that you are maintaining your skills. In a field as fast-moving as AI, a certificate from 2023 might be irrelevant in 2025. Our platform allows for 'Renewal Modules'—short updates you can take to keep your certificate 'Active' and current. This shows employers that you are a continuous learner.",

        "For university students or career switchers, these certificates bridge the gap between formal education and industry needs. A degree shows you have foundational capabilities; our certificates show you have specific, modern, deployable skills. They are the tactical edge that gets you the interview.",

        "We are also working towards industry accreditation. We align our curriculum with major tech frameworks to ensure that what we teach maps to what the industry giants (Google, Microsoft, AWS) define as best practices. Your certificate is a passport that speaks the global language of the tech industry.",

        "Investing in certification is investing in your personal brand. It is a signal to the world that you are serious, that you are capable, and that you are future-ready. In a noisy world, a verified credential cuts through the static.",

        "Don't just learn in the shadows. Step into the light. Earn your stripes, verify your skills, and let your achievements speak for themselves."
    ];

    const images = [
        {
            src: "/images/features/verified-certification-1.png",
            alt: "A close up of a digital certificate with a gold seal and blockchain verification codes.",
            caption: "Cryptographically secured, impossible to forge, easy to verify."
        },
        {
            src: "/images/features/verified-certification-2.png",
            alt: "A LinkedIn profile on a laptop screen showing a newly added AI Bytes certification.",
            caption: "Seamless integration with your professional profile."
        },
        {
            src: "/images/features/verified-certification-3.png",
            alt: "A professional shaking hands with a recruiter, with a holographic certificate floating between them.",
            caption: "Build instant trust with employers and clients."
        }
    ];

    return (
        <FeaturePageLayout
            title="Verified Certification"
            subtitle="Industry-recognised certificates with blockchain verification and LinkedIn integration"
            content={content}
            images={images}
        />
    );
}
