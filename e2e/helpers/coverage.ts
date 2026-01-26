import { Page, test as base, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extended test with coverage collection
 *
 * Usage:
 * import { test, expect } from './helpers/coverage';
 *
 * test('my test', async ({ page }) => {
 *   // Coverage is automatically collected
 * });
 */

const coverageDir = path.join(process.cwd(), 'coverage-e2e', '.nyc_output');

// Ensure coverage directory exists
if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
}

async function collectCoverage(page: Page, testInfo: TestInfo) {
    try {
        // Collect V8 coverage from the page
        const coverage = await page.evaluate(() => {
            // @ts-expect-error - window.__coverage__ is added by vite-plugin-istanbul
            return window.__coverage__;
        });

        if (coverage) {
            const coverageFile = path.join(
                coverageDir,
                `coverage-${testInfo.testId}-${Date.now()}.json`
            );
            fs.writeFileSync(coverageFile, JSON.stringify(coverage));
        }
    } catch (error) {
        console.warn('Failed to collect coverage:', error);
    }
}

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        // Run the test
        await use(page);

        // Collect coverage after test completes
        await collectCoverage(page, testInfo);
    }
});

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';

export const EMPTY_STATE_TEXT = 'Drop *.har or *.har.zip here';
