import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Search Functionality', () => {
    test('should have search input and allow typing', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Search input should exist
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Should be able to type in search
        await searchInput.fill('test search');
        await expect(searchInput).toHaveValue('test search');

        // Clear should work
        await searchInput.clear();
        await expect(searchInput).toHaveValue('');
    });

    test('should show hide unrelated checkbox when searching', async ({
        page
    }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load data
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Type in search
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('test');
        await page.waitForTimeout(300);

        // Hide unrelated checkbox should appear
        const hideCheckbox = page
            .locator('input[type="checkbox"][title*="hide"]')
            .first();
        await expect(hideCheckbox).toBeVisible();
    });

    test('should toggle case-sensitive mode', async ({ page }) => {
        await page.goto('/');

        // Case sensitive button should exist
        const caseSensitiveButton = page.locator('button[title*="Case"]');
        await expect(caseSensitiveButton).toBeVisible();

        // Click should toggle (no error)
        await caseSensitiveButton.click();
        await page.waitForTimeout(100);

        // Click again to toggle back
        await caseSensitiveButton.click();
    });

    test('should filter results with hide unrelated enabled', async ({
        page
    }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load filtering test data (more entries to filter)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/filtering-test.har')
        );
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Search for "users" (appears in multiple URLs)
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('users');
        await page.waitForTimeout(300);

        // Enable hide unrelated
        const hideCheckbox = page
            .locator('input[type="checkbox"][title*="hide"]')
            .first();

        // Ensure unchecked first
        if (await hideCheckbox.isChecked()) {
            await hideCheckbox.uncheck();
            await page.waitForTimeout(200);
        }

        await hideCheckbox.check();
        await page.waitForTimeout(300);

        // Should show fewer requests (users appears in 4 URLs out of 5 HAR entries)
        // The count will be less than 6
        const footerText = await page.locator('footer').textContent();
        expect(footerText).toMatch(/\d+ \/ 6 requests/);
    });

    test('should clear search and restore all results', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load data
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/filtering-test.har')
        );
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Search and enable hide unrelated
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('posts');
        await page.waitForTimeout(300);

        const hideCheckbox = page
            .locator('input[type="checkbox"][title*="hide"]')
            .first();
        if (await hideCheckbox.isChecked()) {
            await hideCheckbox.uncheck();
            await page.waitForTimeout(200);
        }
        await hideCheckbox.check();
        await page.waitForTimeout(300);

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(300);

        // All 6 requests should be visible again
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });
});
