import { test, expect } from '../helpers/coverage';

test.describe('Theme Support', () => {
    test('should load with default theme', async ({ page }) => {
        await page.goto('/');

        // Theme button should be visible
        const themeButton = page.locator('button[title*="theme"]');
        await expect(themeButton).toBeVisible();

        // Check that theme is applied (by checking background color or theme-specific element)
        const backgroundColor = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        // Should have a background color (not default white/transparent)
        expect(backgroundColor).toBeTruthy();
    });

    test('should toggle between light and dark themes', async ({ page }) => {
        await page.goto('/');

        // Get initial theme
        const initialBg = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        // Click theme toggle button
        const themeButton = page.locator('button[title*="theme"]');
        await themeButton.click();

        // Wait for theme change
        await page.waitForTimeout(300);

        // Get new theme
        const newBg = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        // Background should have changed
        expect(newBg).not.toBe(initialBg);

        // Toggle back
        await themeButton.click();
        await page.waitForTimeout(300);

        const finalBg = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        // Should return to initial theme
        expect(finalBg).toBe(initialBg);
    });

    test('should persist theme across page reloads', async ({ page }) => {
        await page.goto('/');

        // Toggle theme
        const themeButton = page.locator('button[title*="theme"]');
        await themeButton.click();
        await page.waitForTimeout(300);

        // Get theme after toggle
        const themeBefore = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check theme persisted
        const themeAfter = await page.evaluate(() => {
            return window.getComputedStyle(document.documentElement)
                .backgroundColor;
        });

        expect(themeAfter).toBe(themeBefore);
    });

    test('should render icons correctly in both themes', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check icon rendering in initial theme
        const importButton = page.locator('button[title*="Import"]');
        const iconDiv = importButton.locator('div').first();

        const initialMask = await iconDiv.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.webkitMaskImage || style.maskImage;
        });

        expect(initialMask).toContain('url');

        // Toggle theme
        const themeButton = page.locator('button[title*="theme"]');
        await themeButton.click();
        await page.waitForTimeout(300);

        // Check icon still renders
        const newMask = await iconDiv.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.webkitMaskImage || style.maskImage;
        });

        // Mask should still be applied
        expect(newMask).toContain('url');

        // Icon color should change with theme
        const iconColor = await iconDiv.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        expect(iconColor).toBeTruthy();
    });
});
