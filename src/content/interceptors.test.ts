import { describe, it, expect } from 'vitest';
import {
    generateRequestId,
    parseUrl,
    parseHeaders,
    createPendingRequestFromFetch,
    createPendingRequestFromXHR,
    createRequestKey,
    hashBody,
    requestKeyToString
} from './interceptors';

describe('interceptors', () => {
    describe('generateRequestId', () => {
        it('should return a non-empty string', () => {
            const id = generateRequestId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should return unique IDs on multiple calls', () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(generateRequestId());
            }
            expect(ids.size).toBe(100);
        });
    });

    describe('parseUrl', () => {
        it('should parse URL without query string', () => {
            const result = parseUrl('https://example.com/api/users');
            expect(result.url).toBe('https://example.com/api/users');
            expect(result.queryString).toEqual([]);
        });

        it('should parse URL with query string', () => {
            const result = parseUrl('https://example.com/api/users?page=1&limit=10');
            expect(result.url).toBe('https://example.com/api/users?page=1&limit=10');
            expect(result.queryString).toEqual([
                { name: 'page', value: '1' },
                { name: 'limit', value: '10' }
            ]);
        });

        it('should handle relative URLs', () => {
            const result = parseUrl('/api/users?id=123');
            expect(result.url).toContain('/api/users');
            expect(result.queryString).toEqual([{ name: 'id', value: '123' }]);
        });

        it('should handle URL-encoded query parameters', () => {
            const result = parseUrl(
                'https://example.com/search?q=hello%20world&tag=test%26value'
            );
            expect(result.queryString).toContainEqual({
                name: 'q',
                value: 'hello world'
            });
            expect(result.queryString).toContainEqual({
                name: 'tag',
                value: 'test&value'
            });
        });

        it('should handle invalid URLs gracefully', () => {
            const result = parseUrl('not-a-valid-url');
            expect(result.queryString).toEqual([]);
        });
    });

    describe('parseHeaders', () => {
        it('should return empty array for undefined headers', () => {
            const result = parseHeaders(undefined);
            expect(result).toEqual([]);
        });

        it('should parse Headers object', () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            headers.set('Authorization', 'Bearer token');

            const result = parseHeaders(headers);
            // Headers object may normalize case differently in different environments
            const contentTypeHeader = result.find(
                (h) => h.name.toLowerCase() === 'content-type'
            );
            const authHeader = result.find(
                (h) => h.name.toLowerCase() === 'authorization'
            );
            expect(contentTypeHeader?.value).toBe('application/json');
            expect(authHeader?.value).toBe('Bearer token');
        });

        it('should parse Record<string, string> headers', () => {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            };

            const result = parseHeaders(headers);
            expect(result).toContainEqual({
                name: 'Content-Type',
                value: 'application/json'
            });
            expect(result).toContainEqual({ name: 'Accept', value: 'application/json' });
        });

        it('should parse array of tuples', () => {
            const headers: [string, string][] = [
                ['Content-Type', 'application/json'],
                ['X-Custom-Header', 'custom-value']
            ];

            const result = parseHeaders(headers);
            expect(result).toContainEqual({
                name: 'Content-Type',
                value: 'application/json'
            });
            expect(result).toContainEqual({
                name: 'X-Custom-Header',
                value: 'custom-value'
            });
        });
    });

    describe('createPendingRequestFromFetch', () => {
        it('should create pending request from simple URL string', () => {
            const result = createPendingRequestFromFetch(
                'https://example.com/api/users'
            );

            expect(result.id).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(result.request.method).toBe('GET');
            expect(result.request.url).toBe('https://example.com/api/users');
            expect(result.request.httpVersion).toBe('HTTP/1.1');
            expect(result.request.postData).toBeUndefined();
        });

        it('should create pending request with POST method and body', () => {
            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'John' })
                }
            );

            expect(result.request.method).toBe('POST');
            expect(result.request.headers).toContainEqual({
                name: 'Content-Type',
                value: 'application/json'
            });
            expect(result.request.postData).toBeDefined();
            expect(result.request.postData?.mimeType).toBe('application/json');
            expect(result.request.postData?.text).toBe('{"name":"John"}');
        });

        it('should create pending request from URL object', () => {
            const url = new URL('https://example.com/api/users?page=1');
            const result = createPendingRequestFromFetch(url);

            expect(result.request.url).toBe('https://example.com/api/users?page=1');
            expect(result.request.queryString).toContainEqual({
                name: 'page',
                value: '1'
            });
        });

        it('should handle URLSearchParams body', () => {
            const params = new URLSearchParams();
            params.set('name', 'John');
            params.set('age', '30');

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: params
                }
            );

            expect(result.request.postData?.text).toBe('name=John&age=30');
            expect(result.request.postData?.mimeType).toBe(
                'application/x-www-form-urlencoded'
            );
        });

        it('should handle FormData body', () => {
            const formData = new FormData();
            formData.append('name', 'John');

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: formData
                }
            );

            expect(result.request.postData?.text).toBe('[FormData]');
        });

        it('should handle Blob body', () => {
            const blob = new Blob(['test'], { type: 'text/plain' });

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: blob
                }
            );

            expect(result.request.postData?.text).toBe('[Blob]');
        });

        it('should handle ArrayBuffer body', () => {
            const buffer = new ArrayBuffer(8);

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: buffer
                }
            );

            expect(result.request.postData?.text).toBe('[Binary]');
        });

        it('should handle XML body and detect mime type', () => {
            const xmlBody = '<?xml version="1.0"?><root><item>test</item></root>';

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: xmlBody
                }
            );

            expect(result.request.postData?.mimeType).toBe('application/xml');
        });

        it('should handle array body and detect JSON mime type', () => {
            const arrayBody = '[1, 2, 3]';

            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: arrayBody
                }
            );

            expect(result.request.postData?.mimeType).toBe('application/json');
        });

        it('should handle null body', () => {
            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: null
                }
            );

            expect(result.request.postData).toBeUndefined();
        });

        it('should handle non-standard input types', () => {
            // Test with something that's not a standard type
            const result = createPendingRequestFromFetch(
                12345 as unknown as string
            );

            expect(result.request.url).toContain('12345');
        });

        it('should create pending request from Request object', () => {
            const request = new Request('https://example.com/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = createPendingRequestFromFetch(request);

            expect(result.request.method).toBe('PUT');
            expect(result.request.url).toBe('https://example.com/api/users');
            // Headers are extracted from the Request object
            const contentTypeHeader = result.request.headers.find(
                (h) => h.name.toLowerCase() === 'content-type'
            );
            expect(contentTypeHeader?.value).toBe('application/json');
        });

        it('should handle plain text body and detect text/plain mime type', () => {
            const result = createPendingRequestFromFetch(
                'https://example.com/api/users',
                {
                    method: 'POST',
                    body: 'plain text without special markers'
                }
            );

            expect(result.request.postData?.text).toBe(
                'plain text without special markers'
            );
            expect(result.request.postData?.mimeType).toBe('text/plain');
        });
    });

    describe('createPendingRequestFromXHR', () => {
        it('should create pending request from XHR arguments', () => {
            const result = createPendingRequestFromXHR(
                'GET',
                'https://example.com/api/users',
                [],
                null
            );

            expect(result.id).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(result.request.method).toBe('GET');
            expect(result.request.url).toBe('https://example.com/api/users');
            expect(result.request.postData).toBeUndefined();
        });

        it('should create pending request with POST body', () => {
            const headers = [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'X-Custom', value: 'test' }
            ];
            const body = JSON.stringify({ data: 'test' });

            const result = createPendingRequestFromXHR(
                'POST',
                'https://example.com/api/data',
                headers,
                body
            );

            expect(result.request.method).toBe('POST');
            expect(result.request.headers).toEqual(headers);
            expect(result.request.postData?.text).toBe(body);
            expect(result.request.postData?.mimeType).toBe('application/json');
        });

        it('should normalize method to uppercase', () => {
            const result = createPendingRequestFromXHR(
                'post',
                'https://example.com/api',
                [],
                null
            );
            expect(result.request.method).toBe('POST');
        });
    });

    describe('hashBody', () => {
        it('should return consistent hash for same input', () => {
            const body = '{"name":"John","age":30}';
            const hash1 = hashBody(body);
            const hash2 = hashBody(body);
            expect(hash1).toBe(hash2);
        });

        it('should return different hash for different inputs', () => {
            const hash1 = hashBody('{"name":"John"}');
            const hash2 = hashBody('{"name":"Jane"}');
            expect(hash1).not.toBe(hash2);
        });

        it('should return non-empty string', () => {
            const hash = hashBody('test');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe('createRequestKey', () => {
        it('should create key without body hash for GET requests', () => {
            const key = createRequestKey('GET', 'https://example.com/api/users');
            expect(key.method).toBe('GET');
            expect(key.url).toBe('https://example.com/api/users');
            expect(key.bodyHash).toBeUndefined();
        });

        it('should create key with body hash for POST requests', () => {
            const body = '{"name":"John"}';
            const key = createRequestKey(
                'POST',
                'https://example.com/api/users',
                body
            );
            expect(key.method).toBe('POST');
            expect(key.url).toBe('https://example.com/api/users');
            expect(key.bodyHash).toBeDefined();
            expect(key.bodyHash).toBe(hashBody(body));
        });

        it('should normalize method to uppercase', () => {
            const key = createRequestKey('post', 'https://example.com/api');
            expect(key.method).toBe('POST');
        });
    });

    describe('requestKeyToString', () => {
        it('should convert key to string format', () => {
            const key = createRequestKey('GET', 'https://example.com/api');
            const str = requestKeyToString(key);
            expect(str).toBe('GET:https://example.com/api:');
        });

        it('should include body hash in string', () => {
            const body = 'test';
            const key = createRequestKey('POST', 'https://example.com/api', body);
            const str = requestKeyToString(key);
            expect(str).toBe(`POST:https://example.com/api:${hashBody(body)}`);
        });

        it('should produce same string for same key', () => {
            const key1 = createRequestKey(
                'POST',
                'https://example.com/api',
                'body'
            );
            const key2 = createRequestKey(
                'POST',
                'https://example.com/api',
                'body'
            );
            expect(requestKeyToString(key1)).toBe(requestKeyToString(key2));
        });

        it('should produce different strings for different keys', () => {
            const key1 = createRequestKey(
                'POST',
                'https://example.com/api',
                'body1'
            );
            const key2 = createRequestKey(
                'POST',
                'https://example.com/api',
                'body2'
            );
            expect(requestKeyToString(key1)).not.toBe(requestKeyToString(key2));
        });
    });
});
