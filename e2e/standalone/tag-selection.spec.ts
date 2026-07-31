import { test, expect } from '../helpers/coverage';
import type { Page } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILTERING_HAR_PATH = path.join(__dirname, '../fixtures/filtering-test.har');
const SETTINGS_STORAGE_KEY = 'netlogs_settings';

async function loadFilteringFixture(page: Page) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FILTERING_HAR_PATH);
    await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible({
        timeout: 10000
    });
}

async function getSavedHiddenTags(
    page: Page
): Promise<Record<string, string>> {
    return page.evaluate((storageKey) => {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw).hiddenTags ?? {} : {};
    }, SETTINGS_STORAGE_KEY);
}

test.describe('Tag selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
        await loadFilteringFixture(page);
    });

    test('single tap persists the selected tag in settings', async ({ page }) => {
        const postTag = page.locator('button:has-text("POST/201")');
        await postTag.click();
        await page.waitForTimeout(350);
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        const hiddenTags = await getSavedHiddenTags(page);
        await expect(hiddenTags).toMatchObject({
            OPTIONS: 'OPTIONS',
            'POST/201': 'POST/201'
        });
    });

    test('double tap temporarily selects one tag and reverts', async ({ page }) => {
        const postTag = page.locator('button:has-text("POST/201")');
        const putTag = page.locator('button:has-text("PUT")');

        await postTag.click();
        await page.waitForTimeout(350);
        await expect(page.locator('text=/5.*\/.*6.*requests/i')).toBeVisible();

        await putTag.dblclick();
        await expect(page.locator('text=/1.*\/.*6.*requests/i')).toBeVisible({
            timeout: 5000
        });
        const hiddenTagsAfterDoubleTap = await getSavedHiddenTags(page);
        await expect(hiddenTagsAfterDoubleTap).toMatchObject({
            OPTIONS: 'OPTIONS',
            'POST/201': 'POST/201'
        });
        await expect(hiddenTagsAfterDoubleTap).not.toHaveProperty('PUT');

        await putTag.dblclick();
        await expect(page.locator('text=/5.*\/.*6.*requests/i')).toBeVisible({
            timeout: 5000
        });
        const hiddenTagsAfterRevert = await getSavedHiddenTags(page);
        await expect(hiddenTagsAfterRevert).toMatchObject({
            OPTIONS: 'OPTIONS',
            'POST/201': 'POST/201'
        });
        await expect(hiddenTagsAfterRevert).not.toHaveProperty('PUT');
    });
});
