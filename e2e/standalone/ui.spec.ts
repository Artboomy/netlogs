import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('UI Interactions & Controls', () => {
    test.fixme('should clear log with clear button', async ({ page }) => {
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

        // Click clear button
        const clearButton = page.locator('button[title*="Clear"]');
        await clearButton.click();

        // Verify all requests removed
        await expect(page.locator('text=No items')).toBeVisible();
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
    });

    test.fixme('should toggle filter options panel', async ({ page }) => {
        await page.goto('/');

        // Click filter options button
        const filterOptionsButton = page.locator(
            'button[title*="Filter options"]'
        );
        await filterOptionsButton.click();

        // Second row with "Preserve log" should appear
        const preserveCheckbox = page.locator('text=Preserve log');
        await expect(preserveCheckbox).toBeVisible();

        // Button should appear active (can check aria or class if implemented)
        // For now just verify panel is visible

        // Click again to hide
        await filterOptionsButton.click();

        // Panel should be hidden
        await expect(preserveCheckbox).not.toBeVisible();
    });

    test.fixme('should respect preserve log checkbox', async ({ page }) => {
        await page.goto('/');

        // Load data
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Open filter options and check preserve log
        const filterOptionsButton = page.locator(
            'button[title*="Filter options"]'
        );
        await filterOptionsButton.click();

        const preserveCheckbox = page.locator(
            'label:has-text("Preserve log") input[type="checkbox"]'
        );
        await preserveCheckbox.check();

        // Try to clear
        const clearButton = page.locator('button[title*="Clear"]');
        await clearButton.click();

        // Requests should NOT be removed when preserve is checked
        await expect(page.locator('text=/5.*requests/i')).toBeVisible();
    });

    test.fixme('should toggle vertical view mode', async ({ page }) => {
        await page.goto('/');

        // Load data first
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Click vertical view button
        const verticalViewButton = page.locator(
            'button[title*="vertical view"]'
        );
        await verticalViewButton.click();

        // Wait a moment for layout change
        await page.waitForTimeout(300);

        // Layout should change (we can verify by checking computed styles or layout changes)
        // For now, just verify button state could change

        // Click again to toggle back
        await verticalViewButton.click();
        await page.waitForTimeout(300);
    });

    test('should adapt to mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Header should still be visible
        await expect(page.locator('header')).toBeVisible();

        // Footer should still be visible
        await expect(page.locator('footer')).toBeVisible();

        // Controls should be accessible (may be rearranged)
        const importButton = page.locator('button[title*="Import"]');
        await expect(importButton).toBeVisible();

        // Verify no horizontal scrolling needed
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(375);
    });
});
