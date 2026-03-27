
import { test, expect } from '@playwright/test';

test.use({ headless: false }); // FORCE HEADED

test('Sanity Check', async ({ page }) => {
    console.log('Navigating to home...');
    await page.goto('http://localhost:3000');
    console.log('Navigated. Waiting for title...');
    await expect(page).toHaveTitle(/AI Bytes/);
    console.log('Title found. Waiting 5s...');
    await page.waitForTimeout(5000);
});
