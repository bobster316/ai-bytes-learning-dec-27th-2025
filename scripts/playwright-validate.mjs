/**
 * Playwright End-to-End Validation Script
 * Tests: Login → Admin → Course Generation → Lesson View → Audio Generation
 * Run: node scripts/playwright-validate.mjs
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
const SCREENSHOTS_DIR = resolve(__dirname, '../tmp/playwright-screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function log(msg) {
    const ts = new Date().toLocaleTimeString('en-GB');
    console.log(`[${ts}] ${msg}`);
}

async function shot(page, name) {
    const file = resolve(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    log(`📸 ${name}`);
}

async function getSession() {
    // Generate a magic link and extract the access + refresh tokens
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: 'admin@aibytes.com'
    });
    if (error) throw new Error(`Auth failed: ${error.message}`);
    return {
        accessToken: data.properties.access_token,
        refreshToken: data.properties.refresh_token,
        user: data.user,
        magicLink: data.properties.action_link
    };
}

async function run() {
    log('🚀 Starting Playwright validation...');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 200,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // ─── STEP 1: Authenticate reliably via magic link ──────────────────────
    log('🔐 Step 1: Authenticating...');
    const { accessToken, refreshToken, user } = await getSession();

    // Derive the Supabase project ref from the URL (e.g. 'aysqedgkpdbcbubadrrr')
    const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookieName = `sb-${projectRef}-auth-token`;
    const sessionPayload = JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user
    });

    // Inject auth cookie BEFORE navigating — the SSR middleware reads cookies, not localStorage
    await context.addCookies([{
        name: cookieName,
        value: sessionPayload,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
    }]);

    // Navigate to localhost first so we can write to its localStorage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Also inject tokens to localStorage for the client-side Supabase (belt-and-braces)
    await page.evaluate(({ key, at, rt }) => {
        localStorage.setItem(key, JSON.stringify({
            access_token: at,
            refresh_token: rt,
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        }));
    }, {
        key: cookieName,
        at: accessToken,
        rt: refreshToken
    });

    // Hard reload to pick up session
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await shot(page, '01-homepage-authenticated');
    log(`✅ Session active. URL: ${page.url()}`);

    // ─── STEP 2: Homepage check ─────────────────────────────────────────────
    log('🏠 Step 2: Homepage validation...');
    const title = await page.title();
    const hasHero = await page.locator('h1, h2').count() > 0;
    log(`   Title: "${title}" | Has headings: ${hasHero}`);
    await shot(page, '02-homepage');

    // ─── STEP 3: Admin Courses page ─────────────────────────────────────────
    log('⚙️  Step 3: Admin courses...');
    await page.goto(`${BASE_URL}/admin/courses`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000); // Wait for client-side data fetch
    await shot(page, '03-admin-courses');

    // Count 3-dot menu buttons (one per course row)
    const menuBtns = await page.locator('button:has([data-lucide="more-horizontal"]), button:has(.lucide-more-horizontal)').count();
    // Fallback: count rows by "Draft" or "Live" badge
    const courseBadges = await page.locator('text=Live, text=Draft').count();
    log(`   Course rows (menu buttons): ${menuBtns} | Status badges: ${courseBadges}`);

    // ─── STEP 4: New course form ─────────────────────────────────────────────
    log('➕ Step 4: Creating a new course...');
    await page.goto(`${BASE_URL}/admin/courses/new`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await shot(page, '04-new-course-form');

    // The topic input has placeholder "e.g. Advanced Neural Architectures..."
    const topicInput = page.locator('input[placeholder*="Neural"]');
    await topicInput.waitFor({ state: 'visible', timeout: 5000 });
    await topicInput.fill('Introduction to Prompt Engineering');
    await page.waitForTimeout(500);
    log('✅ Topic entered');

    // Select Beginner
    await page.locator('button:has-text("Beginner")').first().click();
    await page.waitForTimeout(300);

    // Select 1 Module — faster generation for validation (2 lessons vs 4)
    await page.locator('button').filter({ hasText: '1 Module' }).first().click();
    await page.waitForTimeout(300);

    await shot(page, '05-form-filled');

    // Click "Generate Curriculum" (only appears when topic is non-empty)
    const genBtn = page.locator('button:has-text("Generate Curriculum")');
    await genBtn.waitFor({ state: 'visible', timeout: 5000 });
    log('🎯 Clicking Generate Curriculum...');
    await genBtn.click();

    // ─── STEP 5: Generation progress ────────────────────────────────────────
    log('⏳ Step 5: Watching generation (up to 20 mins)...');
    await page.waitForTimeout(3000);
    await shot(page, '06-generation-started');

    let generationComplete = false;
    let generationError = false;
    let attempts = 0;
    const maxAttempts = 240; // 20 minutes at 5s intervals

    while (!generationComplete && !generationError && attempts < maxAttempts) {
        attempts++;
        await page.waitForTimeout(5000);
        const pageUrl = page.url();

        // Redirected to course page = success
        if (pageUrl.includes('/courses/') && !pageUrl.includes('/new')) {
            generationComplete = true;
            log(`✅ Generation complete! → ${pageUrl}`);
            break;
        }

        // Check for error state in NeuralLoom
        const bodyText = await page.locator('body').innerText().catch(() => '');
        if (bodyText.includes('System Error') || bodyText.includes('Generation Service Unavailable') || bodyText.includes('Validation Failed')) {
            generationError = true;
            log('❌ Generation error detected in UI');
            await shot(page, `07-generation-error-${attempts}`);
            break;
        }

        // Check progress percentage displayed
        const progressText = await page.locator('body').innerText().then(t => {
            const m = t.match(/(\d+)%/);
            return m ? m[0] : '?%';
        }).catch(() => '?');

        if (attempts % 6 === 0) {
            await shot(page, `07-progress-${attempts * 5}s`);
            log(`   [${attempts * 5}s] URL: ${pageUrl} | Progress: ${progressText}`);
        }
    }

    if (!generationComplete && !generationError) {
        log('⚠️  Generation timed out after 20 minutes');
        await shot(page, '08-timeout');
    }

    await shot(page, '08-post-generation');

    // ─── STEP 6: Browse to most recent course ──────────────────────────────
    log('📚 Step 6: Viewing most recent course...');

    // Get most recent course from DB
    const { data: latestCourse } = await supabase
        .from('courses')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (latestCourse) {
        log(`   Latest course: "${latestCourse.title}" (ID: ${latestCourse.id})`);
        await page.goto(`${BASE_URL}/courses/${latestCourse.id}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
        await shot(page, '09-course-page');

        // ─── STEP 7: Open first lesson ─────────────────────────────────────
        log('📖 Step 7: Opening first lesson...');
        const lessonLink = page.locator('a[href*="/lessons/"]').first();
        if (await lessonLink.isVisible()) {
            const href = await lessonLink.getAttribute('href');
            log(`   Opening: ${href}`);
            await lessonLink.click();
            await page.waitForURL('**/lessons/**', { timeout: 10000 });
            await page.waitForTimeout(4000);
            await shot(page, '10-lesson-page-top');
            log(`✅ Lesson page: ${page.url()}`);

            // Validate content
            const h2Count = await page.locator('h2').count();
            const h3Count = await page.locator('h3').count();
            const objectiveEl = await page.locator('text=Learning Objective').count();
            const lessonHeaderEl = await page.locator('text=min read, text=min, text=XP').count();
            const hasAudioPlayer = await page.locator('button:has-text("Listen"), audio, [class*="audio"]').count() > 0;

            log(`   h2 headings: ${h2Count} | h3 headings: ${h3Count}`);
            log(`   Objective block: ${objectiveEl > 0 ? '✅' : '❌'}`);
            log(`   Lesson header meta: ${lessonHeaderEl > 0 ? '✅' : '❌'}`);
            log(`   Audio player: ${hasAudioPlayer ? '✅' : '❌ not found (needs audio generation first)'}`);

            // Scroll to see full lesson
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
            await page.waitForTimeout(1000);
            await shot(page, '11-lesson-mid');
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.66));
            await page.waitForTimeout(1000);
            await shot(page, '12-lesson-bottom');
        } else {
            log('⚠️  No lesson links found on course page');
            await shot(page, '10-no-lessons');
        }
    }

    // ─── STEP 8: Audio Generation from Admin ──────────────────────────────
    log('🎤 Step 8: Testing audio generation...');
    await page.goto(`${BASE_URL}/admin/courses`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    await shot(page, '13-admin-for-audio');

    // Click the 3-dot menu on the first course row
    const firstMenuBtn = page.locator('button').filter({ has: page.locator('[data-lucide="more-horizontal"]') }).first();
    const fallbackMenuBtn = page.locator('button[aria-haspopup="menu"], button[aria-expanded]').first();
    const menuBtn = await firstMenuBtn.isVisible() ? firstMenuBtn : fallbackMenuBtn;

    if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(500);
        await shot(page, '14-dropdown-open');

        // Find Generate Audio in the dropdown
        const audioMenuItem = page.locator('[role="menuitem"]:has-text("Audio"), button:has-text("Generate Audio"), [role="menuitem"]:has-text("Generate Audio")');
        if (await audioMenuItem.isVisible()) {
            log('🎯 Clicking Generate Audio...');
            await audioMenuItem.click();
            await page.waitForTimeout(5000);
            await shot(page, '15-audio-generating');
            log('✅ Audio generation triggered — watching for 15s...');
            await page.waitForTimeout(15000);
            await shot(page, '16-audio-progress');
        } else {
            log('⚠️  "Generate Audio" not found in dropdown');
            await shot(page, '14b-no-audio-item');
        }
    } else {
        log('⚠️  No 3-dot menu button found — admin courses may not have loaded');
    }

    // ─── STEP 9: Dashboard ─────────────────────────────────────────────────
    log('📊 Step 9: Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    const dashboardUrl = page.url();
    await shot(page, '17-dashboard');
    const dashOk = dashboardUrl.includes('/dashboard');
    log(`   Dashboard: ${dashOk ? '✅ Loaded' : '❌ Redirected to ' + dashboardUrl}`);

    // ─── SUMMARY ───────────────────────────────────────────────────────────
    log('\n' + '═'.repeat(60));
    log('PLAYWRIGHT VALIDATION COMPLETE');
    log(`Screenshots: ${SCREENSHOTS_DIR}`);
    if (generationComplete) log('✅ Course generation: COMPLETE');
    else if (generationError) log('❌ Course generation: ERROR');
    else log('⏱  Course generation: TIMED OUT (still running in background)');
    log('═'.repeat(60));

    log('⏸  Keeping browser open 30s for inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
}

run().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
