import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('UI Interactions & Controls', () => {
    test('should clear log with clear button', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load sample HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );

        // Wait for data to load (2 HAR entries + 1 synthetic = 3)
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Click clear button (trash icon)
        const clearButton = page.locator('button[title*="Clear"]');
        await clearButton.click();

        // Verify all requests removed
        await expect(page.locator('text=No items')).toBeVisible();
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
    });

    test('should toggle filter options panel', async ({ page }) => {
        await page.goto('/');

        // Click filter options button (gear/settings icon)
        const filterOptionsButton = page.locator(
            'button[title*="Filter options"], button[title*="filter options"]'
        );
        await filterOptionsButton.click();

        // Second row with "Preserve log" label should appear (use exact match)
        const preserveLabel = page.locator('label:has-text("Preserve log")');
        await expect(preserveLabel).toBeVisible();

        // Click again to hide
        await filterOptionsButton.click();

        // Panel should be hidden
        await expect(preserveLabel).not.toBeVisible();
    });

    // NOTE: preserveLog only preserves data during page navigation, NOT during manual clear
    // This is extension-specific behavior that's harder to test in standalone mode
    test.fixme('should respect preserve log checkbox', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load data (2 HAR + 1 synthetic = 3)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Open filter options and check preserve log
        const filterOptionsButton = page.locator(
            'button[title*="Filter options"], button[title*="filter options"]'
        );
        await filterOptionsButton.click();

        const preserveCheckbox = page.locator(
            'input[type="checkbox"][id*="preserve"], label:has-text("Preserve") input[type="checkbox"]'
        ).first();
        await preserveCheckbox.check();

        // preserveLog only works during navigation, not manual clear
        // In extension mode, this preserves data when navigating to a new page
    });

    test('should toggle vertical view mode', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Load data first (2 HAR + 1 synthetic = 3)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Click vertical view button
        const verticalViewButton = page.locator(
            'button[title*="vertical"], button[title*="Vertical"]'
        );
        await verticalViewButton.click();

        // Wait a moment for layout change
        await page.waitForTimeout(300);

        // Click again to toggle back
        await verticalViewButton.click();
        await page.waitForTimeout(300);

        // Data should still be visible
        await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible();
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
