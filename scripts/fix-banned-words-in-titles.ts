/**
 * fix-banned-words-in-titles.ts
 *
 * Scans all text fields for banned AI-cliché words and fixes them:
 *   - courses.title, courses.description
 *   - course_topics.title, course_topics.description
 *   - course_lessons.title
 *   - lesson_header block title inside course_lessons.content_blocks
 *
 * Run:  npx tsx scripts/fix-banned-words-in-titles.ts          (dry-run)
 *       npx tsx scripts/fix-banned-words-in-titles.ts --apply  (write to DB)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes('--apply');

// ─── Case-preserving replacer ────────────────────────────────────────────────
// If the matched word starts with an uppercase letter, capitalise the replacement.
function rep(replacement: string): (match: string) => string {
    return (match: string) => {
        const startsUpper = match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase();
        return startsUpper
            ? replacement[0].toUpperCase() + replacement.slice(1)
            : replacement;
    };
}

// ─── Replacement pairs ───────────────────────────────────────────────────────
// Using function replacers so "Demystified" → "Explained" and "demystified" → "explained"
const REPLACEMENTS: Array<[RegExp, (match: string) => string]> = [
    // Phrases (replace with fixed lowercase — they never start sentences)
    [/\bdeep.?dive\b/gi,            () => 'close look'],
    [/\bdive into\b/gi,             () => 'look at'],
    [/\bdive in\b/gi,               () => 'start'],
    [/\bparadigm shift\b/gi,        () => 'major change'],
    [/\bgame.chang(?:er|ing)\b/gi,  () => 'significant shift'],
    [/\bcutting.edge\b/gi,          () => 'latest'],
    [/\bstate.of.the.art\b/gi,      () => 'modern'],
    [/\bnext.level\b/gi,            () => 'advanced'],
    [/\bin conclusion\b/gi,         () => 'to summarise'],
    [/\bin summary\b/gi,            () => 'to summarise'],

    // Single words — case-preserving
    [/\bdemystif(?:y|ies)\b/gi,                  rep('explain')],
    [/\bdemystif(?:ied)\b/gi,                    rep('explained')],
    [/\bdemystif(?:ying)\b/gi,                   rep('explaining')],
    [/\bdemystification\b/gi,                    rep('explanation')],
    [/\bunpack(?:s)?\b/gi,                       rep('break down')],
    [/\bunpacked\b/gi,                           rep('broken down')],
    [/\bunpacking\b/gi,                          rep('breaking down')],
    [/\bdelve(?:s|d|ing)?\b/gi,                  rep('look')],
    [/\bunlock(?:s|ed|ing)?\b/gi,                rep('learn')],
    [/\bharness(?:es|ed|ing)?\b/gi,              rep('use')],
    [/\bleverag(?:e|es|ed|ing)\b/gi,             rep('use')],
    [/\bempower(?:s|ed|ing)?\b/gi,               rep('enable')],
    [/\bunleash(?:es|ed|ing)?\b/gi,              rep('release')],
    [/\bstreamlin(?:e|es|ed|ing)\b/gi,           rep('simplify')],
    [/\butiliz(?:e|es|ed|ing)\b/gi,              rep('use')],
    [/\bfacilitat(?:e|es|ed|ing)\b/gi,           rep('help')],
    [/\bfoster(?:s|ed|ing)?\b/gi,                rep('build')],
    [/\bcommenc(?:e|es|ed|ing)\b/gi,             rep('start')],
    [/\bembark(?:s|ed|ing)?\b/gi,                rep('start')],
    [/\btransformativ(?:e|ely)\b/gi,             rep('significant')],
    [/\bgroundbreaking\b/gi,                     rep('new')],
    [/\bseamlessly\b/gi,                         rep('easily')],
    [/\bholistic\b/gi,                           rep('complete')],
    [/\bsynergy\b/gi,                            rep('collaboration')],
    [/\bfurthermore\b/gi,                        rep('also')],
    [/\bmoreover\b/gi,                           rep('also')],
    [/\becosystem\b/gi,                          rep('environment')],
    [/\blandscape\b/gi,                          rep('field')],
    [/\btapestry\b/gi,                           rep('range')],
    [/\barsenal\b/gi,                            rep('set')],
    [/\bblueprint\b/gi,                          rep('plan')],
    [/\bbeacon\b/gi,                             rep('guide')],
    [/\bcomprehensive\b/gi,                      rep('thorough')],
];

function sanitize(text: string): string {
    if (!text) return text;
    let result = text;
    for (const [pattern, replacer] of REPLACEMENTS) {
        result = result.replace(pattern, replacer);
    }
    return result.replace(/  +/g, ' ').trim();
}

function logDiff(label: string, before: string, after: string) {
    console.log(`  [${label}]`);
    console.log(`    BEFORE: "${before}"`);
    console.log(`    AFTER:  "${after}"`);
}

let totalChanges = 0;

async function fixCourses() {
    console.log('\n📚 Checking courses...');
    const { data, error } = await supabase.from('courses').select('id, title, description');
    if (error) { console.error(error); return; }

    for (const row of data ?? []) {
        const updates: Record<string, string> = {};
        const cleanTitle = sanitize(row.title ?? '');
        const cleanDesc  = sanitize(row.description ?? '');

        if (cleanTitle !== row.title)       { updates.title       = cleanTitle; logDiff('title',       row.title,       cleanTitle); }
        if (cleanDesc  !== row.description) { updates.description = cleanDesc;  logDiff('description', row.description, cleanDesc);  }

        if (Object.keys(updates).length > 0) {
            totalChanges++;
            console.log(`  → Course ${row.id}\n`);
            if (APPLY) {
                const { error: e } = await supabase.from('courses').update(updates).eq('id', row.id);
                e ? console.error(`  ❌ ${e.message}`) : console.log(`  ✅ Updated\n`);
            }
        }
    }
}

async function fixTopics() {
    console.log('\n📦 Checking modules (course_topics)...');
    const { data, error } = await supabase.from('course_topics').select('id, title, description');
    if (error) { console.error(error); return; }

    for (const row of data ?? []) {
        const updates: Record<string, string> = {};
        const cleanTitle = sanitize(row.title ?? '');
        const cleanDesc  = sanitize(row.description ?? '');

        if (cleanTitle !== row.title)       { updates.title       = cleanTitle; logDiff('title',       row.title,       cleanTitle); }
        if (cleanDesc  !== row.description) { updates.description = cleanDesc;  logDiff('description', row.description, cleanDesc);  }

        if (Object.keys(updates).length > 0) {
            totalChanges++;
            console.log(`  → Module ${row.id} (${row.title})\n`);
            if (APPLY) {
                const { error: e } = await supabase.from('course_topics').update(updates).eq('id', row.id);
                e ? console.error(`  ❌ ${e.message}`) : console.log(`  ✅ Updated\n`);
            }
        }
    }
}

async function fixLessons() {
    console.log('\n📝 Checking lessons...');
    const { data, error } = await supabase.from('course_lessons').select('id, title, content_blocks');
    if (error) { console.error(error); return; }

    for (const lesson of data ?? []) {
        const updates: Record<string, unknown> = {};

        const cleanTitle = sanitize(lesson.title ?? '');
        if (cleanTitle !== lesson.title) {
            updates.title = cleanTitle;
            logDiff('title', lesson.title, cleanTitle);
        }

        let blocks: any[] = [];
        try {
            blocks = Array.isArray(lesson.content_blocks)
                ? lesson.content_blocks
                : typeof lesson.content_blocks === 'string'
                    ? JSON.parse(lesson.content_blocks)
                    : [];
        } catch { /* skip */ }

        let blocksDirty = false;
        const cleanedBlocks = blocks.map((block: any) => {
            const t = (block.type ?? '').toLowerCase().replace(/[^a-z_]/g, '_');
            if (t === 'lesson_header' && typeof block.title === 'string') {
                const cleanBlockTitle = sanitize(block.title);
                if (cleanBlockTitle !== block.title) {
                    logDiff('lesson_header.title', block.title, cleanBlockTitle);
                    blocksDirty = true;
                    return { ...block, title: cleanBlockTitle };
                }
            }
            return block;
        });

        if (blocksDirty) updates.content_blocks = cleanedBlocks;

        if (Object.keys(updates).length > 0) {
            totalChanges++;
            console.log(`  → Lesson ${lesson.id} (${lesson.title})\n`);
            if (APPLY) {
                const { error: e } = await supabase.from('course_lessons').update(updates).eq('id', lesson.id);
                e ? console.error(`  ❌ ${e.message}`) : console.log(`  ✅ Updated\n`);
            }
        }
    }
}

async function main() {
    console.log('─────────────────────────────────────────────────────');
    console.log('🧹 Banned-word fixer');
    console.log(APPLY
        ? '⚠️  --apply flag set — changes WILL be written to DB'
        : '🧪 Dry-run — no DB changes. Pass --apply to write.');
    console.log('─────────────────────────────────────────────────────');

    await fixCourses();
    await fixTopics();
    await fixLessons();

    console.log('\n─────────────────────────────────────────────────────');
    if (totalChanges === 0) {
        console.log('✅ No banned words found in any text fields.');
    } else if (APPLY) {
        console.log(`✅ Done. ${totalChanges} record(s) updated.`);
    } else {
        console.log(`⚠️  ${totalChanges} record(s) need updating. Run with --apply to write changes.`);
    }
    console.log('');
}

main().catch(console.error);
