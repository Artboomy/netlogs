import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Filtering & Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Load filtering test HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/filtering-test.har')
        );

        // Wait for data to load (5 requests + 1 "Opened file" message = 6 items, but footer shows 5 requests)
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 10000
        });
    });

    test.fixme('should filter by URL in footer', async ({ page }) => {
        // Type URL filter
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');

        // Wait for filtering to apply (debounced)
        await page.waitForTimeout(200);

        // Should show only user-related requests (3 out of 5)
        await expect(page.locator('text=/3.*\\/.*5.*requests/i')).toBeVisible();

        // Verify filtered requests are visible
        await expect(
            page.locator('text=https://api.example.com/users').first()
        ).toBeVisible();

        // Clear filter
        await filterInput.clear();
        await page.waitForTimeout(200);

        // All requests should be visible again
        await expect(page.locator('text=/5.*\\/.*5.*requests/i')).toBeVisible();
    });

    test.fixme('should filter using method sidebar', async ({ page }) => {
        // Open methods sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Wait for sidebar to open
        await expect(page.locator('text=/Methods/i')).toBeVisible();

        // Find and uncheck GET method
        const getCheckbox = page.locator('label:has-text("GET") input[type="checkbox"]');
        await getCheckbox.uncheck();

        // Wait for filter to apply
        await page.waitForTimeout(200);

        // Should show only non-GET requests (4 out of 5: POST, PUT, DELETE, and one more GET)
        // Actually sample.har has: GET, POST, GET, PUT, DELETE = 2 GET, 1 POST, 1 PUT, 1 DELETE
        // Unchecking GET should leave 3 requests
        await expect(page.locator('text=/3.*\\/.*5.*requests/i')).toBeVisible();

        // Re-check GET
        await getCheckbox.check();
        await page.waitForTimeout(200);

        // All requests visible again
        await expect(page.locator('text=/5.*\\/.*5.*requests/i')).toBeVisible();
    });

    test.fixme('should apply combined filters (URL + Method)', async ({ page }) => {
        // Open methods sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Uncheck POST method
        const postCheckbox = page.locator(
            'label:has-text("POST") input[type="checkbox"]'
        );
        await postCheckbox.uncheck();
        await page.waitForTimeout(200);

        // Apply URL filter
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');
        await page.waitForTimeout(200);

        // Should show users requests excluding POST (2 out of 5)
        await expect(page.locator('text=/2.*\\/.*5.*requests/i')).toBeVisible();

        // Verify POST to /users is NOT visible while GET /users IS visible
        const requests = page.locator('text=https://api.example.com/users');
        await expect(requests).toHaveCount(2); // GET and PUT
    });

    test.fixme('should filter by MIME type', async ({ page }) => {
        // Find MIME type selector (assuming it's a select/dropdown)
        const mimeTypeSelect = page.locator('text=/Select/i').first();
        await mimeTypeSelect.click();

        // Wait for dropdown
        await page.waitForTimeout(100);

        // Select JSON mime type (if available in dropdown)
        const jsonOption = page.locator('text=/json/i').first();
        if (await jsonOption.isVisible()) {
            await jsonOption.click();
            await page.waitForTimeout(200);

            // All sample requests are JSON, so count should remain 5
            await expect(
                page.locator('text=/5.*\\/.*5.*requests/i')
            ).toBeVisible();
        }
    });

    test.fixme('should clear all filters', async ({ page }) => {
        // Apply URL filter
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');
        await page.waitForTimeout(200);

        // Verify filtered
        await expect(page.locator('text=/3.*\\/.*5.*requests/i')).toBeVisible();

        // Clear filter
        await filterInput.clear();
        await page.waitForTimeout(200);

        // All requests visible
        await expect(page.locator('text=/5.*\\/.*5.*requests/i')).toBeVisible();

        // Open methods sidebar and uncheck a method
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();
        const getCheckbox = page.locator(
            'label:has-text("GET") input[type="checkbox"]'
        );
        await getCheckbox.uncheck();
        await page.waitForTimeout(200);

        // Re-check to clear
        await getCheckbox.check();
        await page.waitForTimeout(200);

        // All requests visible again
        await expect(page.locator('text=/5.*\\/.*5.*requests/i')).toBeVisible();
    });
});
