/**
 * Focused Playwright Lesson Validation
 * Course 732: Perceptrons (15 blocks per lesson)
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = resolve(__dirname, '../tmp/lesson-validation');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function log(msg) { console.log(`[${new Date().toLocaleTimeString('en-GB')}] ${msg}`); }
async function shot(page, name) {
    const file = resolve(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    log(`📸 ${name}`);
}

async function run() {
    log('🎯 Focused Lesson Validation — Course 732');

    const { data: authData } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: 'admin@aibytes.com' });

    const browser = await chromium.launch({ headless: false, slowMo: 150, args: ['--start-maximized'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Authenticate
    await page.goto(authData.properties.action_link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.evaluate(({ supabaseUrl, at, rt }) => {
        const proj = new URL(supabaseUrl).hostname.split('.')[0];
        localStorage.setItem(`sb-${proj}-auth-token`, JSON.stringify({
            access_token: at, refresh_token: rt, token_type: 'bearer', expires_in: 3600
        }));
    }, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, at: authData.properties.access_token, rt: authData.properties.refresh_token });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    log('✅ Authenticated');

    // ── TEST 1: Navigate to lesson 3387 ─────────────────────────────────────
    log('\n── TEST 1: Lesson Page ──');
    await page.goto(`${BASE_URL}/courses/732/lessons/3387`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(6000); // Extra time for React hydration + animations
    await shot(page, '01-lesson-top');

    const url = page.url();
    log(`   URL: ${url}`);

    // Dump first 500 chars of body text to see what's rendering
    const bodyText = await page.locator('body').innerText().catch(() => '');
    log(`   Body text preview (first 300 chars): "${bodyText.substring(0, 300).replace(/\n/g, ' ')}"`);
    log(`   Total body words: ~${bodyText.split(/\s+/).filter(w => w).length}`);

    // Check individual elements
    const h1s = await page.locator('h1').allInnerTexts().catch(() => []);
    const h2s = await page.locator('h2').allInnerTexts().catch(() => []);
    const h3s = await page.locator('h3').allInnerTexts().catch(() => []);
    log(`   h1 (${h1s.length}): ${h1s.join(' | ')}`);
    log(`   h2 (${h2s.length}): ${h2s.slice(0, 4).join(' | ')}`);
    log(`   h3 (${h3s.length}): ${h3s.slice(0, 4).join(' | ')}`);

    // Check for key block content using separate locators (avoid comma-separated text= selectors)
    const objectiveCount = await page.locator('text=Learning Objective').count();
    const byEndCount = await page.locator('text=By the end').count();
    const minReadCount = await page.locator('text=min').count();
    const calloutTip = await page.locator('text=Pro Tip').count();
    const calloutWarn = await page.locator('text=Warning').count();
    const keyTerms = await page.locator('text=Key Terms').count();
    const quizCheck = await page.locator('text=Knowledge Check').count();
    const audioEl = await page.locator('audio').count();
    const listenBtn = await page.locator('button:has-text("Listen")').count();

    log('\n   Content block checks:');
    log(`   ${objectiveCount > 0 ? '✅' : '❌'} Objective text: ${objectiveCount}`);
    log(`   ${byEndCount > 0 ? '✅' : '❌'} "By the end" text: ${byEndCount}`);
    log(`   ${minReadCount > 0 ? '✅' : '❌'} Duration "min" text: ${minReadCount}`);
    log(`   ${calloutTip > 0 ? '✅' : '⚠️'} Callout tip: ${calloutTip}`);
    log(`   ${calloutWarn > 0 ? '✅' : '⚠️'} Callout warning: ${calloutWarn}`);
    log(`   ${keyTerms > 0 ? '✅' : '⚠️'} Key terms section: ${keyTerms}`);
    log(`   ${quizCheck > 0 ? '✅' : '⚠️'} Quiz/Knowledge check: ${quizCheck}`);
    log(`   ${(audioEl + listenBtn) > 0 ? '✅' : '❌'} Audio player (needs gen): ${audioEl} audio + ${listenBtn} listen btn`);

    // Check if page might be loading or error state
    const loadingEl = await page.locator('text=Loading, text=loading, [class*="skeleton"], [class*="loading"]').count();
    const errorEl = await page.locator('text=Error, text=error, text=404, text=not found').count();
    log(`   Loading state elements: ${loadingEl}`);
    log(`   Error elements: ${errorEl}`);

    // Scroll and screenshot
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1500);
    await shot(page, '02-lesson-after-scroll');

    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1500);
    await shot(page, '03-lesson-deep');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await shot(page, '04-lesson-bottom');

    // Final body word count after scrolling (lazy rendering)
    const finalWordCount = await page.locator('body').innerText()
        .then(t => t.split(/\s+/).filter(w => w).length).catch(() => 0);
    log(`   Final body word count (after scroll): ~${finalWordCount}`);

    // ── TEST 2: Admin → Generate Audio for course 732 ───────────────────────
    log('\n── TEST 2: Admin Audio Generation ──');
    await page.goto(`${BASE_URL}/admin/courses`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(4000);
    await shot(page, '05-admin-courses');

    const allBtns = await page.locator('button').all();
    log(`   Buttons on page: ${allBtns.length}`);

    // Find the first course row and try to click its action menu
    // Strategy: find text containing "Perceptron" then navigate to nearby buttons
    const perceptronText = page.locator('text=Perceptron').first();
    if (await perceptronText.isVisible({ timeout: 3000 }).catch(() => false)) {
        log('   Found Perceptron course row');
        // Walk up DOM to find the row container, then find the button
        const rowContainer = perceptronText.locator('xpath=ancestor::*[contains(@class,"group") or contains(@class,"row") or contains(@class,"tr") or self::tr][1]').first();
        const menuBtn = rowContainer.locator('button').last();
        if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await menuBtn.click();
            await page.waitForTimeout(600);
            await shot(page, '06-dropdown-open');
            const audioItem = page.locator('text=Generate Audio').first();
            if (await audioItem.isVisible({ timeout: 2000 }).catch(() => false)) {
                log('   🎯 Clicking Generate Audio...');
                await audioItem.click();
                await page.waitForTimeout(4000);
                await shot(page, '07-audio-triggered');
                log('   ✅ Audio generation triggered');
                await page.waitForTimeout(20000);
                await shot(page, '08-audio-progress');
            } else {
                log('   ⚠️ Generate Audio item not visible');
            }
        } else {
            log('   ⚠️ Menu button not found near course row');
            await shot(page, '06-no-menu-btn');
        }
    } else {
        log('   ⚠️ Course "Perceptron" not visible — admin may need auth');
    }

    // ── TEST 3: Lesson after audio (check audio player) ─────────────────────
    log('\n── TEST 3: Lesson after Audio Generation ──');
    await page.goto(`${BASE_URL}/courses/732/lessons/3387`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(4000);
    const audioAfter = await page.locator('audio').count();
    const listenAfter = await page.locator('button:has-text("Listen")').count();
    const audioRecapEl = await page.locator('text=Audio Recap, text=audio recap, text=AI Guide').count();
    log(`   Audio elements: ${audioAfter} | Listen buttons: ${listenAfter} | Recap elements: ${audioRecapEl}`);
    await shot(page, '09-lesson-with-audio-check');

    // ── SUMMARY ─────────────────────────────────────────────────────────────
    log('\n' + '═'.repeat(60));
    log('LESSON VALIDATION COMPLETE');
    log(`Screenshots: ${SCREENSHOTS_DIR}`);
    log('═'.repeat(60));

    await page.waitForTimeout(15000);
    await browser.close();
}

run().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
