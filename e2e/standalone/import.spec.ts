import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('HAR File Import', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage to avoid issues with serialized functions from previous builds
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test.fixme('should import valid HAR file via file input', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Upload file via file input
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for success toast
        await expect(
            page.locator('text=/Opened file.*sample\\.har/i')
        ).toBeVisible({ timeout: 10000 });

        // Check that requests are displayed (2 requests + 1 "Opened file" message = 3 items total)
        await expect(page.locator('text=/2.*requests/i')).toBeVisible();

        // Verify specific request is visible
        await expect(
            page.locator('text=jsonplaceholder.typicode.com')
        ).toBeVisible();
    });

    test.fixme('should import HAR file via drag & drop', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Create a data transfer with the HAR file
        const filePath = path.join(__dirname, '../fixtures/sample.har');
        const buffer = fs.readFileSync(filePath);
        const dataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([new Uint8Array(data)], 'sample.har', {
                type: 'application/json'
            });
            dt.items.add(file);
            return dt;
        }, Array.from(buffer));

        // Trigger drop event on the drop container
        await page.dispatchEvent('body', 'drop', { dataTransfer });

        // Wait for success toast
        await expect(
            page.locator('text=/Opened file.*sample\\.har/i')
        ).toBeVisible({ timeout: 10000 });

        // Check requests are displayed
        await expect(page.locator('text=/2.*requests/i')).toBeVisible();
    });

    test('should show error for invalid file format', async ({ page }) => {
        await page.goto('/');

        // Upload non-JSON file by creating a text file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This is not a JSON file')
        });

        // Wait for error toast
        await expect(
            page.locator('text=/Only json files are supported/i')
        ).toBeVisible({ timeout: 5000 });

        // Verify no requests added
        await expect(page.locator('text=No items')).toBeVisible();
    });

    test('should show error for malformed HAR file', async ({ page }) => {
        await page.goto('/');

        // Upload invalid JSON file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/invalid.json')
        );

        // Wait for error toast
        await expect(
            page.locator('text=/Invalid HAR file/i')
        ).toBeVisible({ timeout: 5000 });

        // Verify no requests added
        await expect(page.locator('text=No items')).toBeVisible();
    });

    test.fixme('should handle empty HAR file', async ({ page }) => {
        await page.goto('/');

        // Upload empty HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/empty.har')
        );

        // File should be accepted
        await expect(
            page.locator('text=/Opened file.*empty\\.har/i')
        ).toBeVisible({ timeout: 5000 });

        // Should show "No items" message
        await expect(page.locator('text=No items')).toBeVisible();

        // Request count should be 0
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
    });

    test.fixme('should import multiple files sequentially', async ({ page }) => {
        await page.goto('/');

        // Import first file
        let fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for first file to load
        await expect(page.locator('text=/2.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Import second file (empty)
        fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/empty.har')
        );

        // Wait for second file message
        await expect(
            page.locator('text=/Opened file.*empty\\.har/i')
        ).toBeVisible({ timeout: 5000 });

        // Previous data should be cleared, showing 0 requests
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
        await expect(page.locator('text=No items')).toBeVisible();
    });
});
