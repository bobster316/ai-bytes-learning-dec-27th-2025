"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ContentBlock } from "@/lib/types/lesson-blocks";
import { LessonHeader } from "./blocks/lesson-header";
import { ObjectiveCard } from "./blocks/objective-card";
import { TextSection } from "./blocks/text-section";
import { FullImageSection } from "./blocks/full-image-section";
import { TypeCards } from "./blocks/type-cards";
import { ImageTextRow } from "./blocks/image-text-row";
import { CalloutBox } from "./blocks/callout-box";
import { IndustryTabs } from "./blocks/industry-tabs";
import { InlineQuiz } from "./blocks/inline-quiz";
import { KeyTerms } from "./blocks/key-terms";
import { CompletionCard } from "./blocks/completion-card";
import { AppliedCase } from "./blocks/applied-case";
import { RecapSlide } from "./blocks/recap-slide";
import { GoDeeper } from "./blocks/go-deeper";
import { InteractiveVis } from "./blocks/interactive-vis";
import { VideoSnippet } from "./blocks/video-snippet";
import { InlineConceptVideo } from "./blocks/inline-concept-video";
import { ScrollReveal } from "../ui/scroll-reveal";
import { LessonProgressBar } from "./lesson-progress-bar";
import { LessonProgressRail } from "./lesson-progress-rail";
import { AudioRecapProminent } from "./blocks/audio-recap-prominent";
import { PunchQuote } from "./blocks/punch-quote";
import { Prediction } from "./blocks/prediction";
import { Mindmap } from "./blocks/mindmap";
import { FlowDiagram } from "./blocks/flow-diagram";
import { ConceptIllustration } from "./blocks/concept-illustration";
import { OpenExercise } from "./blocks/open-exercise";
import { InstructorInsight } from "./blocks/instructor-insight";
import { useCourseDNA } from "@/components/course/course-dna-provider";
import { archetypeOffset } from "@/lib/ai/generate-course-dna";
import { SectionDivider } from "./SectionDivider";

const BLOCK_COMPONENTS: Record<string, React.FC<any>> = {
    lesson_header:          LessonHeader,
    objective:              ObjectiveCard,
    text:                   TextSection,
    full_image:             FullImageSection,
    image_text_row:         ImageTextRow,
    type_cards:             TypeCards,
    callout:                CalloutBox,
    industry_tabs:          IndustryTabs,
    quiz:                   InlineQuiz,
    completion:             CompletionCard,
    key_terms:              KeyTerms,
    applied_case:           AppliedCase,
    recap:                  RecapSlide,
    go_deeper:              GoDeeper,
    interactive_vis:        InteractiveVis,
    video_snippet:          VideoSnippet,
    audio_recap_prominent:  AudioRecapProminent,
    punch_quote:            PunchQuote,
    prediction:             Prediction,
    mindmap:                Mindmap,
    flow_diagram:           FlowDiagram,
    concept_illustration:   ConceptIllustration,
    open_exercise:          OpenExercise,
    instructor_insight:     InstructorInsight,
};

// Tiered padding — UI/UX Pro Max: section-spacing-hierarchy (16/24/32/48 rhythm)
const COMPACT_PADDING = new Set(['callout', 'objective']);        // py-6 md:py-8
const NARROW_PADDING  = new Set(['recap', 'completion', 'punch_quote', 'go_deeper']); // py-8 md:py-10

// All blocks use 1140px; only the narrowest narrative cards use 840px
const WIDE_INNER = new Set([
    'text', 'objective',
    'type_cards', 'industry_tabs', 'mindmap', 'flow_diagram',
    'applied_case', 'instructor_insight', 'video_snippet',
    'full_image', 'image_text_row', 'interactive_vis',
    'concept_illustration', 'recap', 'quiz', 'audio_recap_prominent',
    'callout', 'open_exercise', 'key_terms', 'completion',
    'go_deeper', 'punch_quote', 'prediction',
]);

// Blocks that should never have a section divider placed before or after them.
// Openers (objective, punch_quote) and the ending sequence (recap → quiz → key_terms → completion)
// flow as a single continuous unit; breaking them with dividers reduces visual clarity.
const SKIP_DIVIDER_TYPES = new Set([
    'objective', 'punch_quote', 'callout',
    'recap', 'quiz', 'key_terms', 'completion', 'audio_recap_prominent',
]);

// Surface-dark sets mapped to layout density — moved to module scope to avoid per-render allocation
const SURFACE_DARK_BY_DENSITY: Record<string, Set<string>> = {
    tight:    new Set(['instructor_insight', 'industry_tabs', 'prediction', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
    balanced: new Set(['instructor_insight', 'type_cards', 'industry_tabs', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
    spacious: new Set(['instructor_insight', 'type_cards', 'industry_tabs', 'prediction', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
};

interface LessonBlockRendererProps {
    blocks: ContentBlock[];
    audioUrl?: string;
    videoUrl?: string;
    videoOverviewUrl?: string;
    images?: any[];
    lessonMetadata?: { duration?: number; difficulty?: string; instructor?: string };
    lessonTitle?: string;
}

export function LessonBlockRenderer({ blocks, audioUrl, videoUrl, videoOverviewUrl, images, lessonMetadata, lessonTitle }: LessonBlockRendererProps) {
    const [isAudioVisible, setIsAudioVisible] = useState(false);
    const courseDNA = useCourseDNA();
    let visualBlockCounter = 0;
    let typeCardsCounter = 0; // track which type_cards block this is (for layout cycling)
    let sectionDividerCounter = 0; // increments each time a divider is rendered (for bold_number style)

    // Derive surface-dark set from density (uses module-scope SURFACE_DARK_BY_DENSITY)
    const SURFACE_DARK = SURFACE_DARK_BY_DENSITY[courseDNA.layout_density] ?? SURFACE_DARK_BY_DENSITY.balanced;

    // ── TypeCards layout offset — derived from palette archetype ─────────
    const typeCardsOffset = archetypeOffset(courseDNA.palette_id, 4);

    const extractedKeyTerms = React.useMemo(() => {
        if (!blocks) return [];
        return blocks.filter(b => b.type === 'key_terms').flatMap(b => (b as any).terms || []);
    }, [blocks]);

    const headerBlock = React.useMemo(() => blocks?.find(b => b.type === 'lesson_header'), [blocks]);
    const bodyBlocks  = React.useMemo(() =>
        (blocks || [])
            .filter(b => b.type !== 'lesson_header')
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
        [blocks]
    );

    if (!blocks || blocks.length === 0) {
        return (
            <div className="p-8 text-center text-[#8A8AB0] font-mono text-sm">
                No content blocks found for this lesson.
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0a0a0f]">
            <LessonProgressBar />
            <LessonProgressRail />

            {/* Full-viewport hero — no width constraint */}
            {headerBlock && (
                <LessonHeader
                    {...headerBlock}
                    title={(headerBlock.title && headerBlock.title !== 'Untitled Lesson') ? headerBlock.title : lessonTitle}
                    audioUrl={audioUrl}
                    videoUrl={videoUrl}
                    videoOverviewUrl={videoOverviewUrl}
                    images={images}
                    lessonMetadata={lessonMetadata}
                    isAudioVisible={isAudioVisible}
                    setIsAudioVisible={setIsAudioVisible}
                />
            )}

            {/* Body blocks — each rendered as a full-width section */}
            <main className="w-full pb-24">
                {bodyBlocks.map((block, idx) => {
                    // Resolve Component ───────────────────────────────
                    const Component = BLOCK_COMPONENTS[(block.type || (block as any).blockType) as keyof typeof BLOCK_COMPONENTS];
                    if (!Component) return null;

                    // ── Extra props ──────────────────────────────────────
                    let extraProps: any = {};
                    if (block.type === 'text' || block.type === 'callout') {
                        extraProps = { extractedKeyTerms };
                    }
                    if (block.type === 'audio_recap_prominent') {
                        extraProps = { audioUrl, onPlay: () => setIsAudioVisible(true) };
                    }

                    // ── Zigzag image_text_row ────────────────────────────
                    if (block.type === 'image_text_row') {
                        extraProps = { ...extraProps, reverse: visualBlockCounter % 2 !== 0 };
                        visualBlockCounter++;
                    }

                    // ── TypeCards layout cycling ──────────────────────────
                    // Each type_cards block in the same lesson gets a different lesson/layout.
                    if (block.type === 'type_cards') {
                        const LAYOUTS = ['bento', 'grid', 'horizontal', 'numbered'] as const;
                        if (!(block as any).layout) {
                            const layoutIdx = (typeCardsCounter + typeCardsOffset) % LAYOUTS.length;
                            extraProps = { ...extraProps, layout: LAYOUTS[layoutIdx] };
                        }
                        typeCardsCounter++;
                    }

                    // ── Normalise prediction block ───────────────────────
                    let renderBlock: any = block;
                    if (block.type === 'prediction') {
                        const b = block as any;
                        const raw: any[] = b.options || [];
                        const opts: [string, string, string] = [
                            typeof raw[0] === 'string' ? raw[0] : raw[0]?.text ?? '',
                            typeof raw[1] === 'string' ? raw[1] : raw[1]?.text ?? '',
                            typeof raw[2] === 'string' ? raw[2] : raw[2]?.text ?? '',
                        ];
                        let ci: 0|1|2 = typeof b.correctIndex === 'number' ? b.correctIndex as 0|1|2 : 1;
                        if (typeof b.correctIndex !== 'number') {
                            const found = raw.findIndex((o: any) => o?.isCorrect === true);
                            if (found === 0 || found === 1 || found === 2) ci = found;
                        }
                        renderBlock = {
                            ...b,
                            question:     b.question || b.questionText || '',
                            options:      opts,
                            correctIndex: ci,
                            reveal:       b.reveal || b.correctFeedback || b.explanation || '',
                        };
                    }

                    // ── Section appearance ───────────────────────────────
                    const hasSurface  = SURFACE_DARK.has(block.type);
                    const innerWidth  = WIDE_INNER.has(block.type) ? 'max-w-[1140px]' : 'max-w-[840px]';
                    const paddingCls  = COMPACT_PADDING.has(block.type)
                        ? 'py-6 md:py-8'
                        : NARROW_PADDING.has(block.type)
                        ? 'py-8 md:py-10'
                        : 'py-10 md:py-14';

                    // Show a section divider between body blocks, but not adjacent to
                    // structural openers/closers (objective, punch_quote, recap, quiz, etc.)
                    const prevBlock = idx > 0 ? bodyBlocks[idx - 1] : null;
                    const showDivider =
                        idx > 0 &&
                        !SKIP_DIVIDER_TYPES.has(block.type) &&
                        prevBlock != null &&
                        !SKIP_DIVIDER_TYPES.has(prevBlock.type);
                    const dividerNumber = showDivider ? ++sectionDividerCounter : undefined;

                    return (
                        <React.Fragment key={`${block.id}-${idx}`}>
                            {showDivider && <SectionDivider sectionNumber={dividerNumber} />}
                            <section
                                id={`block-${block.id}`}
                                data-block-type={block.type}
                                style={{
                                    width: '100%',
                                    background: hasSurface ? '#0f0f1a' : 'transparent',
                                    borderTop:    hasSurface ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                    borderBottom: hasSurface ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                }}
                            >
                                <ScrollReveal delay={0}>
                                    <div className={cn(innerWidth, `mx-auto ${paddingCls} px-[4vw]`)}>
                                        <Component {...renderBlock} {...extraProps} />

                                        {/* Inline concept videos attached to a block */}
                                        {Array.isArray((block as any).conceptVideos) && (block as any).conceptVideos.length > 0 && (
                                            <div className="mt-6 space-y-4">
                                                {(block as any).conceptVideos.map((cv: any, ci: number) => (
                                                    <InlineConceptVideo
                                                        key={`${block.id}-cv-${ci}`}
                                                        url={cv.url || cv.video_url}
                                                        title={cv.title}
                                                        description={cv.description}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            </section>

                            {/* Audio recap injected after quiz */}
                            {block.type === 'quiz' && audioUrl && (
                                <section style={{ width: '100%' }}>
                                    <ScrollReveal delay={0.15}>
                                        <div className={cn('max-w-[1140px] mx-auto py-8 px-[4vw]')}>
                                            <AudioRecapProminent
                                                {...block}
                                                id={block.id + '-recap'}
                                                type="audio_recap_prominent"
                                                audioUrl={audioUrl}
                                                onPlay={() => setIsAudioVisible(true)}
                                            />
                                        </div>
                                    </ScrollReveal>
                                </section>
                            )}
                        </React.Fragment>
                    );
                })}
            </main>
        </div>
    );
}
