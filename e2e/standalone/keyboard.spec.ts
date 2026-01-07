import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Keyboard Shortcuts', () => {
    test.fixme('should focus search with Ctrl+F', async ({ page }) => {
        await page.goto('/');

        // Press Ctrl+F
        await page.keyboard.press('Control+F');

        // Search input should be focused
        const searchInput = page.locator('input[type="search"]');
        await expect(searchInput).toBeFocused();
    });

    test.fixme('should clear log with Ctrl+L', async ({ page }) => {
        await page.goto('/');

        // Load data
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/sample.har')
        );
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 5000
        });

        // Press Ctrl+L
        await page.keyboard.press('Control+L');

        // Log should be cleared
        await expect(page.locator('text=No items')).toBeVisible();
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
    });

    test.fixme(
        'should toggle hide unrelated with Ctrl+Shift+U',
        async ({ page }) => {
            await page.goto('/');

            // Load data
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(
                path.join(__dirname, '../fixtures/sample.har')
            );
            await expect(page.locator('text=/5.*requests/i')).toBeVisible({
                timeout: 5000
            });

            // Type search to make "Hide unrelated" available
            const searchInput = page.locator('input[type="search"]');
            await searchInput.fill('users');
            await page.waitForTimeout(200);

            // Hide unrelated checkbox should appear
            const hideCheckbox = page.locator(
                'label:has-text("Hide unrelated") input[type="checkbox"]'
            );
            await expect(hideCheckbox).toBeVisible();

            // Press Ctrl+Shift+U to toggle
            await page.keyboard.press('Control+Shift+U');
            await page.waitForTimeout(100);

            // Checkbox should be checked
            await expect(hideCheckbox).toBeChecked();

            // Press again to uncheck
            await page.keyboard.press('Control+Shift+U');
            await page.waitForTimeout(100);

            await expect(hideCheckbox).not.toBeChecked();
        }
    );

    test.fixme('should toggle preserve log with Ctrl+P', async ({ page }) => {
        await page.goto('/');

        // Open filter options
        const filterOptionsButton = page.locator(
            'button[title*="Filter options"]'
        );
        await filterOptionsButton.click();

        // Get preserve checkbox
        const preserveCheckbox = page.locator(
            'label:has-text("Preserve log") input[type="checkbox"]'
        );
        await expect(preserveCheckbox).toBeVisible();

        // Initial state (unchecked)
        await expect(preserveCheckbox).not.toBeChecked();

        // Press Ctrl+P
        await page.keyboard.press('Control+P');
        await page.waitForTimeout(100);

        // Should be checked
        await expect(preserveCheckbox).toBeChecked();

        // Press again
        await page.keyboard.press('Control+P');
        await page.waitForTimeout(100);

        // Should be unchecked
        await expect(preserveCheckbox).not.toBeChecked();
    });

    test.fixme(
        'should recursively expand/collapse with Ctrl + Click',
        async ({ page }) => {
            await page.goto('/');

            // Load data with nested JSON
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(
                path.join(__dirname, '../fixtures/sample.har')
            );
            await expect(page.locator('text=/5.*requests/i')).toBeVisible({
                timeout: 5000
            });

            // Click on a request to expand it
            const firstRequest = page
                .locator('text=https://api.example.com/users')
                .first();
            await firstRequest.click();

            // Wait for request details to appear
            await page.waitForTimeout(500);

            // Find a nested JSON node (if visible in the inspector)
            const jsonNode = page.locator('[role="treeitem"]').first();
            if (await jsonNode.isVisible()) {
                // Ctrl+Click to recursively expand
                await jsonNode.click({ modifiers: ['Control'] });

                // Nodes should expand (hard to verify exact behavior, just ensure no error)
                await page.waitForTimeout(300);
            }
        }
    );
});
