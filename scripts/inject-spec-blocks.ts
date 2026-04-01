/**
 * inject-spec-blocks.ts
 *
 * Upgrades legacy lessons to Universal Lesson Spec v1.0.
 * Targets only lessons where schema_version IS NULL OR schema_version < '2.0'.
 *
 * Run:  npx tsx scripts/inject-spec-blocks.ts          (dry-run)
 *       npx tsx scripts/inject-spec-blocks.ts --apply  (write to DB)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { validateLessonPedagogy, repairLessonSequence } from '../lib/ai/content-sanitizer';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes('--apply');

// ── Definitional sentence detection ──────────────────────────────────────────
const DEFINITIONAL_PATTERN = /^([\w\s]+ is |a [\w\s]+ is |the [\w\s]+ is |[\w\s]+ refers to )/i;
const GENERIC_SENTENCE_PATTERN = /^(in the next section|as we have seen|as mentioned|to summarise|in summary|this section)/i;

// ── Smart extraction: try to find a good hook from existing blocks ────────────
function extractHook(blocks: any[]): { block: any; removeSourceAt?: number } | null {
    const first = blocks[0];
    if (first && (first.type === 'callout' || first.type === 'punch_quote')) {
        const content = first.body || first.quote || first.text || '';
        if (!content) return null;
        const hookStyle = content.trim().endsWith('?') ? 'question'
            : /\d/.test(content) ? 'statistic'
            : 'scenario';
        return {
            block: { type: 'hook', content, hook_style: hookStyle, analytics_tag: 'hook', backfill_injected: true },
            removeSourceAt: 0,
        };
    }

    const firstCore = blocks.find(b => b.type === 'core_explanation' || b.type === 'text');
    if (firstCore) {
        const paragraphs: string[] = firstCore.paragraphs ?? [];
        const firstPara = paragraphs[0] ?? '';
        const sentences = firstPara.split(/(?<=[.!?])\s+/);
        const firstSentence = sentences[0]?.trim() ?? '';
        if (
            firstSentence.length > 20 &&
            sentences.length >= 2 &&
            !DEFINITIONAL_PATTERN.test(firstSentence)
        ) {
            const hookStyle = firstSentence.endsWith('?') ? 'question' : 'scenario';
            return {
                block: { type: 'hook', content: firstSentence, hook_style: hookStyle, analytics_tag: 'hook', backfill_injected: true },
            };
        }
    }

    return null;
}

// ── Smart extraction: try to find a good teaching_line ───────────────────────
function extractTeachingLine(blocks: any[]): { block: any; removeSourceAt?: number } | null {
    const pqIdx = blocks.findIndex(b => b.type === 'punch_quote');
    if (pqIdx !== -1) {
        const pq = blocks[pqIdx];
        const line = pq.quote ?? '';
        const support = pq.attribution ?? '';
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount >= 4 && wordCount <= 25 && !line.endsWith(':') && !GENERIC_SENTENCE_PATTERN.test(line)) {
            return {
                block: { type: 'teaching_line', line, support, analytics_tag: 'teaching_line', backfill_injected: true },
                removeSourceAt: pqIdx,
            };
        }
    }

    const lastCoreIdx = blocks.reduce((best: number, b: any, i: number) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
    if (lastCoreIdx !== -1) {
        const core = blocks[lastCoreIdx];
        const paragraphs: string[] = core.paragraphs ?? [];
        const lastPara = paragraphs[paragraphs.length - 1] ?? '';
        const sentences = lastPara.split(/(?<=[.!?])\s+/);
        const lastSentence = sentences[sentences.length - 1]?.trim() ?? '';
        const wordCount = lastSentence.split(/\s+/).length;
        if (
            wordCount >= 4 &&
            wordCount <= 25 &&
            !lastSentence.endsWith(':') &&
            !GENERIC_SENTENCE_PATTERN.test(lastSentence) &&
            !DEFINITIONAL_PATTERN.test(lastSentence)
        ) {
            return {
                block: { type: 'teaching_line', line: lastSentence, support: '', analytics_tag: 'teaching_line', backfill_injected: true },
            };
        }
    }

    return null;
}

// ── Main lesson processor ─────────────────────────────────────────────────────
async function processLesson(lesson: any): Promise<{ changed: boolean; reason?: string }> {
    let blocks: any[] = [];
    try {
        blocks = Array.isArray(lesson.content_blocks)
            ? lesson.content_blocks
            : typeof lesson.content_blocks === 'string'
                ? JSON.parse(lesson.content_blocks)
                : [];
    } catch { return { changed: false, reason: 'could not parse content_blocks' }; }

    const types = new Set(blocks.map((b: any) => b.type as string));
    const missing: string[] = [];
    if (!types.has('hook'))              missing.push('hook');
    if (!types.has('teaching_line'))     missing.push('teaching_line');
    if (!types.has('mental_checkpoint')) missing.push('mental_checkpoint');

    if (missing.length === 0) {
        const validation = validateLessonPedagogy(blocks, 'standard');
        if (APPLY) {
            await supabase.from('course_lessons').update({
                schema_version: '2.0',
                pedagogical_spec_version: '1.0',
                spec_compliant: validation.valid,
                spec_migrated: true,
                has_spec_placeholders: false,
            }).eq('id', lesson.id);
        }
        console.log(`  ✅ Lesson ${lesson.id} already has all spec blocks (spec_compliant: ${validation.valid})`);
        return { changed: true, reason: 'already compliant — flags updated' };
    }

    console.log(`\n📋 Lesson ${lesson.id} — "${lesson.title}"`);
    console.log(`  MISSING: ${missing.join(', ')}`);

    let updatedBlocks = [...blocks];
    let hasPlaceholders = false;

    // ── Hook ──
    if (missing.includes('hook')) {
        const extracted = extractHook(updatedBlocks);
        if (extracted) {
            if (extracted.removeSourceAt !== undefined) {
                updatedBlocks.splice(extracted.removeSourceAt, 1);
            }
            updatedBlocks.unshift(extracted.block);
            console.log(`  → hook: extracted from existing block ✓`);
        } else {
            const placeholder = { type: 'hook', content: '', hook_style: 'question', analytics_tag: 'hook', is_placeholder: true, placeholder_reason: 'missing_hook', backfill_injected: true };
            updatedBlocks.unshift(placeholder);
            hasPlaceholders = true;
            console.log(`  → hook: placeholder injected at position 0`);
        }
    }

    // ── Teaching line ──
    if (missing.includes('teaching_line')) {
        const extracted = extractTeachingLine(updatedBlocks);
        if (extracted) {
            if (extracted.removeSourceAt !== undefined) {
                updatedBlocks.splice(extracted.removeSourceAt, 1);
            }
            const lastCoreIdx = updatedBlocks.reduce((best: number, b: any, i: number) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
            const insertAt = lastCoreIdx !== -1 ? lastCoreIdx + 1 : Math.max(0, updatedBlocks.length - 2);
            updatedBlocks.splice(insertAt, 0, extracted.block);
            console.log(`  → teaching_line: extracted from existing block ✓`);
        } else {
            const placeholder = { type: 'teaching_line', line: '', support: '', analytics_tag: 'teaching_line', is_placeholder: true, placeholder_reason: 'missing_teaching_line', backfill_injected: true };
            const lastCoreIdx = updatedBlocks.reduce((best: number, b: any, i: number) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
            const insertAt = lastCoreIdx !== -1 ? lastCoreIdx + 1 : Math.max(0, updatedBlocks.length - 2);
            updatedBlocks.splice(insertAt, 0, placeholder);
            hasPlaceholders = true;
            console.log(`  → teaching_line: placeholder injected`);
        }
    }

    // ── Mental checkpoint ──
    if (missing.includes('mental_checkpoint')) {
        const placeholder = { type: 'mental_checkpoint', prompt: '', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint', is_placeholder: true, placeholder_reason: 'missing_mental_checkpoint', backfill_injected: true };
        const firstCoreIdx = updatedBlocks.findIndex(b => b.type === 'core_explanation' || b.type === 'text');
        const insertAt = firstCoreIdx !== -1 ? firstCoreIdx + 1 : Math.max(0, updatedBlocks.length - 3);
        updatedBlocks.splice(insertAt, 0, placeholder);
        hasPlaceholders = true;
        console.log(`  → mental_checkpoint: placeholder injected after block ${insertAt - 1}`);
    }

    // ── Prediction warning ──
    if (!types.has('prediction')) {
        console.log(`  → prediction: not present — warning only (not auto-generated)`);
    }

    // ── Validate before write ──
    const validation = validateLessonPedagogy(updatedBlocks, 'standard');
    if (!validation.valid) {
        console.log(`  ⚠️  validateLessonPedagogy: FAIL — skipping write`);
        console.log(`     Errors:`, validation.errors.map(e => e.message).join('; '));
        return { changed: false, reason: 'validation failed after backfill' };
    }

    console.log(`  → validateLessonPedagogy: PASS`);
    console.log(`  → Would write ${missing.length} block(s), has_spec_placeholders: ${hasPlaceholders}${APPLY ? '' : ' [dry-run]'}`);

    if (APPLY) {
        updatedBlocks = updatedBlocks.map((b: any, i: number) => ({ ...b, order: i }));
        const { error } = await supabase.from('course_lessons').update({
            content_blocks: updatedBlocks,
            schema_version: '2.0',
            pedagogical_spec_version: '1.0',
            spec_compliant: true,
            spec_migrated: true,
            has_spec_placeholders: hasPlaceholders,
        }).eq('id', lesson.id);
        if (error) {
            console.error(`  ❌ DB update failed: ${error.message}`);
            return { changed: false, reason: error.message };
        }
        console.log(`  ✅ Updated`);
    }

    return { changed: true };
}

async function main() {
    console.log('─────────────────────────────────────────────────────');
    console.log('🔬 Universal Lesson Spec v1.0 — Backfill Script');
    console.log(APPLY
        ? '⚠️  --apply flag set — changes WILL be written to DB'
        : '🧪 Dry-run — no DB changes. Pass --apply to write.');
    console.log('─────────────────────────────────────────────────────');

    const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_blocks, schema_version')
        .or('schema_version.is.null,schema_version.lt.2.0')
        .eq('spec_migrated', false);

    if (error) { console.error('DB fetch error:', error); return; }

    const lessons = data ?? [];
    console.log(`Found ${lessons.length} legacy lessons to process.\n`);

    let passReady = 0;
    let skipped = 0;
    let placeholderCount = 0;
    let manualReview = 0;

    for (const lesson of lessons) {
        const result = await processLesson(lesson);
        if (result.changed) passReady++;
        else { skipped++; manualReview++; }
        const blocks = Array.isArray(lesson.content_blocks) ? lesson.content_blocks : [];
        if (blocks.some((b: any) => b.is_placeholder)) placeholderCount++;
    }

    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('Summary');
    console.log(`  Lessons scanned:        ${lessons.length}`);
    console.log(`  Lessons pass-ready:     ${passReady}`);
    console.log(`  Lessons skipped:        ${skipped}`);
    console.log(`  Placeholder injections: ${placeholderCount}`);
    console.log(`  Manual review required: ${manualReview}`);
    console.log('─────────────────────────────────────────────────────────────');
    if (!APPLY && lessons.length > 0) {
        console.log('Run with --apply to write changes.');
    }
    console.log('');
}

main().catch(console.error);
