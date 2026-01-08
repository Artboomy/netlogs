import { test, expect } from '../helpers/coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Filtering & Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Load filtering test HAR file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/filtering-test.har')
        );

        // Wait for data to load (5 requests + 1 "Opened file" message = 6 items, but footer shows 5 requests)
        await expect(page.locator('text=/5.*requests/i')).toBeVisible({
            timeout: 10000
        });
    });

    test('should filter by URL in footer', async ({ page }) => {
        // Type URL filter
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');

        // Wait for filtering to apply (debounced)
        await page.waitForTimeout(200);

        // Should show user-related requests (4 HAR entries + 1 synthetic = 5 out of 6 total)
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Verify filtered requests are visible (URL displays as "/users")
        await expect(page.locator('text=/\\/users/').first()).toBeVisible();

        // Clear filter
        await filterInput.clear();
        await page.waitForTimeout(200);

        // All requests should be visible again (5 HAR + 1 synthetic = 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });

    test('should filter by URL segments in sidebar (REST)', async ({
        page
    }) => {
        // Open URL segments sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Wait for sidebar to open
        await expect(page.locator('input#methodSearch')).toBeVisible();

        // Uncheck "posts" URL segment - should hide 1 request
        // Find the checkbox in the same div as the text "posts"
        const postsCheckbox = page
            .locator('div:has-text("posts") > input[type="checkbox"]')
            .first();
        await postsCheckbox.uncheck();

        // Wait for filter to apply
        await page.waitForTimeout(200);

        // Should show 4 users requests + 1 synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Re-check posts
        const postsCheckboxAgain = page
            .locator('div:has-text("posts") > input[type="checkbox"]')
            .first();
        await postsCheckboxAgain.check();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });

    test('should filter by JSON-RPC methods in sidebar', async ({ page }) => {
        // Load JSON-RPC test file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/jsonrpc-test.har')
        );

        // Wait for data to load (3 RPC requests + 1 synthetic = 4 total)
        await expect(page.locator('text=/4.*requests/i')).toBeVisible({
            timeout: 10000
        });

        // Open methods sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Wait for sidebar to open
        await expect(page.locator('input#methodSearch')).toBeVisible();

        // Uncheck "product" namespace - should hide 1 request
        const productCheckbox = page
            .locator('div:has-text("product") > input[type="checkbox"]')
            .first();
        await productCheckbox.uncheck();

        // Wait for filter to apply
        await page.waitForTimeout(200);

        // Should show 2 user methods + 1 synthetic = 3 / 4 total
        await expect(page.locator('text=/3.*\\/.*4.*requests/i')).toBeVisible();

        // Re-check product
        const productCheckboxAgain = page
            .locator('div:has-text("product") > input[type="checkbox"]')
            .first();
        await productCheckboxAgain.check();
        await page.waitForTimeout(200);

        // All requests visible again (3 RPC + 1 synthetic = 4 / 4)
        await expect(page.locator('text=/4.*\\/.*4.*requests/i')).toBeVisible();
    });

    test('should filter by GraphQL operations with dot notation in sidebar', async ({
        page
    }) => {
        // Load GraphQL test file with dot notation (User.Get, Product.List, User.Update)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/graphql-dot-notation.har')
        );

        // Wait for data to load (3 GraphQL requests + 1 synthetic = 4 total)
        await expect(page.locator('text=/4.*requests/i')).toBeVisible({
            timeout: 10000
        });

        // Open methods sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Wait for sidebar to open
        await expect(page.locator('input#methodSearch')).toBeVisible();

        // Uncheck "Product" namespace - should hide 1 request (Product.List)
        const productCheckbox = page
            .locator('div:has-text("Product") > input[type="checkbox"]')
            .first();
        await productCheckbox.uncheck();

        // Wait for filter to apply
        await page.waitForTimeout(200);

        // Should show 2 User operations + 1 synthetic = 3 / 4 total
        await expect(page.locator('text=/3.*\\/.*4.*requests/i')).toBeVisible();

        // Re-check Product
        const productCheckboxAgain = page
            .locator('div:has-text("Product") > input[type="checkbox"]')
            .first();
        await productCheckboxAgain.check();
        await page.waitForTimeout(200);

        // All requests visible again (3 GraphQL + 1 synthetic = 4 / 4)
        await expect(page.locator('text=/4.*\\/.*4.*requests/i')).toBeVisible();
    });

    // TODO: Implement sidebar tree parsing for GraphQL operations without dot notation
    // Currently operationName like "GetUser" doesn't create a tree structure in sidebar
    // Need to either: parse operation type (query/mutation) as namespace, or require dot notation
    test.fixme(
        'should filter by GraphQL operations without dot notation in sidebar',
        async ({ page }) => {
            // Load GraphQL test file without dot notation (GetUser, ListProducts, UpdateUser)
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(
                path.join(__dirname, '../fixtures/graphql-test.har')
            );

            // Wait for data to load (3 GraphQL requests + 1 synthetic = 4 total)
            await expect(page.locator('text=/4.*requests/i')).toBeVisible({
                timeout: 10000
            });

            // Open methods sidebar
            const sidebarButton = page.locator('button[title*="visible URLs"]');
            await sidebarButton.click();

            // Wait for sidebar to open
            await expect(page.locator('input#methodSearch')).toBeVisible();

            // Operations like "GetUser", "ListProducts" should appear in sidebar
            // and be filterable (currently they don't appear because no dot notation)
            const getUserCheckbox = page
                .locator('div:has-text("GetUser") > input[type="checkbox"]')
                .first();
            await getUserCheckbox.uncheck();

            await page.waitForTimeout(200);

            // Should show 2 operations + 1 synthetic = 3 / 4 total
            await expect(
                page.locator('text=/3.*\\/.*4.*requests/i')
            ).toBeVisible();
        }
    );

    test('should handle GraphQL requests without operationName', async ({
        page
    }) => {
        // Load GraphQL test file without operationName (anonymous queries)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
            path.join(__dirname, '../fixtures/graphql-no-operation.har')
        );

        // Wait for data to load (3 GraphQL requests + 1 synthetic = 4 total)
        await expect(page.locator('text=/4.*requests/i')).toBeVisible({
            timeout: 10000
        });

        // Open methods sidebar
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();

        // Wait for sidebar to open
        await expect(page.locator('input#methodSearch')).toBeVisible();

        // Without operationName, requests should fall back to URL-based filtering
        // All 3 requests go to /graphql, so "graphql" should appear in sidebar
        const graphqlCheckbox = page
            .locator('div:has-text("graphql") > input[type="checkbox"]')
            .first();
        await graphqlCheckbox.uncheck();

        // Wait for filter to apply
        await page.waitForTimeout(200);

        // Should show only synthetic entry = 1 / 4 total
        await expect(page.locator('text=/1.*\\/.*4.*requests/i')).toBeVisible();

        // Re-check graphql
        const graphqlCheckboxAgain = page
            .locator('div:has-text("graphql") > input[type="checkbox"]')
            .first();
        await graphqlCheckboxAgain.check();
        await page.waitForTimeout(200);

        // All requests visible again (3 GraphQL + 1 synthetic = 4 / 4)
        await expect(page.locator('text=/4.*\\/.*4.*requests/i')).toBeVisible();
    });

    test('should apply combined filters (URL + footer tag)', async ({
        page
    }) => {
        // Fixture has: GET /users, POST/201 /users, GET /posts, PUT /users/1, DELETE/204 /users/1
        // Total: 5 HAR entries + 1 synthetic = 6 requests
        // Note: Synthetic entry (Opened file) bypasses URL filter

        // Click on POST/201 tag in footer to hide POST requests
        const postTag = page.locator('button:has-text("POST/201")');
        await postTag.click();
        await page.waitForTimeout(200);

        // Should show: GET /users, GET /posts, PUT /users/1, DELETE/204 /users/1 + synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Apply URL filter for "users"
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');
        await page.waitForTimeout(200);

        // Should show: GET /users, PUT /users/1, DELETE/204 /users/1 + synthetic (bypasses URL filter) = 4 / 6
        await expect(page.locator('text=/4.*\\/.*6.*requests/i')).toBeVisible();

        // Re-enable POST/201 tag
        await postTag.click();
        await page.waitForTimeout(200);

        // Should show all users requests + synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Clear URL filter
        await filterInput.clear();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });

    test('should filter by MIME type', async ({ page }) => {
        // Fixture has 2 MIME types: application/json (4 entries) and text/plain (1 entry: DELETE)
        // Total: 5 HAR entries + 1 synthetic = 6 requests
        // Initially all MIME types are selected

        // Click on the MIME type dropdown
        const mimeDropdown = page.locator('text=/MIME/i').first();
        await mimeDropdown.click();

        // Wait for dropdown to open
        await page.waitForTimeout(100);

        // Uncheck text/plain to hide DELETE request
        const textPlainOption = page.locator('label:has-text("text/plain")');
        await textPlainOption.click();
        await page.waitForTimeout(200);

        // Click outside to close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Should show 4 JSON requests + 1 synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Re-open dropdown and re-check text/plain
        await mimeDropdown.click();
        await page.waitForTimeout(100);
        await textPlainOption.click();
        await page.waitForTimeout(200);

        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });

    test('should filter by HTTP method using footer tags', async ({ page }) => {
        // Fixture has: GET (2x), POST/201 (1x), PUT (1x), DELETE/204 (1x)
        // Total: 5 HAR entries + 1 synthetic = 6 requests

        // Verify all tags are visible in footer
        await expect(page.locator('button:has-text("GET")')).toBeVisible();
        await expect(page.locator('button:has-text("POST/201")')).toBeVisible();
        await expect(page.locator('button:has-text("PUT")')).toBeVisible();
        await expect(page.locator('button:has-text("DELETE/204")')).toBeVisible();

        // Hide GET requests (2 requests)
        const getTag = page.locator('button:has-text("GET")').first();
        await getTag.click();
        await page.waitForTimeout(200);

        // Should show 3 non-GET requests + 1 synthetic = 4 / 6
        await expect(page.locator('text=/4.*\\/.*6.*requests/i')).toBeVisible();

        // Also hide PUT requests
        const putTag = page.locator('button:has-text("PUT")');
        await putTag.click();
        await page.waitForTimeout(200);

        // Should show 2 requests (POST + DELETE) + 1 synthetic = 3 / 6
        await expect(page.locator('text=/3.*\\/.*6.*requests/i')).toBeVisible();

        // Re-enable GET
        await getTag.click();
        await page.waitForTimeout(200);

        // Should show 4 requests + 1 synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Re-enable PUT
        await putTag.click();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });

    test('should clear all filters', async ({ page }) => {
        // Fixture: 5 HAR entries + 1 synthetic = 6 requests
        // Note: synthetic entry bypasses URL filter

        // 1. Apply URL filter
        const filterInput = page.locator('input[placeholder*="Filter by url"]');
        await filterInput.fill('users');
        await page.waitForTimeout(200);

        // Verify filtered: 4 users requests + 1 synthetic = 5 / 6
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Clear URL filter
        await filterInput.clear();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();

        // 2. Apply footer tag filter (hide POST)
        const postTag = page.locator('button:has-text("POST/201")');
        await postTag.click();
        await page.waitForTimeout(200);

        // Verify filtered: 5 / 6 (POST hidden)
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Clear footer tag filter (re-enable POST)
        await postTag.click();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();

        // 3. Apply sidebar URL segment filter
        const sidebarButton = page.locator('button[title*="visible URLs"]');
        await sidebarButton.click();
        await expect(page.locator('input#methodSearch')).toBeVisible();

        // Uncheck "posts" URL segment
        const postsCheckbox = page
            .locator('div:has-text("posts") > input[type="checkbox"]')
            .first();
        await postsCheckbox.uncheck();
        await page.waitForTimeout(200);

        // Verify filtered: 5 / 6 (posts hidden)
        await expect(page.locator('text=/5.*\\/.*6.*requests/i')).toBeVisible();

        // Clear sidebar filter (re-check posts)
        await postsCheckbox.check();
        await page.waitForTimeout(200);

        // All requests visible again (6 / 6)
        await expect(page.locator('text=/6.*\\/.*6.*requests/i')).toBeVisible();
    });
});
