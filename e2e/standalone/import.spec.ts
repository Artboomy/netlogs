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

    test('should import valid HAR file via file input', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Upload file via file input
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for success message
        await expect(
            page.locator('text=/Opened file.*sample\\.har/i')
        ).toBeVisible({ timeout: 10000 });

        // Check that requests are displayed (2 HAR entries + 1 synthetic "Opened file" = 3 total)
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible();

        // Verify specific request is visible (pathname shown, not domain)
        await expect(page.locator('text=/posts/')).toBeVisible();
    });

    // TODO: Programmatic drag & drop via dispatchEvent doesn't trigger drop handler
    // File input test covers the same import functionality
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

        // Wait for success message
        await expect(
            page.locator('text=/Opened file.*sample\\.har/i')
        ).toBeVisible({ timeout: 10000 });

        // Check requests are displayed (2 HAR entries + 1 synthetic = 3 total)
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible();
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

    test('should handle empty HAR file', async ({ page }) => {
        await page.goto('/');

        // Upload empty HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/empty.har')
        );

        // File should be accepted - synthetic "Opened file" entry is added
        await expect(
            page.locator('text=/Opened file.*empty\\.har/i')
        ).toBeVisible({ timeout: 5000 });

        // With 0 HAR entries + 1 synthetic = 1 item, footer shows "1 / 1 requests"
        await expect(page.locator('text=/1.*\\/.*1.*requests/i')).toBeVisible();
    });

    test('should import multiple files sequentially', async ({ page }) => {
        await page.goto('/');

        // Import first file
        let fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for first file to load (2 HAR + 1 synthetic = 3)
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Import second file (filtering-test.har for more variety)
        fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/filtering-test.har')
        );

        // Wait for second file message
        await expect(
            page.locator('text=/Opened file.*filtering-test\\.har/i')
        ).toBeVisible({ timeout: 5000 });

        // New file should replace old data (5 HAR + 1 synthetic = 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });
});
