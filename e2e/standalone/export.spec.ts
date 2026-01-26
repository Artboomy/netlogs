import { test, expect, EMPTY_STATE_TEXT } from '../helpers/coverage';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Export Functionality', () => {
    test('should export all visible requests', async ({ page }) => {
        await page.goto('/');

        // Load sample HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for data to load (2 entries + 1 synthetic "file opened" entry)
        await expect(page.locator('text=/3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Set up download listener
        const downloadPromise = page.waitForEvent('download');

        // Click export button
        const exportButton = page.locator('button[title*="Export"]');
        await exportButton.click();

        // Wait for export toast
        await expect(page.locator('text=/Export/i')).toBeVisible({
            timeout: 3000
        });

        // Wait for download
        const download = await downloadPromise;

        // Verify filename contains timestamp (ISO format)
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);

        // Save and verify file is valid JSON
        const downloadPath = await download.path();
        if (downloadPath) {
            const content = fs.readFileSync(downloadPath, 'utf-8');
            const har = JSON.parse(content);

            // Verify HAR structure (2 entries + 1 synthetic "file opened" entry)
            expect(har.log).toBeDefined();
            expect(har.log.entries).toBeDefined();
            expect(har.log.entries).toHaveLength(3);
        }
    });

    test('should export all requests regardless of filter', async ({ page }) => {
        await page.goto('/');

        // Load sample HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        await expect(page.locator('text=/3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Apply filter to show only 1 request in UI
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('posts');
        await page.waitForTimeout(200);

        // Verify filtered count (1 posts entry out of 3 total)
        await expect(page.locator('text=/1.*\\/.*3.*requests/i')).toBeVisible();

        // Set up download listener
        const downloadPromise = page.waitForEvent('download');

        // Click export
        const exportButton = page.locator('button[title*="Export"]');
        await exportButton.click();

        // Wait for download
        const download = await downloadPromise;
        const downloadPath = await download.path();

        if (downloadPath) {
            const content = fs.readFileSync(downloadPath, 'utf-8');
            const har = JSON.parse(content);

            // Should export ALL requests (ignoring filter to avoid hiding important data)
            expect(har.log.entries).toHaveLength(3);
        }
    });

    test('should export with empty list', async ({ page }) => {
        await page.goto('/');

        // Verify no items
        await expect(page.locator(`text=${EMPTY_STATE_TEXT}`)).toBeVisible();

        // Set up download listener
        const downloadPromise = page.waitForEvent('download');

        // Click export
        const exportButton = page.locator('button[title*="Export"]');
        await exportButton.click();

        // Wait for download
        const download = await downloadPromise;
        const downloadPath = await download.path();

        if (downloadPath) {
            const content = fs.readFileSync(downloadPath, 'utf-8');
            const har = JSON.parse(content);

            // Should be valid HAR with empty entries
            expect(har.log).toBeDefined();
            expect(har.log.entries).toBeDefined();
            expect(har.log.entries).toHaveLength(0);
        }
    });
});
