"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Privacy Policy</h1>
                        <p className="text-[#00FFB3] font-bold">Effective Date: 08 February 2026</p>
                    </div>

                    <div className="max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">1. Introduction</h2>
                            <p className="text-white/65 leading-relaxed italic">
                                AI Bytes Learning is a trading name of AI Bytes Ltd, a company registered in England and Wales.
                            </p>
                            <p className="text-white/65 leading-relaxed mt-4">
                                This Privacy Policy explains how we collect, use, and protect your personal data when you use our platform, in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. We are committed to being transparent about what we do with your information.
                            </p>
                        </section>

                        <section className="bg-white/[0.04] p-8 rounded-3xl border border-white/[0.08] backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-6">2. Information We Collect</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-white mb-2">Direct Information</h3>
                                    <p className="text-white/65">Identity and contact data (name, email), profile data (username, course progress), and financial data (processed securely via Stripe).</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-2">Automated Data</h3>
                                    <p className="text-white/65">Technical data including IP address, browser type, and usage patterns to improve your experience.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-2">Learning Data</h3>
                                    <p className="text-white/65">Course interactions, quiz scores, and AI model inputs to personalise your education journey.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">3. Legal Basis for Processing</h2>
                            <p className="text-white/65 leading-relaxed mb-4">
                                Under the UK GDPR, we rely on the following legal bases:
                            </p>
                            <ul className="list-disc pl-6 text-white/65 space-y-3">
                                <li><strong className="text-white">Contractual Necessity:</strong> To provide the e-learning services you&apos;ve subscribed to.</li>
                                <li><strong className="text-white">Legitimate Interests:</strong> To improve our platform, ensure security, and provide analytics.</li>
                                <li><strong className="text-white">Consent:</strong> For marketing communications (which you can withdraw at any time).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">4. Your Rights</h2>
                            <p className="text-white/65 leading-relaxed mb-6">
                                As a UK resident, you have the following rights regarding your personal data:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    "The right to access your data",
                                    "The right to rectification",
                                    "The right to erasure ('right to be forgotten')",
                                    "The right to restrict processing",
                                    "The right to data portability",
                                    "The right to object to processing"
                                ].map((right, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold text-white">
                                        <div className="w-2 h-2 rounded-full bg-[#00FFB3] flex-shrink-0" />
                                        {right}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">5. Data Retention &amp; Security</h2>
                            <p className="text-white/65 leading-relaxed">
                                We retain your personal data only for as long as necessary to fulfil the purposes we collected it for. We use industry-standard encryption and security protocols (SSL/TLS) and store data primarily on securely encrypted servers within the UK and EU.
                            </p>
                        </section>

                        <section className="border-t border-white/[0.08] pt-12">
                            <h2 className="text-2xl font-bold text-white mb-6">6. Contact &amp; Complaints</h2>
                            <p className="text-white/65 leading-relaxed mb-6">
                                If you have any questions about this policy or want to exercise your rights, please contact our Data Protection lead:
                            </p>
                            <div className="bg-[#9B8FFF]/10 border border-[#9B8FFF]/20 rounded-3xl p-6 text-white">
                                <p className="font-black mb-1">Email: admin@ai-bytes.org</p>
                                <p className="text-sm text-white/65">Reference: Data Protection Officer</p>
                            </div>
                            <p className="text-sm text-white/40 mt-6">
                                You also have the right to make a complaint at any time to the Information Commissioner&apos;s Office (ICO), the UK supervisory authority for data protection issues (www.ico.org.uk).
                            </p>
                        </section>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
