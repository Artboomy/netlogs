import { test, expect, EMPTY_STATE_TEXT } from '../helpers/coverage';

test.describe('Language Select', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('should display language select in footer', async ({ page }) => {
        const select = page.locator('select[title="Language"]');
        await expect(select).toBeVisible();

        // Default language should be English
        await expect(select).toHaveValue('en-US');
    });

    test('should change language, verify change, reload and verify persistence', async ({
        page
    }) => {
        const select = page.locator('select[title="Language"]');
        await expect(select).toHaveValue('en-US');

        // Verify initial English text (standalone shows "Drop *.har or *.har.zip here")
        await expect(
            page.locator(`text=${EMPTY_STATE_TEXT}`)
        ).toBeVisible();

        // Change language to Russian
        await select.selectOption('ru-RU');

        // Page reloads automatically — wait for it
        await page.waitForLoadState('networkidle');

        // Verify text changed to Russian
        await expect(
            page.locator('text=Перетащите *.har или *.har.zip сюда')
        ).toBeVisible({ timeout: 5000 });

        // Verify select preserved the value
        await expect(page.locator('select[title]')).toHaveValue('ru-RU');

        // Manually reload to verify persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Language should still be Russian
        await expect(
            page.locator('text=Перетащите *.har или *.har.zip сюда')
        ).toBeVisible({ timeout: 5000 });
        await expect(page.locator('select[title]')).toHaveValue('ru-RU');
    });
});
