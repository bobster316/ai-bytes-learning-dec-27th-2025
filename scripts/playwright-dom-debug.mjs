/**
 * DOM Debug: Check what's actually in the lesson page DOM
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function log(msg) { console.log(`[${new Date().toLocaleTimeString('en-GB')}] ${msg}`); }

async function run() {
    const { data: authData } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: 'admin@aibytes.com' });

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    // Capture console errors and logs
    const consoleLogs = [];
    const consoleErrors = [];
    const page = await context.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        else consoleLogs.push(`[${msg.type()}] ${msg.text().substring(0, 100)}`);
    });
    page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

    // Auth
    await page.goto(authData.properties.action_link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.evaluate(({ supabaseUrl, at, rt }) => {
        const proj = new URL(supabaseUrl).hostname.split('.')[0];
        localStorage.setItem(`sb-${proj}-auth-token`, JSON.stringify({
            access_token: at, refresh_token: rt, token_type: 'bearer', expires_in: 3600
        }));
    }, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, at: authData.properties.access_token, rt: authData.properties.refresh_token });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Navigate to lesson
    await page.goto('http://localhost:3000/courses/732/lessons/3387', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    log('=== DOM INSPECTION ===');

    // Get the main content area structure
    const domInfo = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;

        // Count all block types
        const blockDivs = Array.from(document.querySelectorAll('[class]'))
            .filter(el => {
                const c = el.className || '';
                return typeof c === 'string' && (c.includes('block') || c.includes('Block'));
            })
            .map(el => el.tagName + '.' + (el.className || '').split(' ')[0]);

        // Get all text content length by tag
        const tagCounts = {};
        ['h1','h2','h3','h4','p','span','div'].forEach(tag => {
            const els = document.querySelectorAll(tag);
            tagCounts[tag] = { count: els.length, chars: Array.from(els).reduce((sum, el) => sum + (el.textContent?.length || 0), 0) };
        });

        // Find the lesson content div
        const contentDiv = document.querySelector('[class*="lesson-content"], [class*="pb-32"], main .flex-1');
        const contentHtml = contentDiv ? contentDiv.innerHTML.substring(0, 500) : 'NOT FOUND';

        // Count framer motion divs (they have style with opacity or transform)
        const framerDivs = Array.from(document.querySelectorAll('div[style*="opacity"]'));
        const hiddenFramer = framerDivs.filter(d => d.style.opacity === '0').length;
        const visibleFramer = framerDivs.filter(d => d.style.opacity !== '0').length;

        // Get all unique class names on the page (first word)
        const allClasses = new Set();
        document.querySelectorAll('[class]').forEach(el => {
            if (typeof el.className === 'string') {
                el.className.split(' ').forEach(c => c && allClasses.add(c.substring(0, 40)));
            }
        });

        return {
            blockDivs: blockDivs.slice(0, 20),
            tagCounts,
            contentHtmlPreview: contentHtml,
            framerDivs: { total: framerDivs.length, hidden: hiddenFramer, visible: visibleFramer },
            allClassCount: allClasses.size,
            totalTextContent: document.body.textContent?.length || 0,
            totalInnerText: document.body.innerText?.length || 0,
        };
    });

    log(`Total textContent length: ${domInfo.totalTextContent}`);
    log(`Total innerText length: ${domInfo.totalInnerText}`);
    log(`Tag counts: ${JSON.stringify(domInfo.tagCounts, null, 0)}`);
    log(`Framer divs: total=${domInfo.framerDivs.total}, hidden(opacity:0)=${domInfo.framerDivs.hidden}, visible=${domInfo.framerDivs.visible}`);
    log(`Block-named elements: ${domInfo.blockDivs.join(', ')}`);
    log(`Content HTML preview: ${domInfo.contentHtmlPreview}`);

    if (consoleErrors.length) {
        log('\n=== CONSOLE ERRORS ===');
        consoleErrors.forEach(e => log('  ❌ ' + e.substring(0, 200)));
    } else {
        log('\n✅ No console errors');
    }

    log('\n=== CONSOLE LOGS (last 10) ===');
    consoleLogs.slice(-10).forEach(l => log('  ' + l));

    // Scroll and check again
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(2000);

    const afterScroll = await page.evaluate(() => {
        const framerDivs = Array.from(document.querySelectorAll('div[style*="opacity"]'));
        return {
            hidden: framerDivs.filter(d => d.style.opacity === '0').length,
            visible: framerDivs.filter(d => d.style.opacity !== '0').length,
            innerText: document.body.innerText?.length || 0
        };
    });
    log(`\nAfter scroll to 2000px:`);
    log(`  Framer hidden: ${afterScroll.hidden}, visible: ${afterScroll.visible}`);
    log(`  InnerText length: ${afterScroll.innerText}`);

    await page.waitForTimeout(10000);
    await browser.close();
}

run().catch(err => console.error('❌', err.message));
