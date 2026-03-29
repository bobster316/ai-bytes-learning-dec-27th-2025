import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrchestratorV2 } from '@/lib/ai/agent-system-v2';
import { sanitizeBlocks } from '@/lib/ai/content-sanitizer';
import fs from 'fs';
import path from 'path';
import { imageService } from '@/lib/ai/image-service';
import { geminiImageService } from '@/lib/ai/gemini-image-service';
import { veoVideoService } from '@/lib/ai/veo-video-service';
import { generateLessonHTML } from '@/lib/utils/lesson-renderer-v2';
import { videoGenerationService } from '@/lib/services/video-generation';
import {
    safeParse,
    courseGenerationRequestSchema
} from '@/lib/validations/course-generator';
import type { CourseGenerationRequest } from '@/lib/types/course-generator';
import { CourseStateManager } from '@/lib/ai/course-state';
import { generateCourseDNA, deriveDNAFingerprint } from "@/lib/ai/generate-course-dna";
import { MediaGenerationError, normaliseProviderError } from '@/lib/ai/media-errors';
import type { ImageGenerationResult, VideoGenerationResult } from '@/lib/ai/media-errors';
import { conduct, computeModuleMood, updateConductorMemory } from '@/lib/ai/conductor';
import type { ConductorContext, ConductorMemory } from '@/lib/ai/conductor';

const ROUTE_BUDGET_MS = 270_000; // 270 s safety net — throws clean error before Vercel 300 s hard kill

function extractStoragePath(publicUrl: string): string | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    const prefix = `${supabaseUrl}/storage/v1/object/public/course-images/`;
    return publicUrl.startsWith(prefix) ? publicUrl.slice(prefix.length) : null;
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes


// V2 Database Helper Functions
const dbV2 = {
    async createGenerationRecord(supabase: any, courseId: string) {
        const { data, error } = await supabase
            .from('course_generation_progress')
            .insert({
                course_id: courseId,
                status: 'in_progress',
                current_step: 'Initializing V2 Pipeline...',
                progress_percentage: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    },

    async updateGenerationProgress(supabase: any, generationId: string, step: string, percentage: number) {
        await supabase
            .from('course_generation_progress')
            .update({
                current_step: step,
                progress_percentage: percentage,
                updated_at: new Date().toISOString()
            })
            .eq('id', generationId);
    },

    async markGenerationComplete(supabase: any, generationId: string, success: boolean, error?: string) {
        await supabase
            .from('course_generation_progress')
            .update({
                status: success ? 'completed' : 'failed',
                progress_percentage: success ? 100 : undefined,
                error_message: error,
                completed_at: new Date().toISOString()
            })
            .eq('id', generationId);
    },

    // V2 State Machine Specific
    async updateNodeState(supabase: any, courseId: string, nodeId: string, nodeType: string, status: string, error?: string) {
        // Upsert state
        const { error: upsertErr } = await supabase
            .from('generator_node_state')
            .upsert({
                course_id: courseId,
                node_id: nodeId,
                node_type: nodeType,
                status: status,
                error_message: error
            }, { onConflict: 'course_id, node_id' });

        if (upsertErr) {
            console.warn("[API-V2] Failed to update node state:", upsertErr.message);
        }
    }
};

export async function POST(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[API-V2] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! RLS bypass will fail.');
        return NextResponse.json({ success: false, error: 'Configuration Error' }, { status: 500 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validationResult = safeParse(courseGenerationRequestSchema, body);
    if (!validationResult.success) {
        return NextResponse.json({ success: false, errors: validationResult.errors }, { status: 400 });
    }

    const input = validationResult.data as CourseGenerationRequest;
    const DRY_RUN = (body as any).dryRun === true;

    // --- STREAMING SETUP ---
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(message));
    };

    (async () => {
        let generationId: string | null = null;
        let courseId: string | null = null;
        const uploadedStoragePaths: string[] = [];
        const routeStart = Date.now();
        const requestedHost = (input as any).videoSettings?.courseHost || 'sarah';
        const isGemma = requestedHost === 'gemma';

        try {
            await sendEvent({ stage: 'init', message: 'Initializing V2 Enterprise Pipeline...' });

            const { courseName, difficultyLevel, courseDescription, targetDuration } = input;

            // 1. Create Course Shell
            let course = { id: 'mock-course-id-v2', title: courseName };
            if (!DRY_RUN) {
                const { data: c, error: cErr } = await supabase
                    .from('courses')
                    .insert({
                        title: courseName,
                        description: (courseDescription || `A comprehensive course on ${courseName}`) + (isGemma ? ' [gemma]' : ''),
                        difficulty_level: difficultyLevel,
                        published: false,
                        is_micro: true
                    })
                    .select()
                    .single();

                if (cErr) throw cErr;
                course = c;
            }
            courseId = course.id;

            if (!DRY_RUN) {
                generationId = await dbV2.createGenerationRecord(supabase, course.id);
            }

            // Generate and persist CourseDNA — deterministic from course identity
            const courseDNA = generateCourseDNA(course.id, courseName, difficultyLevel);
            const dnaFingerprint = deriveDNAFingerprint(course.id, courseName, difficultyLevel);
            if (!DRY_RUN) {
                const { error: dnaError } = await supabase
                    .from("courses")
                    .update({ course_dna: courseDNA, dna_fingerprint: dnaFingerprint })
                    .eq("id", course.id);
                if (dnaError) {
                    console.warn("[API-V2] CourseDNA persist failed (non-blocking):", dnaError.message);
                }
            }

            // PHASE 2: Initialize Unique Course State
            const courseState = CourseStateManager.getState(courseId, courseName);

            await sendEvent({ stage: 'setup', progress: 5, message: 'V2 Course shell created.' });

            // 2. The Orchestrator V2 (Manifest FIRST)
            const orchestrator = new OrchestratorV2();
            await sendEvent({ stage: 'planning', progress: 10, message: 'Drafting deterministic Course Manifest...' });

            console.time(`[API-V2] Manifest Generation - ${courseName}`);
            const manifest = await orchestrator.generateManifest({
                courseName,
                difficultyLevel,
                courseDescription,
                targetDuration: targetDuration || 60,
                topicCount: (input as any).topicCount,
                lessonsPerTopic: (input as any).lessonsPerTopic
            });
            console.timeEnd(`[API-V2] Manifest Generation - ${courseName}`);

            // 3. Persist Manifest to Database (Topics & Empty Lessons)
            await sendEvent({ stage: 'generating', progress: 20, message: 'Manifest locked. Processing Topics & Lessons sequentially...' });

            // Thumbnail Generation
            const thumbnail = !DRY_RUN && manifest.courseMetadata.thumbnailPrompt
                ? await imageService.fetchCourseThumbnail(courseName, courseDescription, manifest.courseMetadata.thumbnailPrompt)
                : "dry-run.jpg";

            if (!DRY_RUN) {
                const finalDescription = manifest.courseMetadata.description || courseDescription || `A comprehensive course on ${courseName}`;
                await supabase.from('courses').update({
                    thumbnail_url: thumbnail,
                    title: manifest.refinedCourseTitle || courseName,
                    description: isGemma && !finalDescription.toLowerCase().includes('[gemma]')
                        ? finalDescription + ' [gemma]'
                        : finalDescription,
                    category: manifest.courseMetadata.category || null,
                }).eq('id', courseId);
                await dbV2.updateNodeState(supabase, courseId, 'course_root', 'course', 'planned');
            }

            let totalLessons = manifest.topics.reduce((acc, t) => acc + (t.lessons?.length || 0), 0);
            let lessonsProcessed = 0;
            let globalLessonIndex = 1;

            const conductorMemory: ConductorMemory = {
                previousLessonEndIntensity: 0,
                firedSignatureMoments: [],
                recentBlockTypeHistory: [],
            };

            for (let i = 0; i < manifest.topics.length; i++) {
                const topic = manifest.topics[i];
                let topicId = `mock-topic-${i}`;

                if (!DRY_RUN) {
                    const { data: tData, error: tErr } = await supabase.from('course_topics').insert({
                        course_id: courseId,
                        title: topic.topicName,
                        description: topic.description,
                        order_index: i
                    }).select().single();
                    if (tErr) throw tErr;
                    topicId = tData.id;
                    await dbV2.updateNodeState(supabase, courseId, (topic as any).id || `mod_${i}`, 'module', 'planned');
                }

                if (!topic.lessons) continue;

                // Expand Lessons Deterministically
                for (let j = 0; j < topic.lessons.length; j++) {
                    const lessonPlan = topic.lessons[j];
                    const manifestNodeId = (lessonPlan as any).id || `les_${i}_${j}`;

                    const moduleMood = computeModuleMood(i, manifest.topics.length);
                    const conductorCtx: ConductorContext = {
                        lessonIndex: j,
                        totalLessonsInModule: topic.lessons.length,
                        moduleIndex: i,
                        totalModulesInCourse: manifest.topics.length,
                        moduleMood,
                        courseArchetype: courseDNA.content.archetype_id ?? 'clinical',
                        memory: { ...conductorMemory },
                    };
                    const conductorOutput = conduct(conductorCtx);

                    await sendEvent({ stage: 'generating', progress: 20 + Math.floor((lessonsProcessed / Math.max(1, totalLessons)) * 60), message: `Expanding Lesson: ${lessonPlan.lessonTitle}...` });

                    // Route budget check — fail clean before Vercel hard-kills at 300 s
                    {
                        const elapsed = Date.now() - routeStart;
                        if (elapsed > ROUTE_BUDGET_MS) {
                            throw new MediaGenerationError(
                                'veo',
                                'budget_exceeded',
                                `Route budget exceeded before lesson "${lessonPlan.lessonTitle}" (${Math.round(elapsed / 1000)}s elapsed, ${ROUTE_BUDGET_MS / 1000}s limit)`,
                                'video_generation',
                                false,
                                lessonPlan.lessonTitle,
                            );
                        }
                    }

                    if (!DRY_RUN) {
                        await dbV2.updateNodeState(supabase, courseId, manifestNodeId, 'lesson', 'generating');
                    }

                    // V2 Single Lesson Expansion
                    console.time(`[API-V2] Lesson Base Content - ${lessonPlan.lessonTitle}`);
                        let compiledLesson = await orchestrator.processLesson(lessonPlan, topic, manifest, globalLessonIndex, courseState, courseDNA.content, conductorOutput.conductorNotes);
                        // VisualEnrichmentAgent removed: it spent 60–70s per lesson generating 1000-word
                        // image prompts that V3-Sanitizer then overwrote entirely with its MANDATORY mandate.
                        // Image prompts are now the 1–2 sentence descriptions from initial generation,
                        // then sanitised/replaced by V3-Sanitizer if domain-contaminated.
                        console.timeEnd(`[API-V2] Lesson Base Content - ${lessonPlan.lessonTitle}`);

                        // Update Phase 2 Statistics
                        if (compiledLesson.blocks) {
                            compiledLesson.blocks.forEach((b: any) => {
                                if (['full_image', 'flow_diagram', 'concept_illustration', 'image_text_row', 'type_cards', 'interactive_vis'].includes(b.type)) {
                                    courseState.visual_type_counts[b.type] = (courseState.visual_type_counts[b.type] || 0) + 1;
                                }
                                if (b.type === 'video_snippet' && b.video_search_query) {
                                    courseState.video_queries_used.push(b.video_search_query);
                                }
                            });
                        }
                        courseState.domain_history.push(CourseStateManager.getNextDomain(courseState));
                        courseState.structure_history.push(CourseStateManager.getStructure(globalLessonIndex).name);
                        courseState.tone_history.push(CourseStateManager.getTone(globalLessonIndex).name);
                        CourseStateManager.saveState(courseState);

                        // ═══════════════════════════════════════════════════
                        // DOMAIN-STRIPPING POST-PROCESSOR
                        // ═══════════════════════════════════════════════════
                        // The AI sometimes leaks the analogy domain into image/video prompts
                        // despite explicit instructions not to. This programmatic guard
                        // detects and replaces domain-infected prompts with topic-relevant ones.
                        const DOMAIN_KEYWORDS: Record<string, string[]> = {
                            'Culinary': ['chef', 'kitchen', 'cooking', 'recipe', 'ingredient', 'seasoning', 'plating', 'sourdough', 'baking', 'sous chef', 'michelin', 'sushi', 'restaurant', 'culinary', 'oven', 'stove', 'frying pan', 'whisk'],
                            'Nature': ['ecosystem', 'migration', 'erosion', 'forest', 'river', 'ocean', 'wildlife', 'coral reef', 'rainforest', 'savanna', 'sunflower', 'field of flowers', 'beehive', 'pollination', 'waterfall'],
                            // NOTE: 'architect', 'blueprint', 'scaffolding' removed — they substring-match
                            // legitimate AI terms ('transformer architecture', 'model blueprint',
                            // 'scaffolding code') and caused false-positive prompt rewrites.
                            'Architecture': ['cathedral', 'building construction', 'renovation', 'brick laying', 'masonry'],
                            'Music': ['musician', 'orchestra', 'crescendo', 'jazz', 'guitar', 'piano', 'symphony', 'conductor', 'audio engineer', 'sound engineer', 'recording studio', 'mixing console', 'audio effects', 'music producer', 'mixing tracks', 'soundboard', 'turntable', 'vinyl record', 'drum kit', 'bass guitar', 'saxophone', 'trumpet'],
                            'Sports': ['athlete', 'relay race', 'marathon', 'playbook', 'coaching', 'stadium', 'basketball court', 'football field', 'boxing ring', 'swimming pool', 'track field'],
                            'Gardening': ['pruning', 'greenhouse', 'grafting', 'compost', 'irrigation', 'garden', 'planting seeds', 'flower bed', 'watering can', 'trowel', 'potting soil'],
                            'Travel': ['compass', 'lighthouse', 'expedition', 'crossroads', 'harbour', 'ship sailing', 'map navigation', 'suitcase', 'passport', 'boarding pass'],
                            'Craftsmanship': ['potter', 'pottery', 'glassblowing', 'weaving', 'loom', 'mosaic', 'calligraphy', 'calligrapher', 'clay', 'kiln', 'craftsman', 'woodworking', 'ceramic', 'blacksmith', 'forge', 'anvil', 'spinning wheel', 'leather tooling']
                        };

                        let sanitizerRewrites = 0;
                        let sanitizerTotal = 0;
                        const sanitizeVisualPrompt = (prompt: string, lessonTitle: string, courseTitle: string): string => {
                            sanitizerTotal++;
                            const lower = prompt.toLowerCase();
                            // Light-touch correction suffix — added when the prompt needs anchoring but is not garbage
                            const anchor = ` Ensure the subject is the LITERAL technology or real-world application of "${lessonTitle}" — no analogies, no metaphors. Photorealistic or 3D isometric render, deep navy and cyan palette.`;
                            // Full replacement — only used when the prompt is truly unusable (pure analogy domain, no topic reference at all)
                            const replacement = `Photorealistic 3D isometric render of the core technology behind "${lessonTitle}" in the context of ${courseTitle}. Show actual interfaces, hardware, data visualisations, dashboards, or system diagrams. Deep navy and cyan palette, Octane render quality. NO metaphors, NO analogies, NO decorative symbolism — show the literal subject.`;

                            // Check 1: Domain keyword contamination — full replacement (the prompt is off-rails)
                            for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
                                const contaminated = keywords.some(kw => lower.includes(kw));
                                if (contaminated) {
                                    console.warn(`[V3-Sanitizer] ⚠️ Domain leak "${domain}" detected. Rewriting for: "${lessonTitle}"`);
                                    sanitizerRewrites++;
                                    return replacement;
                                }
                            }

                            // Check 2: Metaphor language — light-touch anchor suffix (prompt may still be usable)
                            const METAPHOR_MARKERS = ['like a ', 'as if ', 'metaphor', 'stands for', 'symboliz', 'represents a ', 'is a metaphor'];
                            const hasMetaphor = METAPHOR_MARKERS.some(m => lower.includes(m));
                            if (hasMetaphor) {
                                console.warn(`[V3-Sanitizer] ⚠️ Metaphor language detected in prompt — appending anchor for: "${lessonTitle}"`);
                                sanitizerRewrites++;
                                return prompt + anchor;
                            }

                            // Check 3: Off-topic detection — only fire when NO topic words match at all
                            const STOP_WORDS = new Set(['a','an','the','of','in','to','for','and','or','is','are','how','what','why','when','with','its','from','by','on','at','this','that']);
                            const topicWords = lessonTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w));
                            const matchCount = topicWords.filter(tw => lower.includes(tw)).length;
                            if (matchCount === 0 && topicWords.length >= 2) {
                                console.warn(`[V3-Sanitizer] ⚠️ Off-topic prompt (no topic words matched) — appending anchor for: "${lessonTitle}"`);
                                sanitizerRewrites++;
                                return prompt + anchor;
                            }

                            return prompt;
                        };

                        // ═══════════════════════════════════════════════════
                        // VIDEO GENERATION — start Veo early, run in parallel with images
                        // ═══════════════════════════════════════════════════
                        // Extract video blocks and kick off ALL Veo calls immediately (non-blocking)
                        const videoBlocks = (!DRY_RUN && compiledLesson.blocks)
                            ? (compiledLesson.blocks as any[]).filter((b: any) => (b.type === 'video_snippet' || b.blockType === 'video_snippet') && !b.videoUrl)
                            : [];

                        // Stamp each video block with a stable _veoId before job creation.
                        // Caption-matching is fragile (sanitizer / normalisation can mutate text).
                        // _veoId survives through blocksWithOrder and sanitizeBlocks as an unknown field.
                        videoBlocks.forEach((v: any) => {
                            if (!v._veoId) v._veoId = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                        });

                        type VeoJob = { v: any; rawVideoPrompt: string; videoCaption: string; veoId: string; promise: Promise<VideoGenerationResult> };
                        const veoJobs: VeoJob[] = videoBlocks.map((v: any) => {
                            const rawVideoPrompt = v.videoPrompt || `Show the literal technology of ${lessonPlan.lessonTitle} in action.`;
                            const videoCaption = v.caption || v.title || 'Visual insight';
                            console.log(`[API-V2] 🚀 Starting Veo early for: "${videoCaption}"`);
                            return { v, rawVideoPrompt, videoCaption, veoId: v._veoId, promise: veoVideoService.generateVideo(rawVideoPrompt, videoCaption) };
                        });

                        // Image generation logic (New nested blocks schema)
                        let rawPrompts: Array<{ ref: any; prompt: string; isHero?: boolean; slotLabel?: string; blockType?: string }> = [];
                        const lt = lessonPlan.lessonTitle;
                        const ct = courseName;

                        if (!DRY_RUN && compiledLesson.blocks) {
                            compiledLesson.blocks.forEach((block: any) => {
                                const type = block.type || block.blockType;
                                if (type === 'lesson_header' && block.heroPrompt) {
                                    rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.heroPrompt, lt, ct), isHero: true, slotLabel: 'hero_image', blockType: 'lesson_header' } as any);
                                } else if (type === 'full_image' && block.imagePrompt) {
                                    rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'full_image', blockType: 'full_image' });
                                } else if (type === 'image_text_row' && block.imagePrompt) {
                                    rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'image_text_row', blockType: 'image_text_row' });
                                } else if (type === 'concept_illustration' && block.imagePrompt) {
                                    rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'concept_illustration', blockType: 'concept_illustration' });
                                } else if (type === 'type_cards' && block.cards) {
                                    block.cards.forEach((card: any, cardIdx: number) => {
                                        if (card.imagePrompt) rawPrompts.push({ ref: card, prompt: sanitizeVisualPrompt(card.imagePrompt, lt, ct), slotLabel: `type_card_${cardIdx + 1}`, blockType: 'type_cards' });
                                    });
                                } else if (type === 'industry_tabs' && block.tabs) {
                                    block.tabs.forEach((tab: any, tabIdx: number) => {
                                        if (tab.imagePrompt) rawPrompts.push({ ref: tab, prompt: sanitizeVisualPrompt(tab.imagePrompt, lt, ct), slotLabel: `industry_tab_${tabIdx + 1}`, blockType: 'industry_tabs' });
                                    });
                                } else if (type === 'quiz' && block.questions) {
                                    block.questions.forEach((q: any, qIdx: number) => {
                                        if (q.imageContext?.imagePrompt) rawPrompts.push({ ref: q.imageContext, prompt: sanitizeVisualPrompt(q.imageContext.imagePrompt, lt, ct), slotLabel: `quiz_image_${qIdx + 1}`, blockType: 'quiz' });
                                    });
                                }
                            });
                        }

                        // Pure Generative Image strategy:
                        // ALL static image prompts (full_image, type_cards, etc) go to Gemini quality
                        let allFetchedImages: any[] = [];

                        if (!DRY_RUN && rawPrompts.length > 0) {
                            const baseProgress = 20 + Math.floor((lessonsProcessed / Math.max(1, totalLessons)) * 55);
                            await sendEvent({ stage: 'generating', progress: baseProgress, message: `🖼️ Generating ${rawPrompts.length} images for "${lessonPlan.lessonTitle}"...` });
                            console.time(`[API-V2] Image Fetching (${rawPrompts.length} total) - ${lessonPlan.lessonTitle}`);

                            const generatedImages = await Promise.all(
                                rawPrompts.map(async (p, idx) => {
                                    const seed = globalLessonIndex * 10 + idx;
                                    const emptyResult: ImageGenerationResult = { url: null, alt: null, caption: null, errorCode: 'generation_skipped', errorMessage: 'generation_skipped' };
                                    let result: ImageGenerationResult;
                                    try {
                                        result = await geminiImageService.generateImage(p.prompt, seed);
                                    } catch (e: any) {
                                        console.warn(`[API-V2] ⚠️ Image slot "${(p as any).slotLabel}" threw unexpectedly: ${e?.message || e} — skipping slot`);
                                        return emptyResult;
                                    }

                                    // content_policy_violation: retry once with a safe fallback prompt
                                    // GeminiImageService always returns errorCode:'empty_result' from its catch — normalise first
                                    const rawNorm = !result.url ? normaliseProviderError(result.errorMessage || 'unknown') : null;
                                    if (!result.url && rawNorm?.errorCode === 'content_policy_violation') {
                                        const fallbackPrompt = `3D isometric render of ${lessonPlan.lessonTitle} — technical interface, deep navy and cyan colour palette, Octane render quality, no text, no people`;
                                        console.warn(`[API-V2] ⚠️ Image blocked (slot: ${(p as any).slotLabel}) — retrying with fallback prompt`);
                                        try {
                                            result = await geminiImageService.generateImage(fallbackPrompt, seed + 1000);
                                        } catch (e: any) {
                                            console.warn(`[API-V2] ⚠️ Fallback image for slot "${(p as any).slotLabel}" also threw: ${e?.message || e} — skipping slot`);
                                            return emptyResult;
                                        }
                                    }

                                    if (!result.url) {
                                        const { errorCode } = normaliseProviderError(result.errorMessage || 'unknown');
                                        console.warn(`[API-V2] ⚠️ Image slot "${(p as any).slotLabel}" failed permanently (${errorCode}) — skipping slot, continuing generation`);
                                        return result; // url: null — block renders without image, course is preserved
                                    }
                                    return result;
                                })
                            );

                            console.timeEnd(`[API-V2] Image Fetching (${rawPrompts.length} total) - ${lessonPlan.lessonTitle}`);
                            if (sanitizerTotal > 0) {
                                const rewriteRate = sanitizerRewrites / sanitizerTotal;
                                if (rewriteRate > 0.3) {
                                    console.warn(`[V3-Sanitizer] 🚨 High rewrite rate: ${sanitizerRewrites}/${sanitizerTotal} prompts rewritten (${Math.round(rewriteRate * 100)}%) — generator is producing off-topic or metaphor-heavy image prompts. Check LESSON_VOICE_GUIDE adherence.`);
                                } else {
                                    console.log(`[V3-Sanitizer] ✅ Rewrite rate: ${sanitizerRewrites}/${sanitizerTotal} (${Math.round(rewriteRate * 100)}%)`);
                                }
                            }

                            // Map URLs back into block objects
                            generatedImages.forEach((img, idx) => {
                                if (rawPrompts[idx] && img.url) {
                                    rawPrompts[idx].ref.imageUrl = img.url;
                                    if ((rawPrompts[idx] as any).isHero) {
                                        rawPrompts[idx].ref.heroImageUrl = img.url;
                                    }
                                }
                            });

                            allFetchedImages = [...generatedImages];

                            allFetchedImages.forEach(img => {
                                if (img?.url) {
                                    if (!courseState.used_image_urls.includes(img.url)) {
                                        courseState.used_image_urls.push(img.url);
                                    }
                                    const storagePath = extractStoragePath(img.url);
                                    if (storagePath) uploadedStoragePaths.push(storagePath);
                                }
                            });
                            CourseStateManager.saveState(courseState);
                        }

                        // ═══════════════════════════════════════════════════
                        // VIDEO — fire-and-forget with DB write-back
                        // Veo jobs run in background. Lesson saves immediately with
                        // video_url: null. When Veo resolves, the background handler
                        // patches the matching video_snippet block in DB directly.
                        // ═══════════════════════════════════════════════════
                        // Shared ref: populated after DB insert so background handler
                        // knows which lesson row to patch.
                        const lessonIdRef: { id: string | null } = { id: null };

                        if (!DRY_RUN && veoJobs.length > 0) {
                            console.log(`[API-V2] 🚀 ${veoJobs.length} Veo job(s) running in background — saving lesson now`);
                            veoJobs.forEach(job => {
                                job.promise
                                    .then(async result => {
                                        if (!result.url) {
                                            console.warn(`[API-V2] Veo failed (background): ${result.errorMessage || 'unknown'}`);
                                            return;
                                        }
                                        console.log(`[API-V2] 🎬 Veo completed (background): ${result.url}`);
                                        if (!lessonIdRef.id) return; // DRY_RUN or save failed

                                        // Fetch the saved blocks and patch the matching video_snippet
                                        const { data: saved } = await supabase
                                            .from('course_lessons')
                                            .select('content_blocks')
                                            .eq('id', lessonIdRef.id)
                                            .single();
                                        if (!saved?.content_blocks) return;

                                        let patched = false;
                                        const updatedBlocks = (saved.content_blocks as any[]).map((b: any) => {
                                            if (patched || b.type !== 'video_snippet' || b.videoUrl) return b;
                                            // Match by stable _veoId first; fall back to caption text
                                            const matchById = job.veoId && b._veoId === job.veoId;
                                            const matchByCaption = !job.veoId && (b.caption === job.videoCaption || b.title === job.videoCaption);
                                            if (matchById || matchByCaption) {
                                                patched = true;
                                                return { ...b, videoUrl: result.url };
                                            }
                                            return b;
                                        });

                                        if (patched) {
                                            await supabase
                                                .from('course_lessons')
                                                .update({ content_blocks: updatedBlocks })
                                                .eq('id', lessonIdRef.id);
                                            console.log(`[API-V2] ✅ Veo URL written to lesson ${lessonIdRef.id} (id: "${job.veoId}")`);
                                        } else {
                                            console.warn(`[API-V2] Veo URL could not be matched to a block — use Block Vid to attach manually (id: "${job.veoId}", caption: "${job.videoCaption}")`);
                                        }
                                    })
                                    .catch(err => {
                                        console.warn(`[API-V2] Veo error (background): ${err?.message || err}`);
                                    });
                            });
                        }

                        CourseStateManager.saveState(courseState);

                        // Save lesson
                        if (!DRY_RUN) {
                            console.time(`[API-V2] Database Save - ${lessonPlan.lessonTitle}`);
                            // Normalise block type: generator outputs { type: "text", block_type: "lesson_header" }
                            // The renderer switches on block.type, so promote block_type → type before saving.
                            const blocksWithOrder = (compiledLesson.blocks || []).map((b: any, idx: number) => {
                                const resolvedType = b.block_type || b.blockType || b.type;
                                return { ...b, type: resolvedType, order: b.order ?? idx };
                            });

                            const cleanBlocks = sanitizeBlocks(blocksWithOrder);
                            const fullHtml = generateLessonHTML({ ...compiledLesson, blocks: cleanBlocks, lessonTitle: lessonPlan.lessonTitle } as any);
                            const { data: lData, error: lErr } = await supabase.from('course_lessons').insert({
                                topic_id: topicId,
                                title: lessonPlan.lessonTitle,
                                content_blocks: cleanBlocks,
                                content_markdown: JSON.stringify({
                                    ...compiledLesson,
                                    instructor: requestedHost
                                }),
                                content_html: fullHtml,
                                thumbnail_url: allFetchedImages.length > 0 ? allFetchedImages[0].url : null,
                                order_index: j,
                                estimated_minutes: lessonPlan.estimatedDuration || 15,
                                micro_objective: lessonPlan.microObjective,
                                arc_type: conductorOutput.arcType,
                                lesson_personality: conductorOutput.lessonPersonality,
                                micro_variation_seed: conductorOutput.microVariationSeed,
                                conductor_memory: conductorCtx.memory,
                            }).select().single();
                            if (lErr) throw lErr;

                            // Give background Veo handlers the lesson ID so they can write URLs back
                            lessonIdRef.id = lData.id;

                            const actualBlockTypes = cleanBlocks.map((b: any) => b.type as string);
                            const signatureMomentFired = conductorOutput.signatureMoment?.type != null
                                && actualBlockTypes.includes(conductorOutput.signatureMoment.type)
                                ? conductorOutput.signatureMoment.type
                                : null;
                            updateConductorMemory(conductorMemory, actualBlockTypes, signatureMomentFired);

                            if (allFetchedImages.length > 0) {
                                await supabase.from('lesson_images').insert(allFetchedImages.map((img: any, idx: number) => ({
                                    lesson_id: lData.id,
                                    image_url: img.url,
                                    order_index: idx,
                                    source: 'ai_generated'
                                })));
                            }

                            // Audio overview generated on-demand via admin → Generate Audio (ElevenLabs/Sterling)
                            // gemini-2.5-flash-preview-tts removed — model returns undefined candidates

                            await dbV2.updateNodeState(supabase, courseId, manifestNodeId, 'lesson', 'published');
                            console.timeEnd(`[API-V2] Database Save - ${lessonPlan.lessonTitle}`);

                            // Note: No per-lesson avatar videos — only 1 avatar video per course (the course intro).
                            // Lesson avatar videos are excessive (ElevenLabs + HeyGen credits per lesson) and
                            // violate the design rule: avatar appears on the course overview page only.
                        }

                    lessonsProcessed++;
                    globalLessonIndex++;
                }
                if (!DRY_RUN) await dbV2.updateNodeState(supabase, courseId, (topic as any).id || `mod_${i}`, 'module', 'published');
            }

            if (!DRY_RUN) {
                await dbV2.updateNodeState(supabase, courseId, 'course_root', 'course', 'published');
            }

            // 4. AI Avatar Integration - Course Intro Video
            // Gated by ENABLE_HEYGEN_AVATAR=true. Set to false (or omit) to skip during
            // troubleshooting or when HeyGen credits are exhausted. Re-enable by setting
            // ENABLE_HEYGEN_AVATAR=true in .env.local — no other code change needed.
            const heygenEnabled = process.env.ENABLE_HEYGEN_AVATAR === 'true';
            if (!DRY_RUN && heygenEnabled && (manifest as any).introVideoScript) {
                await sendEvent({ stage: 'videos', progress: 95, message: '🎬 Queuing cinematic AI intro video...' });
                try {
                    const videoRequests = [{
                        type: 'course_introduction' as const,
                        entityId: courseId,
                        script: (manifest as any).introVideoScript,
                        avatar: requestedHost as 'sarah' | 'gemma'
                    }];

                    const videoResults = await videoGenerationService.triggerCourseVideoBatch(courseId, manifest.refinedCourseTitle || courseName, videoRequests, {
                        useHeyGen: true,
                        checkQuota: true
                    });

                    const jobId = videoResults[courseId];
                    if (jobId) {
                        await supabase.from('courses').update({
                            intro_video_job_id: jobId,
                            intro_video_status: 'queued'
                        }).eq('id', courseId);
                        console.log(`[API-V2] ✅ Course Intro Video Job ID saved: ${jobId}`);
                    }
                } catch (vErr) {
                    console.error("[API-V2] Video generation trigger failed:", vErr);
                }
            } else if (!DRY_RUN && !heygenEnabled) {
                console.log('[API-V2] HeyGen avatar generation skipped (temporarily disabled — set ENABLE_HEYGEN_AVATAR=true to re-enable)');
            }

            await sendEvent({ stage: 'completed', progress: 100, message: 'V2 Generation Complete!', courseId: courseId });

        } catch (error: any) {
            const isMediaError = error instanceof MediaGenerationError;

            // Client disconnect (curl timeout, browser close, Vercel stream cut) — do NOT rollback.
            // Any lessons already saved are valid and should stand. The generation simply stopped early.
            const isClientDisconnect =
                error?.name === 'ResponseAborted' ||
                error?.message?.includes('ResponseAborted') ||
                error?.code === 'ERR_HTTP_HEADERS_SENT' ||
                error?.message?.includes('write after end');

            if (isClientDisconnect) {
                console.warn(`[API-V2] Client disconnected mid-generation — preserving saved lessons. Course: ${courseId}`);
                return;
            }

            // Full internal log — always log the raw error
            console.error('[API-V2] ❌ Generation failed:', error.stack || error.message || error);
            try {
                fs.appendFileSync(
                    path.join(process.cwd(), 'v2-error.log'),
                    `${new Date().toISOString()} ${error.stack || error.message}\n`
                );
            } catch (_) { /* log write failure is non-fatal */ }

            // --- ROLLBACK: DB ---
            if (courseId && !DRY_RUN) {
                console.log(`[API-V2] Rolling back course ${courseId}...`);
                const { error: deleteErr } = await supabase
                    .from('courses')
                    .delete()
                    .eq('id', courseId);
                if (deleteErr) {
                    console.error('[API-V2] Rollback: DB delete failed (secondary error):', deleteErr.message);
                } else {
                    console.log(`[API-V2] Rollback: course ${courseId} and all descendants deleted.`);
                }
            }

            // --- ROLLBACK: Storage (best-effort) ---
            if (uploadedStoragePaths.length > 0 && !DRY_RUN) {
                console.log(`[API-V2] Rollback: cleaning up ${uploadedStoragePaths.length} uploaded storage file(s)...`);
                const { error: storageErr } = await supabase.storage
                    .from('course-images')
                    .remove(uploadedStoragePaths);
                if (storageErr) {
                    console.error('[API-V2] Rollback: Storage cleanup failed (secondary error):', storageErr.message);
                } else {
                    console.log('[API-V2] Rollback: storage cleanup complete.');
                }
            }

            // Mark generation progress record as failed
            if (generationId && !DRY_RUN) {
                await dbV2.markGenerationComplete(supabase, generationId, false, error.message);
            }

            // Stream normalised error to client — do NOT stream raw provider errors
            await sendEvent({
                stage: 'error',
                api: isMediaError ? error.api : 'generation',
                errorCode: isMediaError ? error.errorCode : 'internal_error',
                message: isMediaError
                    ? error.message
                    : 'Course generation failed — internal error. Check server logs.',
                retryable: isMediaError ? error.retryable : false,
                lessonTitle: isMediaError ? error.lessonTitle : undefined,
                blockType: isMediaError ? error.blockType : undefined,
                slotLabel: isMediaError ? error.slotLabel : undefined,
            });
        } finally {
            try { await writer.close(); } catch { /* already closed by client disconnect */ }
        }
    })();

    return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
}
