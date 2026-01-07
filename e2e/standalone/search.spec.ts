import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Load sample HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for data to load
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 5000
        });
    });

    test.fixme(
        'should search in request/response content',
        async ({ page }) => {
            // Type in search box
            const searchInput = page.locator('input[type="search"]');
            await searchInput.fill('John');

            // Wait for search to apply (debounced)
            await page.waitForTimeout(200);

            // Requests containing "John" should be highlighted/visible
            // The search is in the content, so we expect matches
            await expect(page.locator('text=/John/i').first()).toBeVisible();
        }
    );

    test.fixme('should perform case-sensitive search', async ({ page }) => {
        // Enable case-sensitive mode
        const caseSensitiveButton = page.locator(
            'button[title*="Case sensitive"]'
        );
        await caseSensitiveButton.click();

        // Search for exact case
        const searchInput = page.locator('input[type="search"]');
        await searchInput.fill('John');
        await page.waitForTimeout(200);

        // Should match "John Doe" and "John Updated"
        await expect(page.locator('text=John')).toHaveCount(2, {
            timeout: 2000
        });

        // Search for wrong case
        await searchInput.clear();
        await searchInput.fill('john');
        await page.waitForTimeout(200);

        // Should not match with case-sensitive enabled
        const johnLower = page.locator('text=/^john$/');
        await expect(johnLower).toHaveCount(0);
    });

    test.fixme(
        'should hide unrelated results when enabled',
        async ({ page }) => {
            // Type search
            const searchInput = page.locator('input[type="search"]');
            await searchInput.fill('users');
            await page.waitForTimeout(200);

            // "Hide unrelated" checkbox should appear
            const hideUnrelatedCheckbox = page.locator(
                'label:has-text("Hide unrelated") input[type="checkbox"]'
            );
            await expect(hideUnrelatedCheckbox).toBeVisible();

            // Check the checkbox
            await hideUnrelatedCheckbox.check();
            await page.waitForTimeout(200);

            // Should show only matching requests (3 with "users" in URL)
            await expect(
                page.locator('text=/3.*\\/.*5.*requests/i')
            ).toBeVisible();
        }
    );

    test.fixme('should clear search results', async ({ page }) => {
        // Perform search
        const searchInput = page.locator('input[type="search"]');
        await searchInput.fill('users');
        await page.waitForTimeout(200);

        // Enable hide unrelated
        const hideUnrelatedCheckbox = page.locator(
            'label:has-text("Hide unrelated") input[type="checkbox"]'
        );
        await hideUnrelatedCheckbox.check();
        await page.waitForTimeout(200);

        // Verify filtered
        await expect(page.locator('text=/3.*\\/.*5.*requests/i')).toBeVisible();

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(200);

        // All requests should be visible again
        await expect(page.locator('text=/5.*\\/.*5.*requests/i')).toBeVisible();

        // "Hide unrelated" checkbox should disappear
        await expect(hideUnrelatedCheckbox).not.toBeVisible();
    });

    test.fixme(
        'should search with JSON unpacking enabled',
        async ({ page }) => {
            // Enable JSON unpacking
            const unpackButton = page.locator('button[title*="Unpack JSON"]');
            await unpackButton.click();

            // Wait for unpacking
            await page.waitForTimeout(200);

            // Search for a value inside JSON (email field)
            const searchInput = page.locator('input[type="search"]');
            await searchInput.fill('example.com');
            await page.waitForTimeout(200);

            // Should find requests with emails containing example.com
            await expect(
                page.locator('text=/example\\.com/i').first()
            ).toBeVisible();
        }
    );
});
