/**
 * ultimate_heal.ts — Global Visual & Content Enrichment Pipeline
 *
 * Heals ALL V2 lessons (those with content_blocks) to "Enterprise Technical" standard:
 *   - Key terms expanded to 6-8 expert definitions
 *   - Recap points refined to punchy 10-12 word insights
 *   - Hero/lesson_header images regenerated (Gemini generative art)
 *   - Video snippets fetched via waterfall (Pexels / Mixkit fallback)
 *   - Full image / image_text_row / applied_case / concept_illustration images regenerated
 *   - Short text blocks (< 500 chars) expanded to 3-4 expert paragraphs
 *   - Type card images regenerated
 *
 * Usage:
 *   npx tsx ultimate_heal.ts                     # heal all remaining lessons
 *   npx tsx ultimate_heal.ts --course=772        # heal only one course
 *   npx tsx ultimate_heal.ts --limit=10          # heal first 10 unhealed lessons only
 *   DRY_RUN=true npx tsx ultimate_heal.ts        # preview without writing to DB
 *
 * Progress is tracked in .data/heal_progress.json — safe to re-run, skips already-healed lessons.
 */

import { geminiImageService } from './lib/ai/gemini-image-service';
import { videoService } from './lib/ai/video-service';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN   = process.env.DRY_RUN === 'true';
const COURSE_ID = process.argv.find(a => a.startsWith('--course='))?.split('=')[1];
const LIMIT     = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '0') || 0;

// Already-healed lessons from previous pilot sessions
const ALREADY_HEALED = new Set(['3567', '3568']);

// Progress file — tracks completed lesson IDs across runs
const PROGRESS_FILE = path.join('.data', 'heal_progress.json');

// Delay between lessons (ms) — respects Gemini API rate limits
const LESSON_DELAY_MS = 3000;
// Delay between individual API calls within a lesson (ms)
const CALL_DELAY_MS = 500;

// ── Progress persistence ──────────────────────────────────────────────────────
function loadProgress(): Set<string> {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
            return new Set(data.healed ?? []);
        }
    } catch { /* ignore */ }
    return new Set();
}

function saveProgress(healed: Set<string>) {
    try {
        fs.mkdirSync('.data', { recursive: true });
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ healed: [...healed], updatedAt: new Date().toISOString() }, null, 2));
    } catch (e) {
        console.warn('⚠️  Could not save progress file:', e);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Core heal logic ───────────────────────────────────────────────────────────
async function healLesson(lessonId: string, healed: Set<string>): Promise<boolean> {
    console.log(`\n🚀 [${lessonId}] Starting ULTIMATE HEAL`);

    const { data: lesson, error: fetchErr } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

    if (fetchErr || !lesson) {
        console.error(`   ❌ [${lessonId}] Fetch failed:`, fetchErr?.message ?? 'Not found');
        return false;
    }

    if (!Array.isArray(lesson.content_blocks) || lesson.content_blocks.length === 0) {
        console.log(`   ⏭️  [${lessonId}] No content_blocks — skipping`);
        return false;
    }

    let blocks = lesson.content_blocks as any[];
    let updated = false;

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const blockSeed = parseInt(lessonId) * 1000 + i * 10;

        // 1. Content Enrichment: Key Terms
        if (b.type === 'key_terms') {
            const currentTerms = b.terms || [];
            console.log(`   📝 [${i}] key_terms — enriching (${currentTerms.length} existing)`);

            const enrichmentPrompt = `As a technical AI expert, take these key terms and expand them into a comprehensive glossary of 6-8 terms.
For each term, provide a 3-4 sentence definition that is technically accurate and professional.
Current terms: ${currentTerms.map((t: any) => (typeof t === 'string' ? t : t.term)).join(', ')}
Subject: ${lesson.title}

Return ONLY a JSON array of objects with "term" and "definition" fields. No markdown, no wrappers.`;

            const enrichedJson = await geminiImageService.generateText(enrichmentPrompt, 0.5);
            await sleep(CALL_DELAY_MS);
            if (enrichedJson) {
                try {
                    const newTerms = JSON.parse(enrichedJson.replace(/```json|```/g, '').trim());
                    if (Array.isArray(newTerms) && newTerms.length >= 5) {
                        b.terms = newTerms;
                        updated = true;
                        console.log(`      ✅ ${newTerms.length} terms enriched`);
                    }
                } catch { console.error('      ❌ Failed to parse key_terms JSON'); }
            }
        }

        // 2. Content Enrichment: Recap points
        if (b.type === 'recap' || b.type === 'takeaways') {
            const currentPoints = b.points || b.items || [];
            console.log(`   📝 [${i}] recap — refining ${currentPoints.length} points`);

            const recapPrompt = `Take these recap points and transform them into 3-5 punchy, expert-level technical takeaways.
Each takeaway MUST be exactly 1 sentence, ~10-12 words maximum.
Current points: ${currentPoints.join(' | ')}
Subject: ${lesson.title}

Return ONLY a JSON array of strings. No markdown.`;

            const enrichedPoints = await geminiImageService.generateText(recapPrompt, 0.7);
            await sleep(CALL_DELAY_MS);
            if (enrichedPoints) {
                try {
                    const newPoints = JSON.parse(enrichedPoints.replace(/```json|```/g, '').trim());
                    if (Array.isArray(newPoints) && newPoints.length > 0) {
                        b.points = newPoints;
                        updated = true;
                        console.log(`      ✅ ${newPoints.length} recap points refined`);
                    }
                } catch { console.error('      ❌ Failed to parse recap JSON'); }
            }
        }

        // 3. Visual: Hero / lesson_header image
        if (b.type === 'hero' || b.type === 'lesson_header') {
            console.log(`   🎨 [${i}] ${b.type} — regenerating hero image`);
            const prompt = b.heroPrompt || b.imagePrompt
                || `Technical enterprise hero image for AI lesson: ${b.title || lesson.title}. Abstract server infrastructure, neural network visualization, code syntax on dark background. No people, no teachers, no classrooms.`;
            const img = await geminiImageService.generateImage(prompt, blockSeed);
            await sleep(CALL_DELAY_MS);
            if (img?.url) {
                b.imageUrl = img.url;
                b.image_url = img.url;
                updated = true;
                console.log(`      ✅ Hero image generated`);
            }
        }

        // 4. Visual: Video snippets
        if (b.type === 'video_snippet') {
            // Only re-fetch if missing or placeholder
            const hasVideo = b.videoUrl || b.video_url;
            if (!hasVideo) {
                console.log(`   🎬 [${i}] video_snippet — fetching "${b.title || 'Untitled'}"`);
                const query = b.videoPrompt || b.video_search_query || b.title;
                const domain = lesson.domain || 'Technology';
                const video = await videoService.fetchVideoWaterfall(query, domain);
                await sleep(CALL_DELAY_MS);
                if (video?.url) {
                    b.videoUrl = video.url;
                    b.video_url = video.url;
                    updated = true;
                    console.log(`      ✅ Video fetched (${video.source})`);
                }
            }
        }

        // 5. Visual: Static image blocks (including concept_illustration)
        const IMAGE_BLOCK_TYPES = new Set([
            'image_text_row', 'full_image', 'applied_case',
            'full-image-section', 'concept_illustration',
        ]);
        if (b.imagePrompt && IMAGE_BLOCK_TYPES.has(b.type)) {
            console.log(`   🎨 [${i}] ${b.type} — regenerating image`);
            const img = await geminiImageService.generateImage(b.imagePrompt, blockSeed);
            await sleep(CALL_DELAY_MS);
            if (img?.url) {
                b.imageUrl = img.url;
                b.image_url = img.url;
                updated = true;
                console.log(`      ✅ Image generated`);
            }
        }

        // 6. Content Quality: Text block micro-learning trim/fix
        // Rules: max 2 short paragraphs, 80-120 words, no wall-text
        if (b.type === 'text' || b.type === 'image_text_row') {
            const currentText = b.text || b.content || '';
            // Fix if empty/too short (<80 chars) OR too long (>800 chars — wall-text)
            const needsFix = currentText.length > 0 && (currentText.length < 80 || currentText.length > 800);
            if (needsFix) {
                console.log(`   📝 [${i}] ${b.type} — rewriting text (${currentText.length} chars, target: 80-800)`);
                const textPrompt = `You are writing content for a MICRO-LEARNING platform. Lessons must be bite-sized.

STRICT RULES:
- Maximum 2 short paragraphs total
- Each paragraph: 2-3 sentences only
- Total word count: 80-120 words maximum
- Tone: expert, direct, no filler words
- No bullet points, no headings — just clean prose
- Preserve the core technical insight

Section title: "${b.title || lesson.title}"
${currentText.length < 80 ? `Topic to write about: ${b.title || lesson.title}` : `Existing text to condense:\n${currentText}`}

Return ONLY the final text. No markdown, no commentary.`;

                const rewrittenText = await geminiImageService.generateText(textPrompt, 0.6);
                await sleep(CALL_DELAY_MS);
                if (rewrittenText && rewrittenText.length >= 80 && rewrittenText.length <= 1200) {
                    b.text = rewrittenText;
                    b.content = rewrittenText;
                    updated = true;
                    console.log(`      ✅ Text rewritten: ${rewrittenText.length} chars`);
                }
            }
        }

        // 7. Visual: Type card images
        if (b.type === 'type_cards' && b.cards) {
            console.log(`   🎨 [${i}] type_cards — regenerating ${b.cards.length} card images`);
            for (let j = 0; j < b.cards.length; j++) {
                const card = b.cards[j];
                const cardSeed = blockSeed + j;
                if (card.imagePrompt || card.title) {
                    const prompt = card.imagePrompt
                        || `Technical abstract visual for: ${card.title}. Enterprise AI context, no people.`;
                    const img = await geminiImageService.generateImage(prompt, cardSeed);
                    await sleep(CALL_DELAY_MS);
                    if (img?.url) {
                        card.imageUrl = img.url;
                        updated = true;
                        console.log(`      ✅ Card ${j + 1}/${b.cards.length} image generated`);
                    }
                }
            }
        }
    }

    // Persist to DB
    if (updated) {
        if (DRY_RUN) {
            console.log(`   🔍 [DRY RUN] Would update lesson ${lessonId} — ${blocks.length} blocks processed`);
        } else {
            const { error } = await supabase
                .from('course_lessons')
                .update({ content_blocks: blocks })
                .eq('id', lessonId);
            if (error) {
                console.error(`   ❌ [${lessonId}] DB write failed:`, error.message);
                return false;
            }
            console.log(`   🎉 [${lessonId}] HEALED & SAVED`);
        }
        healed.add(lessonId);
        saveProgress(healed);
    } else {
        console.log(`   ⏭️  [${lessonId}] No changes needed`);
        healed.add(lessonId);
        saveProgress(healed);
    }

    return true;
}

// ── Global rollout ────────────────────────────────────────────────────────────
async function run() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ULTIMATE HEAL — Global V2 Lesson Rollout');
    console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
    if (COURSE_ID) console.log(`  Scope: Course ${COURSE_ID} only`);
    if (LIMIT)     console.log(`  Limit: First ${LIMIT} unhealed lessons`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Load progress (already-healed lessons from prior runs)
    const healed = loadProgress();
    // Merge in the original pilot lessons
    ALREADY_HEALED.forEach(id => healed.add(id));
    console.log(`📂 Progress file: ${healed.size} lessons already healed\n`);

    // Query all V2 lessons (those with content_blocks populated)
    let query = supabase
        .from('course_lessons')
        .select('id, title, topic_id')
        .not('content_blocks', 'is', null)
        .order('id', { ascending: true });

    // Optional: scope to one course via topic lookup
    if (COURSE_ID) {
        const { data: topicIds } = await supabase
            .from('course_topics')
            .select('id')
            .eq('course_id', COURSE_ID);
        if (topicIds && topicIds.length > 0) {
            query = query.in('topic_id', topicIds.map((t: any) => t.id));
        }
    }

    const { data: allLessons, error } = await query;
    if (error || !allLessons) {
        console.error('❌ Failed to fetch lessons:', error?.message);
        return;
    }

    // Filter out already-healed
    const pending = allLessons.filter((l: any) => !healed.has(String(l.id)));
    const toProcess = LIMIT > 0 ? pending.slice(0, LIMIT) : pending;

    console.log(`📊 Found ${allLessons.length} V2 lessons total`);
    console.log(`   ${allLessons.length - pending.length} already healed`);
    console.log(`   ${toProcess.length} to process this run`);
    if (LIMIT && pending.length > LIMIT) {
        console.log(`   (${pending.length - LIMIT} more remain after this run)\n`);
    }

    if (toProcess.length === 0) {
        console.log('\n✅ All lessons already healed! Nothing to do.');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const lesson = toProcess[i];
        const lessonId = String(lesson.id);
        const progress = `[${i + 1}/${toProcess.length}]`;

        console.log(`\n${progress} Lesson ${lessonId}: "${lesson.title}"`);

        try {
            const ok = await healLesson(lessonId, healed);
            if (ok) successCount++; else failCount++;
        } catch (err: any) {
            console.error(`   💥 [${lessonId}] Unexpected error:`, err?.message ?? err);
            failCount++;
        }

        // Rate-limit delay between lessons (skip after last)
        if (i < toProcess.length - 1) {
            console.log(`   ⏳ Waiting ${LESSON_DELAY_MS / 1000}s before next lesson...`);
            await sleep(LESSON_DELAY_MS);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  ROLLOUT COMPLETE`);
    console.log(`  ✅ Healed: ${successCount}  ❌ Failed: ${failCount}`);
    const remaining = pending.length - toProcess.length;
    if (remaining > 0) {
        console.log(`  ⏭️  ${remaining} lessons still pending — re-run to continue`);
    } else {
        console.log(`  🏁 ALL LESSONS PROCESSED`);
    }
    console.log('═══════════════════════════════════════════════════════════\n');
}

run().catch(err => {
    console.error('\n💥 FATAL ERROR:', err);
    process.exit(1);
});
