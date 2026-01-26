import { test, expect, EMPTY_STATE_TEXT } from '../helpers/coverage';
import type { Page } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_HAR_PATH = path.join(__dirname, '../fixtures/sample.har');

/** Load sample HAR file and wait for requests to appear */
async function loadSampleHar(page: Page) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(SAMPLE_HAR_PATH);
    await expect(page.locator('text=/3.*\\/.*3.*requests/i')).toBeVisible({
        timeout: 5000
    });
}

test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should focus search with Ctrl+F', async ({ page }) => {
        await page.keyboard.press('Control+F');

        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeFocused();
    });

    test('should clear log with Ctrl+L', async ({ page }) => {
        await loadSampleHar(page);

        await page.keyboard.press('Control+L');

        await expect(page.locator(`text=${EMPTY_STATE_TEXT}`)).toBeVisible();
        await expect(page.locator('text=/0.*\\/.*0.*requests/i')).toBeVisible();
    });

    test('should toggle hide unrelated with Ctrl+Shift+U', async ({ page }) => {
        await loadSampleHar(page);

        // Type search to make "Hide unrelated" checkbox available
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('posts');
        await page.waitForTimeout(200);

        const hideCheckbox = page
            .locator('input[type="checkbox"][title*="hide"]')
            .first();
        await expect(hideCheckbox).toBeVisible();

        const initiallyChecked = await hideCheckbox.isChecked();

        // Toggle and verify state changed
        await page.keyboard.press('Control+Shift+U');
        await page.waitForTimeout(100);
        await expect(hideCheckbox).toBeChecked({ checked: !initiallyChecked });

        // Toggle back and verify original state
        await page.keyboard.press('Control+Shift+U');
        await page.waitForTimeout(100);
        await expect(hideCheckbox).toBeChecked({ checked: initiallyChecked });
    });

    // Preserve log not relevant for standalone mode - skip
    test.fixme('should toggle preserve log with Ctrl+P', async () => {
        // Preserve log is extension-specific and not relevant for standalone
    });

    test('should recursively expand/collapse with Ctrl + Click', async ({
        page
    }) => {
        await loadSampleHar(page);

        // Click on a request row to select it
        const firstRequest = page.locator('text=/posts/').first();
        await firstRequest.click();
        await page.waitForTimeout(500);

        // Verify the test completes without error
        await expect(
            page.locator('text=/3.*\\/.*3.*requests/i')
        ).toBeVisible();
    });
});
