import { test, expect } from '../helpers/coverage';

test.describe('Application Loading & Initialization', () => {
    test('should load page successfully', async ({ page }) => {
        await page.goto('/');

        // Check page title
        await expect(page).toHaveTitle('NET LOGS');

        // Check that header is visible
        await expect(page.locator('header')).toBeVisible();

        // Check that footer is visible
        await expect(page.locator('footer')).toBeVisible();

        // Check that "No items" message is displayed
        await expect(page.locator('text=No items')).toBeVisible();
    });

    test('should load all static assets correctly', async ({ page }) => {
        const responses: {
            url: string;
            status: number;
            contentType: string;
        }[] = [];

        // Capture all responses
        page.on('response', (response) => {
            responses.push({
                url: response.url(),
                status: response.status(),
                contentType: response.headers()['content-type'] || ''
            });
        });

        await page.goto('/');

        // Wait for all resources to load
        await page.waitForLoadState('networkidle');

        // Check CSS loaded successfully
        const cssResponse = responses.find((r) => r.url.endsWith('.css'));
        expect(cssResponse).toBeDefined();
        expect(cssResponse?.status).toBe(200);
        expect(cssResponse?.contentType).toContain('text/css');

        // Check JavaScript module loaded successfully
        const jsResponse = responses.find((r) => r.url.endsWith('.mjs'));
        expect(jsResponse).toBeDefined();
        expect(jsResponse?.status).toBe(200);
        expect(jsResponse?.contentType).toContain('application/javascript');

        // Check SVG icon file loaded successfully with correct MIME type
        const svgResponse = responses.find((r) => r.url.includes('.svg'));
        expect(svgResponse).toBeDefined();
        expect(svgResponse?.status).toBe(200);
        expect(svgResponse?.contentType).toContain('image/svg+xml');

        // Check no console errors
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        expect(consoleErrors).toHaveLength(0);
    });

    test('should render all header icons correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check that icon buttons are visible
        const iconButtons = [
            'Clear',
            'Filter options',
            'Case sensitive',
            'Unpack JSON',
            'Switch to vertical',
            'Import',
            'Export log'
        ];

        for (const buttonText of iconButtons) {
            const button = page
                .locator(`button[title*="${buttonText}"]`)
                .first();
            await expect(button).toBeVisible();

            // Check that button has an icon (div child with mask)
            const hasIcon = await button.locator('div').count();
            if (hasIcon > 0) {
                const iconDiv = button.locator('div').first();
                const maskImage = await iconDiv.evaluate((el) => {
                    return window.getComputedStyle(el).webkitMaskImage;
                });
                // Icon should have a mask image (SVG sprite)
                expect(maskImage).toContain('url');
            }
        }
    });
});
