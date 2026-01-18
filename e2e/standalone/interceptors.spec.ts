import { test, expect } from '../helpers/coverage';

// Extend window interface for test helpers
declare global {
    interface Window {
        __pendingRequests: Array<{
            type: string;
            data: {
                id: string;
                timestamp: number;
                request: {
                    method: string;
                    url: string;
                    headers: Array<{ name: string; value: string }>;
                    postData?: { mimeType: string; text: string };
                };
            };
        }>;
    }
}

test.describe('Request Interceptors', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Set up message capture BEFORE installing interceptors
        await page.evaluate(() => {
            window.__pendingRequests = [];
            window.addEventListener('message', (e) => {
                if (e.data?.type === 'PENDING_REQUEST') {
                    window.__pendingRequests.push(e.data);
                }
            });
        });

        // Load the inject script from dist
        // NOTE: This requires the extension to be built first (yarn build)
        await page.addScriptTag({ path: 'dist/js/inject.mjs' });

        // Send settings message to enable interceptors
        await page.evaluate(() => {
            window.postMessage(
                {
                    type: 'settings',
                    value: JSON.stringify({ interceptRequests: true })
                },
                '*'
            );
        });

        // Small delay for interceptors to be installed
        await page.waitForTimeout(50);
    });

    test('fetch GET sends PENDING_REQUEST message', async ({ page }) => {
        // Make fetch request
        const response = await page.evaluate(async () => {
            const res = await fetch('/api/test/get');
            return res.json();
        });

        // Verify request succeeded
        expect(response.success).toBe(true);
        expect(response.method).toBe('GET');

        // Verify PENDING_REQUEST was captured
        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );
        expect(pendingRequests.length).toBeGreaterThanOrEqual(1);

        const pending = pendingRequests.find((p) =>
            p.data.request.url.includes('/api/test/get')
        );
        expect(pending).toBeDefined();
        expect(pending!.data.request.method).toBe('GET');
        expect(pending!.data.id).toBeDefined();
        expect(pending!.data.timestamp).toBeDefined();
    });

    test('fetch POST sends PENDING_REQUEST with body info', async ({
        page
    }) => {
        const response = await page.evaluate(async () => {
            const res = await fetch('/api/test/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'data' })
            });
            return res.json();
        });

        expect(response.success).toBe(true);
        expect(response.method).toBe('POST');

        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );
        const pending = pendingRequests.find((p) =>
            p.data.request.url.includes('/api/test/post')
        );

        expect(pending).toBeDefined();
        expect(pending!.data.request.method).toBe('POST');
        expect(pending!.data.request.headers).toContainEqual({
            name: 'Content-Type',
            value: 'application/json'
        });
    });

    test('XHR GET sends PENDING_REQUEST message', async ({ page }) => {
        const response = await page.evaluate(() => {
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/api/test/get');
                xhr.onload = () => resolve(JSON.parse(xhr.responseText));
                xhr.send();
            });
        });

        expect((response as { success: boolean }).success).toBe(true);

        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );
        const pending = pendingRequests.find(
            (p) =>
                p.data.request.url.includes('/api/test/get') &&
                p.data.request.method === 'GET'
        );

        expect(pending).toBeDefined();
    });

    test('XHR POST sends PENDING_REQUEST with headers and body', async ({
        page
    }) => {
        const response = await page.evaluate(() => {
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/test/post');
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('X-Custom-Header', 'test-value');
                xhr.onload = () => resolve(JSON.parse(xhr.responseText));
                xhr.send(JSON.stringify({ xhr: 'test' }));
            });
        });

        expect((response as { success: boolean }).success).toBe(true);

        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );
        const pending = pendingRequests.find(
            (p) =>
                p.data.request.url.includes('/api/test/post') &&
                p.data.request.method === 'POST'
        );

        expect(pending).toBeDefined();
        expect(pending!.data.request.headers).toContainEqual({
            name: 'Content-Type',
            value: 'application/json'
        });
        expect(pending!.data.request.headers).toContainEqual({
            name: 'X-Custom-Header',
            value: 'test-value'
        });
        expect(pending!.data.request.postData?.text).toContain('xhr');
    });

    test('PENDING_REQUEST is sent before response arrives', async ({
        page
    }) => {
        // Use slow endpoint to ensure we can check timing
        const timing = await page.evaluate(async () => {
            const beforeFetch = Date.now();
            let pendingTimestamp = 0;

            // Listen for pending request
            const listener = (e: MessageEvent) => {
                if (
                    e.data?.type === 'PENDING_REQUEST' &&
                    e.data.data.request.url.includes('/api/test/slow')
                ) {
                    pendingTimestamp = Date.now();
                }
            };
            window.addEventListener('message', listener);

            // Start fetch (will take 2 seconds)
            const fetchPromise = fetch('/api/test/slow');
            await new Promise((r) => setTimeout(r, 50)); // Small delay to let message propagate

            const pendingCaptured = pendingTimestamp > 0;
            const pendingBeforeResponse = pendingTimestamp < beforeFetch + 500; // Should be almost immediate

            await fetchPromise;
            const afterFetch = Date.now();

            window.removeEventListener('message', listener);

            return {
                pendingCaptured,
                pendingBeforeResponse,
                totalTime: afterFetch - beforeFetch
            };
        });

        expect(timing.pendingCaptured).toBe(true);
        expect(timing.pendingBeforeResponse).toBe(true);
        expect(timing.totalTime).toBeGreaterThan(1500); // Slow endpoint takes 2s
    });

    test('multiple concurrent requests each send PENDING_REQUEST', async ({
        page
    }) => {
        await page.evaluate(async () => {
            // Fire 3 requests concurrently
            await Promise.all([
                fetch('/api/test/get'),
                fetch('/api/test/get'),
                fetch('/api/test/post', { method: 'POST', body: 'test' })
            ]);
        });

        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );

        // Should have at least 3 pending requests captured
        expect(pendingRequests.length).toBeGreaterThanOrEqual(3);

        // Each should have unique ID
        const ids = pendingRequests.map((p) => p.data.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(pendingRequests.length);
    });

    test('interceptors are not installed when setting is disabled', async ({
        page
    }) => {
        // Go to a fresh page and DON'T enable interceptors
        await page.goto('/');

        await page.evaluate(() => {
            window.__pendingRequests = [];
            window.addEventListener('message', (e) => {
                if (e.data?.type === 'PENDING_REQUEST') {
                    window.__pendingRequests.push(e.data);
                }
            });
        });

        // Load inject script
        await page.addScriptTag({ path: 'dist/js/inject.mjs' });

        // Send settings with interceptRequests: false
        await page.evaluate(() => {
            window.postMessage(
                {
                    type: 'settings',
                    value: JSON.stringify({ interceptRequests: false })
                },
                '*'
            );
        });

        await page.waitForTimeout(50);

        // Make a request
        await page.evaluate(async () => {
            await fetch('/api/test/get');
        });

        // No PENDING_REQUEST should be captured
        const pendingRequests = await page.evaluate(
            () => window.__pendingRequests
        );
        expect(pendingRequests.length).toBe(0);
    });
});
