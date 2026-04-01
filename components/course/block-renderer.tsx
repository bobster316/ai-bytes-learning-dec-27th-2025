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
import { Hook } from "./blocks/hook";
import { TeachingLine } from "./blocks/teaching-line";
import { MentalCheckpoint } from "./blocks/mental-checkpoint";
import { useCourseDNA } from "@/components/course/course-dna-provider";
import type { LessonPersonality } from '@/lib/ai/conductor/types';
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
    hook:                   Hook,
    teaching_line:          TeachingLine,
    mental_checkpoint:      MentalCheckpoint,
    core_explanation:       TextSection,
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
    'hook', 'teaching_line', 'mental_checkpoint', 'core_explanation',
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

// Four-colour accent cycle — rotates per lesson so each lesson in a course has a distinct accent
const LESSON_ACCENT_CYCLE = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B"] as const;

interface LessonBlockRendererProps {
    blocks: ContentBlock[];
    audioUrl?: string;
    videoUrl?: string;
    videoOverviewUrl?: string;
    images?: any[];
    lessonMetadata?: { duration?: number; difficulty?: string; instructor?: string };
    lessonTitle?: string;
    lessonIndex?: number;
    lessonPersonality?: LessonPersonality;
    microVariationSeed?: number;
    nextLessonHref?: string;
}

export function LessonBlockRenderer({ blocks, audioUrl, videoUrl, videoOverviewUrl, images, lessonMetadata, lessonTitle, lessonIndex, lessonPersonality, microVariationSeed, nextLessonHref }: LessonBlockRendererProps) {
    const [isAudioVisible, setIsAudioVisible] = useState(false);
    const courseDNA = useCourseDNA();
    let visualBlockCounter = 0;
    let typeCardsCounter = 0; // track which type_cards block this is (for layout cycling)
    let sectionDividerCounter = 0; // increments each time a divider is rendered (for bold_number style)

    // Derive surface-dark set from density (uses module-scope SURFACE_DARK_BY_DENSITY)
    const SURFACE_DARK = SURFACE_DARK_BY_DENSITY[courseDNA.layout_density] ?? SURFACE_DARK_BY_DENSITY.balanced;

    // ── Per-lesson accent — rotates through 4 brand colours so each lesson looks distinct ──
    // Uses lessonIndex (order_index from DB) to pick from the accent cycle.
    // Offset by archetypeOffset so two courses with the same lesson count still differ.
    const lessonAccentPhase = ((lessonIndex ?? 0) + archetypeOffset(courseDNA.palette_id, 4)) % 4;
    const lessonAccentColour = LESSON_ACCENT_CYCLE[lessonAccentPhase];

    // Surface section colours — use DNA surface tinted with lesson accent rather than flat #0f0f1a
    const surfaceBg     = courseDNA.surface_colour; // e.g. #0b0a14 for iris palette
    const surfaceBorder = `${lessonAccentColour}18`;  // very subtle accent tint on the border

    // ── TypeCards layout offset — derived from palette archetype ─────────
    const typeCardsOffset = archetypeOffset(courseDNA.palette_id, 4);

    // Normalise block types early — generator stores real type in block_type (snake) or blockType (camel).
    // Also fixes compound type names that Gemini sometimes emits (e.g. "type_cards grid",
    // "image_text_row reversed", "INTRO") — these are silently skipped by BLOCK_COMPONENTS
    // without this normalisation. Provides a render-time safety net for existing DB records.
    const normalizedBlocks = React.useMemo(() =>
        (blocks || []).map(b => {
            const bAny = b as any;
            let resolvedType: string = bAny.block_type || bAny.blockType || bAny.type || '';
            const extra: Record<string, unknown> = {};

            // Compound type normalisation
            const typeCardsMatch = resolvedType.match(/^type_cards\s+(grid|numbered|horizontal|bento)$/);
            if (typeCardsMatch) {
                extra.layout = bAny.layout || typeCardsMatch[1];
                resolvedType = 'type_cards';
            } else if (resolvedType === 'image_text_row reversed') {
                extra.reverse = true;
                resolvedType = 'image_text_row';
            } else if (resolvedType === 'INTRO' || resolvedType === 'OUTRO' || resolvedType === 'explanatory' || resolvedType === 'visual_insight') {
                resolvedType = 'video_snippet';
            }

            const needsUpdate = resolvedType !== bAny.type || Object.keys(extra).length > 0;
            return needsUpdate ? { ...b, ...extra, type: resolvedType } as ContentBlock : b;
        }),
        [blocks]
    );

    const extractedKeyTerms = React.useMemo(() => {
        if (!normalizedBlocks) return [];
        return normalizedBlocks.filter(b => b.type === 'key_terms').flatMap(b => (b as any).terms || []);
    }, [normalizedBlocks]);

    const headerBlock = React.useMemo(() => normalizedBlocks?.find(b => b.type === 'lesson_header'), [normalizedBlocks]);
    const bodyBlocks  = React.useMemo(() =>
        (normalizedBlocks || [])
            .filter(b => b.type !== 'lesson_header')
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
        [normalizedBlocks]
    );

    // Normalise lesson_header fields — AI may use camelCase aliases (lessonTitle, objectiveText, etc.)
    const normalizedHeaderProps = React.useMemo(() => {
        if (!headerBlock) return null;
        const hb = headerBlock as any;
        const hParas = hb.paragraphs;
        return {
            ...hb,
            title:       (hb.title && hb.title !== 'Untitled Lesson') ? hb.title : (hb.lessonTitle || lessonTitle),
            tag:         hb.tag        || hb.category   || hb.topic      || 'Core Concept',
            duration:    hb.duration   || hb.timeEstimate || hb.minutes  || '15 min',
            difficulty:  hb.difficulty || hb.level       || hb.skillLevel || 'Intermediate',
            heroType:    hb.heroType   || 'interactive',
            heroPrompt:  hb.heroPrompt || hb.imagePrompt || hb.background || '',
            description: hb.description || hb.body || (Array.isArray(hParas) ? hParas[0] : hParas) || hb.subtitle || '',
            objectives:  (Array.isArray(hb.objectives) && hb.objectives.length > 0)
                            ? hb.objectives
                            : hb.learning_objectives || hb.goals || hb.outcomes || [],
        };
    }, [headerBlock, lessonTitle]);

    if (!blocks || blocks.length === 0) {
        return (
            <div className="p-8 text-center text-[#8A8AB0] font-mono text-sm">
                No content blocks found for this lesson.
            </div>
        );
    }

    return (
        <div
            className="w-full min-h-screen"
            data-personality={lessonPersonality ?? 'calm'}
            style={{
                "--lesson-accent": lessonAccentColour,
                "--micro-seed": microVariationSeed ?? 0,
            } as React.CSSProperties}
        >
            <LessonProgressBar />
            <LessonProgressRail />

            {/* Full-viewport hero — no width constraint */}
            {normalizedHeaderProps && (
                <LessonHeader
                    {...normalizedHeaderProps}
                    audioUrl={audioUrl}
                    videoUrl={videoUrl}
                    videoOverviewUrl={videoOverviewUrl}
                    images={images}
                    lessonMetadata={lessonMetadata}
                    isAudioVisible={isAudioVisible}
                    setIsAudioVisible={setIsAudioVisible}
                    lessonIndex={lessonIndex ?? 0}
                    lessonPersonality={lessonPersonality ?? 'calm'}
                    microVariationSeed={microVariationSeed ?? 0}
                />
            )}

            {/* Body blocks — each rendered as a full-width section */}
            <div className="w-full pb-24">
                {bodyBlocks.map((block, idx) => {
                    const resolvedType: string = block.type || '';

                    // Resolve Component ───────────────────────────────
                    const Component = BLOCK_COMPONENTS[resolvedType as keyof typeof BLOCK_COMPONENTS];
                    if (!Component) return null;

                    // ── Skip image-only blocks with no URL ───────────────
                    // full_image has no content without an image — hide rather than show a broken placeholder.
                    // image_text_row and concept_illustration still have text so they render their content.
                    if (resolvedType === 'full_image') {
                        const b = block as any;
                        const hasUrl = b.imageUrl || b.image_url || b.url;
                        if (!hasUrl) return null;
                    }

                    // ── Extra props ──────────────────────────────────────
                    let extraProps: any = {};
                    if (resolvedType === 'text' || resolvedType === 'callout') {
                        extraProps = { extractedKeyTerms };
                    }
                    if (resolvedType === 'audio_recap_prominent') {
                        extraProps = { audioUrl, onPlay: () => setIsAudioVisible(true) };
                    }
                    if (resolvedType === 'flow_diagram' || resolvedType === 'objective' || resolvedType === 'recap'
                        || resolvedType === 'punch_quote' || resolvedType === 'completion' || resolvedType === 'instructor_insight'
                        || resolvedType === 'callout' || resolvedType === 'applied_case' || resolvedType === 'key_terms'
                        || resolvedType === 'inline_quiz') {
                        extraProps = {
                            ...extraProps,
                            lessonIndex: lessonIndex ?? 0,
                            lessonPersonality: lessonPersonality ?? 'calm',
                            microVariationSeed: microVariationSeed ?? 0,
                        };
                    }

                    // ── Zigzag image_text_row ────────────────────────────
                    if (resolvedType === 'image_text_row') {
                        extraProps = { ...extraProps, reverse: visualBlockCounter % 2 !== 0 };
                        visualBlockCounter++;
                    }

                    // ── TypeCards layout cycling ──────────────────────────
                    // Each type_cards block in the same lesson gets a different lesson/layout.
                    if (resolvedType === 'type_cards') {
                        const LAYOUTS = ['bento', 'grid', 'horizontal', 'numbered'] as const;
                        if (!(block as any).layout) {
                            const layoutIdx = (typeCardsCounter + typeCardsOffset) % LAYOUTS.length;
                            extraProps = { ...extraProps, layout: LAYOUTS[layoutIdx] };
                        }
                        typeCardsCounter++;
                    }

                    // ── Render-time field aliasing ───────────────────────
                    // Rescues blocks whose content landed in generic field names (heading/paragraphs)
                    // due to the old generation bug where all blocks were stored as type "text".
                    let renderBlock: any = block;

                    if (resolvedType === 'punch_quote') {
                        const b = block as any;
                        const paras = b.paragraphs;
                        renderBlock = {
                            ...b,
                            quote:  b.quote  || b.text || b.body || b.heading || (Array.isArray(paras) ? paras[0] : paras) || '',
                            accent: b.accent || 'pulse',
                        };
                    } else if (resolvedType === 'objective') {
                        const b = block as any;
                        const paras = b.paragraphs;
                        renderBlock = {
                            ...b,
                            label: b.label || b.heading || b.title || 'Learning Objective',
                            text:  b.text  || b.objectiveText || b.body || b.content
                                || (Array.isArray(paras) ? paras[0] : paras) || '',
                        };
                    } else if (resolvedType === 'recap') {
                        const b = block as any;
                        const paras = b.paragraphs;
                        // Split a single content string into 3 bullet points (sentences)
                        let points = b.points;
                        if (!Array.isArray(points) || points.length === 0) {
                            if (Array.isArray(paras) && paras.length > 0) {
                                points = paras;
                            } else if (typeof b.content === 'string' && b.content.trim()) {
                                // Split on ". " boundaries, cap at 3
                                points = b.content.split(/\.\s+/).filter(Boolean).slice(0, 3)
                                    .map((s: string) => s.trim().replace(/\.?$/, '.'));
                            } else if (Array.isArray(b.items) && b.items.length > 0) {
                                points = b.items;
                            }
                        }
                        renderBlock = {
                            ...b,
                            title:  b.title  || b.heading || 'Key Takeaways',
                            points: points || [],
                        };
                    } else if (resolvedType === 'key_terms') {
                        const b = block as any;
                        // Gemini may use terms, key_terms, or keyTerms — normalise to terms
                        const resolvedTerms = Array.isArray(b.terms) ? b.terms
                            : Array.isArray(b.key_terms) ? b.key_terms
                            : Array.isArray(b.keyTerms) ? b.keyTerms
                            : [];
                        renderBlock = {
                            ...b,
                            terms: resolvedTerms,
                        };
                    } else if (resolvedType === 'completion') {
                        const b = block as any;
                        const paras = b.paragraphs;
                        renderBlock = {
                            ...b,
                            skillsEarned: Array.isArray(b.skillsEarned) && b.skillsEarned.length > 0
                                ? b.skillsEarned
                                : Array.isArray(paras) ? paras : [],
                            nextLessonHref,
                        };
                    }

                    // ── Normalise prediction block ───────────────────────
                    if (resolvedType === 'prediction') {
                        const b = renderBlock as any;
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

                    // layout_density drives both max-width and vertical rhythm
                    const density = courseDNA.layout_density;
                    const wideMaxW   = density === 'tight' ? 'max-w-[1280px]' : density === 'spacious' ? 'max-w-[960px]'  : 'max-w-[1140px]';
                    const narrowMaxW = density === 'tight' ? 'max-w-[960px]'  : density === 'spacious' ? 'max-w-[720px]'  : 'max-w-[840px]';
                    const innerWidth  = WIDE_INNER.has(block.type) ? wideMaxW : narrowMaxW;

                    const paddingCls  = COMPACT_PADDING.has(block.type)
                        ? (density === 'tight' ? 'py-3 md:py-4' : density === 'spacious' ? 'py-8 md:py-12' : 'py-6 md:py-8')
                        : NARROW_PADDING.has(block.type)
                        ? (density === 'tight' ? 'py-5 md:py-6' : density === 'spacious' ? 'py-12 md:py-16' : 'py-8 md:py-10')
                        : (density === 'tight' ? 'py-6 md:py-8' : density === 'spacious' ? 'py-14 md:py-20' : 'py-10 md:py-14');

                    // Show a section divider between body blocks, but not adjacent to
                    // structural openers/closers (objective, punch_quote, recap, quiz, etc.)
                    const prevBlock = idx > 0 ? bodyBlocks[idx - 1] : null;
                    const showDivider =
                        idx > 0 &&
                        !SKIP_DIVIDER_TYPES.has(block.type) &&
                        prevBlock != null &&
                        !SKIP_DIVIDER_TYPES.has(prevBlock.type);
                    const dividerNumber = showDivider ? ++sectionDividerCounter : undefined;

                    const blockKey = (block as any).id || `idx-${idx}`;
                    return (
                        <React.Fragment key={`${blockKey}-${idx}`}>
                            {showDivider && <SectionDivider sectionNumber={dividerNumber} dividerColour={lessonAccentColour} />}
                            <section
                                id={`block-${blockKey}`}
                                data-block-type={block.type}
                                style={{
                                    width: '100%',
                                    background: hasSurface ? surfaceBg : 'transparent',
                                    borderTop:    hasSurface ? `1px solid ${surfaceBorder}` : 'none',
                                    borderBottom: hasSurface ? `1px solid ${surfaceBorder}` : 'none',
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
            </div>
        </div>
    );
}
