"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { CodePlayground } from "@/components/CodePlayground";

export function LessonContentRenderer({ content, images, pipelineType }: { content: any, images: any[], pipelineType?: string }) {
    if (!content) return null;

    const [execResult, setExecResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'assessment'>('content');

    // DEFENSIVE HELPER: Strip code blocks for conceptual courses
    const sanitizeForConceptual = (text: string | undefined) => {
        if (!text) return "";
        if (pipelineType !== 'conceptual') return text;
        // Remove ``` blocks but keep the content inside? 
        // User said: "they should be rendered as plain text... never as code blocks"
        // So we remove the ``` fencing.
        return text.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
    };

    // Helper to strip HTML tags from text
    const stripHtmlTags = (text: string): string => {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, '').trim();
    };

    // Helper to find image for a section
    const getImageForSection = (index: number) => {
        if (!images || images.length <= index) return null;
        return images[index];
    };

    const SectionHeader = ({ number, title }: { number: string, title: string }) => (
        <div className="space-y-6 mb-8">
            <span className="text-5xl font-black text-primary/10 block font-sans select-none">{number}</span>
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-sans leading-tight">
                {title}
            </h2>
            <div className="h-1 w-12 bg-cyan-500 rounded-full" />
        </div>
    );

    const TextRenderer = ({ text }: { text: string }) => (
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 [&_p]:leading-relaxed [&_p]:mb-6 marker:text-cyan-400 [&_p]:text-justify">
            {text.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
            ))}
        </div>
    );

    const ImageDisplay = ({ image, index }: { image: any, index: number }) => (
        <div className="mt-8 aspect-video relative rounded-xl overflow-hidden shadow-lg bg-muted/20">
            {image ? (
                <>
                    <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    {image.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white text-xs backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity">
                            {image.caption}
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground/50 border-2 border-dashed border-muted">
                    <span className="text-xs font-medium">Visual {index + 1}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-background text-foreground font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-32">

            <div className="max-w-[700px] mx-auto px-4 md:px-0 pt-12 space-y-[var(--para-spacing)]">

                {/* Introduction Section (NEW SCHEMA ADAPTER) */}
                {content.content?.hook && (
                    <div className="bg-gradient-to-br from-card to-background border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold font-mono uppercase tracking-widest">
                                <BookOpen className="w-3 h-3" />
                                Introduction
                            </div>
                            <div className="prose prose-lg dark:prose-invert text-foreground/90 font-medium leading-relaxed [&_p]:mb-6 [&_p]:text-justify">
                                {sanitizeForConceptual(content.content.hook).split('\n\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                            {/* Visual Hook (Image 0) */}
                            {getImageForSection(0) && (
                                <div className="mt-6 aspect-video relative rounded-xl overflow-hidden shadow-md border border-border/50">
                                    <img
                                        src={getImageForSection(0).image_url}
                                        alt={getImageForSection(0).alt_text}
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                    />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-white text-xs backdrop-blur-md">
                                        {getImageForSection(0).caption}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Legacy Introduction Support */}
                {content.introduction && !content.content?.hook && (
                    <div className="space-y-8 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] font-bold">
                            <BookOpen className="w-3 h-3" />
                            Introduction
                        </div>
                        <div
                            className="font-sans text-[18px] leading-[32px] text-muted-foreground font-light text-justify [&_p]:mb-12"
                            dangerouslySetInnerHTML={{ __html: content.introduction }}
                        />
                    </div>
                )}

                {/* Video Player */}
                {(content.video_url || (content.videoScript && String(content.videoScript).includes('http'))) && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-black aspect-video relative group ring-1 ring-white/5 my-12">
                        <video
                            src={content.video_url || content.videoScript}
                            controls
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Main Content Sections (NEW SCHEMA) */}
                {content.content && (
                    <div className="space-y-32">
                        {/* Intuition Builder */}
                        {content.content.intuitionBuilder && (
                            <section className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                                <SectionHeader number="01" title="Conceptual Intuition" />
                                <TextRenderer text={sanitizeForConceptual(content.content.intuitionBuilder)} />
                                <ImageDisplay image={getImageForSection(1)} index={1} />
                            </section>
                        )}

                        {/* Implementation Guide */}
                        {content.content.implementationGuide && (
                            <section className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                                <SectionHeader number="02" title="Implementation Guide" />
                                <TextRenderer text={sanitizeForConceptual(content.content.implementationGuide)} />
                                <ImageDisplay image={getImageForSection(2)} index={2} />
                            </section>
                        )}

                        {/* Real-World Case Study */}
                        {content.content.realWorldCaseStudy && (
                            <section className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                                <SectionHeader number="03" title="Real-World Case Study" />
                                <TextRenderer text={sanitizeForConceptual(content.content.realWorldCaseStudy)} />
                                <ImageDisplay image={getImageForSection(3)} index={3} />
                            </section>
                        )}

                        {/* Industry Variations */}
                        {content.content.industryVariations && (
                            <section className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                                <SectionHeader number="04" title="Industry Variations" />
                                <TextRenderer text={sanitizeForConceptual(content.content.industryVariations)} />
                                <ImageDisplay image={getImageForSection(4)} index={4} />
                            </section>
                        )}


                        {/* Fallback for Legacy Data (conceptExplanation) */}
                        {content.content.conceptExplanation && !content.content.implementationGuide && (
                            <section className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
                                <SectionHeader number="02" title="Deep Dive" />
                                <TextRenderer text={sanitizeForConceptual(content.content.conceptExplanation)} />
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[2, 3, 4, 5].map((idx) => (
                                        <ImageDisplay key={idx} image={getImageForSection(idx)} index={idx} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Legacy Sections Support */}
                {content.sections?.map((section: any, idx: number) => {
                    const img = getImageForSection(idx + 1);
                    return (
                        <section key={idx} className="space-y-12">
                            <div className="space-y-6">
                                <span className="text-6xl font-black text-muted-foreground/10 block font-sans select-none">{String(idx + 1).padStart(2, '0')}</span>
                                <h2 className="text-[length:var(--fs-h2)] font-bold text-foreground tracking-[0.05em] uppercase font-sans leading-tight">
                                    {stripHtmlTags(section.title)}
                                </h2>
                                <div className="h-0.5 w-12 bg-cyan-500 rounded-full" />
                            </div>

                            <div className="prose prose-base dark:prose-invert max-w-none text-muted-foreground [&_p]:!text-[18px] [&_p]:!leading-[32px] [&_p]:!tracking-tight [&_p]:!mb-12 [&_p]:!font-normal [&_p]:!text-justify [&_p]:block marker:text-cyan-400">
                                <div dangerouslySetInnerHTML={{ __html: section.content }} />
                            </div>
                        </section>
                    );
                })}

                {/* --- DISPLAY-LEVEL SEGMENTATION: DIVIDER --- */}
                {(content.handsOnChallenge || content.keyTakeaways) && (
                    <div className="py-16 flex items-center gap-4">
                        <div className="h-px bg-border/50 flex-1" />
                        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Assessment & Synthesis</span>
                        <div className="h-px bg-border/50 flex-1" />
                    </div>
                )}

                {/* Hands On Challenge (Assessment) - Sanitized if Conceptual */}
                {content.handsOnChallenge && (
                    <div className="my-12 bg-card border border-border/50 rounded-[2rem] p-10 md:p-16 relative overflow-hidden shadow-lg">
                        <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                                <span className="text-cyan-500 text-xs font-mono uppercase tracking-[0.3em] font-bold">Practical Application</span>
                                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-sans">
                                    {sanitizeForConceptual(stripHtmlTags(content.handsOnChallenge.objective))}
                                </h3>
                            </div>

                            <div className="grid gap-6">
                                {content.handsOnChallenge.steps.map((step: string, sIdx: number) => (
                                    <div key={sIdx} className="flex gap-6 items-start p-6 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-mono font-bold text-primary mt-1">
                                            {sIdx + 1}
                                        </div>
                                        <p className="text-lg text-muted-foreground font-light leading-relaxed font-sans text-justify">
                                            {sanitizeForConceptual(step)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Takeaways */}
                {content.keyTakeaways && (
                    <div className="my-12 bg-gradient-to-b from-muted/10 to-transparent border border-border/50 rounded-[2rem] p-10 md:p-16">
                        <div className="space-y-6 mb-12">
                            <span className="text-cyan-500 text-xs font-mono uppercase tracking-[0.3em] font-bold">Synthesis</span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-sans">
                                Key Takeaways
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {content.keyTakeaways.map((point: string, idx: number) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="mt-2.5 w-1.5 h-1.5 rotate-45 bg-cyan-400 flex-shrink-0" />
                                    <span className="text-muted-foreground leading-relaxed text-lg">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}

export default LessonContentRenderer;
