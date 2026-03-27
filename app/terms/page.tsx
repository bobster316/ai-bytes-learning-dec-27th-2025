"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
            <Header />

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Terms of Service</h1>
                        <p className="text-primary font-bold">Last Revised: February 08, 2026</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">1. Agreement to Terms</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                AI Bytes Learning ("we," "us," or "our") is a trading name of AI Bytes Ltd. These Terms of Service constitute a legally binding agreement between you and AI Bytes Ltd concerning your access to and use of our website and e-learning platform.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                                By accessing the Site, you confirm that you have read, understood, and agreed to be bound by all of these Terms. If you do not agree with all of these terms, you are expressly prohibited from using the Site.
                            </p>
                        </section>

                        <section className="bg-slate-100 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">2. Subscription & Consumer Rights</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 underline">Right to Cancel (Cooling-off Period)</h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have a legal right to cancel your subscription within <strong>14 days</strong> of signing up for a paid plan.
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2 italic">
                                        Note: If you access or stream a course during this 14-day period, you expressly acknowledge that you lose your right to a full refund.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Billing</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Subscriptions are billed in British Pounds (GBP) inclusive of VAT where applicable. You may cancel at any time via your Dashboard.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">3. Intellectual Property Rights</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Unless otherwise indicated, the Site and its e-learning content (including source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics) are our proprietary property or licensed to us, and are protected by copyright and trademark laws in the United Kingdom and internationally.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">4. User Obligations</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">By using the Site, you represent and warrant that:</p>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-3">
                                <li>You will not share your account or login credentials with any third party.</li>
                                <li>You will use the platform for lawful purposes only.</li>
                                <li>You will not record, redistribute, or pirate course materials.</li>
                                <li>You will not use AI or automated tools to scrape content from the platform.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">5. Limitation of Liability</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                To the maximum extent permitted by law, we shall not be liable for any direct, indirect, or consequential loss arising from your use of the platform. We do not exclude or limit in any way our liability to you where it would be unlawful to do so, including for loss of life or personal injury caused by our negligence.
                            </p>
                        </section>

                        <section className="border-t border-slate-200 dark:border-white/10 pt-12">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">6. Governing Law</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                These Terms and your use of the Site are governed by and construed in accordance with the laws of <strong>England and Wales</strong>. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts of England and Wales.
                            </p>
                        </section>

                        <section className="bg-primary/5 p-8 rounded-3xl border border-primary/20">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Information</h2>
                            <p className="text-slate-600 dark:text-slate-400">If you have any questions about these Terms, please contact us at:</p>
                            <p className="font-black mt-2 text-slate-900 dark:text-white">Email: admin@ai-bytes.org</p>
                        </section>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

