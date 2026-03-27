"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
            <Header />

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Cookie Policy</h1>
                        <p className="text-primary font-bold">Policy version: 2.1 (UK Compliant)</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">1. What Are Cookies?</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                            </p>
                        </section>

                        <section className="bg-slate-100 dark:bg-white/5 p-8 rounded-3xl border border-slate-200 dark:border-white/10">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">2. How We Use Cookies</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">Our use of cookies is compliant with the UK Privacy and Electronic Communications Regulations (PECR). We categorise our cookies as follows:</p>

                            <div className="space-y-6">
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Strictly Necessary Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These are essential for you to move around the website and use its features, such as accessing secure areas. The website cannot function properly without these.</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 opacity-80">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Performance & Analytical Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These allow us to recognise and count the number of visitors and see how they move around our website. This helps us improve the way our platform works (e.g., by ensuring users find what they are looking for easily).</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 opacity-80">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Functionality Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These are used to recognise you when you return to our website. This enables us to personalise our content for you and remember your preferences (for example, your choice of language or region).</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">3. Third-Party Cookies</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Please note that third parties (including, for example, advertising networks and providers of external services like Google Analytics) may also use cookies, over which we have no control. These cookies are likely to be analytical/performance cookies or targeting cookies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">4. Managing Your Preferences</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our platform.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                                To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
                            </p>
                        </section>

                        <section className="bg-primary/5 p-8 rounded-3xl border border-primary/20">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Questions?</h2>
                            <p className="text-slate-600 dark:text-slate-400">For further information on our cookie usage, please contact us at:</p>
                            <p className="font-black mt-2 text-slate-900 dark:text-white">Email: admin@ai-bytes.org</p>
                        </section>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

