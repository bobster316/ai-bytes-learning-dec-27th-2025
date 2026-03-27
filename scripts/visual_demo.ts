
import { chromium } from '@playwright/test';

async function runDemo() {
    console.log('Starting visual demo...');

    // Launch browser in headed mode with slowMo to make actions visible
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100, // Slow down operations by 100ms
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: null // exact viewport
    });

    const page = await context.newPage();

    console.log('Navigating to courses page...');
    await page.goto('http://localhost:3000/courses');

    // Inject a blue border to show "Agent Control"
    await page.addStyleTag({
        content: `
      body {
        border: 5px solid #0070f3 !important;
        box-sizing: border-box;
        position: relative;
      }
      body::before {
        content: "AGENT CONTROL ACTIVE";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #0070f3;
        color: white;
        text-align: center;
        font-weight: bold;
        z-index: 99999;
        padding: 5px;
      }
      .agent-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        background: rgba(0, 112, 243, 0.5);
        border-radius: 50%;
        border: 2px solid #0070f3;
        pointer-events: none;
        z-index: 100000;
        transition: all 0.1s ease;
      }
    `
    });

    // Create a fake cursor element to visualize movement
    await page.evaluate(() => {
        const cursor = document.createElement('div');
        cursor.className = 'agent-cursor';
        cursor.id = 'agent-cursor';
        document.body.appendChild(cursor);

        window.addEventListener('mousemove', (e) => {
            const cursor = document.getElementById('agent-cursor');
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        });
    });

    // Simulate looking around
    console.log('Simulating mouse movement...');

    const mouseMovements = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 500, y: 200 },
        { x: 100, y: 500 },
    ];

    for (const pos of mouseMovements) {
        await page.mouse.move(pos.x, pos.y);
        // Update visual cursor position manually for the demo
        await page.evaluate(({ x, y }) => {
            const cursor = document.getElementById('agent-cursor');
            if (cursor) {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
            }
        }, pos);
        await page.waitForTimeout(500);
    }

    // Find filters and hover/click
    console.log('Interacting with filters...');
    const buttons = await page.getByRole('button').all();

    if (buttons.length > 0) {
        // Hover over the first few buttons
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
            const bbox = await buttons[i].boundingBox();
            if (bbox) {
                await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
                await page.evaluate(({ x, y }) => {
                    const cursor = document.getElementById('agent-cursor');
                    if (cursor) {
                        cursor.style.left = x + 'px';
                        cursor.style.top = y + 'px';
                    }
                }, { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 });

                // highlight the button
                await buttons[i].evaluate(el => el.style.border = '2px solid red');
                await page.waitForTimeout(800);
                await buttons[i].evaluate(el => el.style.border = '');
            }
        }
    }

    console.log('Demo complete. Keeping browser open for a few seconds...');
    await page.waitForTimeout(5000);

    await browser.close();
}

runDemo().catch(console.error);
