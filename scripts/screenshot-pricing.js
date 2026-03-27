const { chromium } = require('@playwright/test');

(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:3000/pricing');
        await page.setViewportSize({ width: 1440, height: 1080 }); // Desktop size

        // Scroll to bottom to trigger any lazy loading or animations
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'pricing_desktop_v3.png', fullPage: true });

        console.log('Screenshot saved to pricing_desktop_v3.png');
        await browser.close();
    } catch (error) {
        console.error('Error taking screenshot:', error);
        process.exit(1);
    }
})();
