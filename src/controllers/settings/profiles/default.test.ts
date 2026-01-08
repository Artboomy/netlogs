/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { defaultProfile } from './default';
import { NetworkRequest } from 'models/types';

vi.mock('utils', () => ({
    isSerializedFormData: vi.fn((text: string) => text.includes('Content-Disposition: form-data')),
    isSerializedMultipartFormData: vi.fn((text: string) => text.includes('multipart/form-data'))
}));

// Helper function to create mock NetworkRequest
function createMockRequest(overrides: any = {}): NetworkRequest {
    const baseRequest = {
        request: {
            method: 'GET',
            url: 'https://example.com/api/test',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [],
            headersSize: -1,
            bodySize: -1,
            postData: undefined
        },
        response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
                size: 100,
                mimeType: 'application/json',
                text: '{"success":true}'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: 100
        },
        cache: {},
        serverIPAddress: '127.0.0.1',
        startedDateTime: new Date().toISOString(),
        time: 110,
        timings: {
            blocked: 0,
            dns: 0,
            connect: 0,
            send: 0,
            wait: 100,
            receive: 10,
            ssl: 0
        }
    };

    // Deep merge overrides
    if (overrides.request) {
        if (overrides.request.postData) {
            baseRequest.request.postData = overrides.request.postData;
        }
        Object.assign(baseRequest.request, overrides.request);
    }

    if (overrides.response) {
        if (overrides.response.content) {
            Object.assign(baseRequest.response.content, overrides.response.content);
        }
        Object.assign(baseRequest.response, overrides.response);
    }

    if (overrides.timings) {
        Object.assign(baseRequest.timings, overrides.timings);
    }

    if (overrides.serverIPAddress) {
        baseRequest.serverIPAddress = overrides.serverIPAddress;
    }

    return baseRequest as NetworkRequest;
}

describe('default profile functions', () => {
    describe('getName', () => {
        it('should return pathname from URL', () => {
            const request = createMockRequest({
                request: { url: 'https://example.com/api/users/123' }
            });
            expect(defaultProfile.functions.getName(request)).toBe('/api/users/123');
        });

        it('should handle root path', () => {
            const request = createMockRequest({
                request: { url: 'https://example.com/' }
            });
            expect(defaultProfile.functions.getName(request)).toBe('/');
        });
    });

    describe('getTag', () => {
        it('should return method for 200 status', () => {
            const request = createMockRequest({
                request: { method: 'POST' },
                response: { status: 200 }
            });
            expect(defaultProfile.functions.getTag(request)).toBe('POST');
        });

        it('should include status for non-200 responses', () => {
            const request = createMockRequest({
                request: { method: 'GET' },
                response: { status: 404 }
            });
            expect(defaultProfile.functions.getTag(request)).toBe('GET/404');
        });
    });

    describe('getParams', () => {
        it('should parse JSON POST data', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"key":"value"}' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({ key: 'value' });
        });

        it('should handle FormData', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'multipart/form-data', text: 'Content-Disposition: form-data; name="field"' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toHaveProperty('FormData');
        });

        it('should handle multipart form data', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'multipart/form-data', text: 'multipart/form-data' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toHaveProperty('FormData');
        });

        it('should handle non-JSON POST data as text', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'text/plain', text: 'plain text data' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({ text: 'plain text data' });
        });

        it('should handle POST with no postData text', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({});
        });

        it('should parse query params for GET requests', () => {
            const request = createMockRequest({
                request: {
                    method: 'GET',
                    url: 'https://example.com/api?foo=bar&baz=qux'
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({ foo: 'bar', baz: 'qux' });
        });

        it('should handle PATCH method with postData', () => {
            const request = createMockRequest({
                request: {
                    method: 'PATCH',
                    postData: { mimeType: 'application/json', text: '{"updated":true}' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({ updated: true });
        });

        it('should handle PUT method with postData', () => {
            const request = createMockRequest({
                request: {
                    method: 'PUT',
                    postData: { mimeType: 'application/json', text: '{"data":"test"}' }
                }
            });
            const params = defaultProfile.functions.getParams(request);
            expect(params).toEqual({ data: 'test' });
        });
    });

    describe('getMeta', () => {
        it('should return structured meta information', () => {
            const request = createMockRequest();
            const meta = defaultProfile.functions.getMeta(request);

            expect(meta).toBeDefined();
            expect(meta!.General).toBeDefined();
            expect(meta!['Response headers']).toBeDefined();
            expect(meta!['Request headers']).toBeDefined();
            expect(meta!.Timings).toBeDefined();
        });

        it('should include request URL and method', () => {
            const request = createMockRequest();
            const meta = defaultProfile.functions.getMeta(request);

            expect(meta).toBeDefined();
            const generalItems = meta!.General.items;
            expect(generalItems.find((item: any) => item.name === 'Request URL')).toBeDefined();
            expect(generalItems.find((item: any) => item.name === 'Request Method')).toBeDefined();
        });
    });

    describe('isError', () => {
        it('should return false for 2xx status', () => {
            const request = createMockRequest({ response: { status: 200 } });
            expect(defaultProfile.functions.isError(request)).toBe(false);
        });

        it('should return false for 3xx status', () => {
            const request = createMockRequest({ response: { status: 301 } });
            expect(defaultProfile.functions.isError(request)).toBe(false);
        });

        it('should return true for 4xx status', () => {
            const request = createMockRequest({ response: { status: 404 } });
            expect(defaultProfile.functions.isError(request)).toBe(true);
        });

        it('should return true for 5xx status', () => {
            const request = createMockRequest({ response: { status: 500 } });
            expect(defaultProfile.functions.isError(request)).toBe(true);
        });

        it('should return true for status 0', () => {
            const request = createMockRequest({ response: { status: 0 } });
            expect(defaultProfile.functions.isError(request)).toBe(true);
        });
    });

    describe('shouldShow', () => {
        it('should show regular API requests', () => {
            const request = createMockRequest({
                request: { url: 'https://example.com/api/data' }
            });
            expect(defaultProfile.functions.shouldShow(request)).toBe(true);
        });

        it('should hide websocket requests', () => {
            const request = createMockRequest({
                request: { url: 'ws://example.com/socket' }
            });
            expect(defaultProfile.functions.shouldShow(request)).toBe(false);
        });

        it('should hide static asset requests', () => {
            const assets = ['script.js', 'style.css', 'font.woff', 'icon.svg', 'image.png'];
            assets.forEach(asset => {
                const request = createMockRequest({
                    request: { url: `https://example.com/${asset}` }
                });
                expect(defaultProfile.functions.shouldShow(request)).toBe(false);
            });
        });
    });

    describe('getResult', () => {
        it('should parse JSON content', () => {
            const request = createMockRequest({
                response: {
                    content: {
                        mimeType: 'application/json'
                    }
                }
            });
            const result = defaultProfile.functions.getResult(request, '{"data":"test"}');
            expect(result).toEqual({ data: 'test' });
        });

        it('should return original content for non-JSON mimeType', () => {
            const request = createMockRequest({
                response: {
                    content: {
                        mimeType: 'text/plain'
                    }
                }
            });
            const result = defaultProfile.functions.getResult(request, 'plain text');
            expect(result).toBe('plain text');
        });

        it('should handle invalid JSON gracefully', () => {
            const request = createMockRequest({
                response: {
                    content: {
                        mimeType: 'application/json'
                    }
                }
            });
            const result = defaultProfile.functions.getResult(request, 'invalid json');
            expect(result).toBe('invalid json');
        });

        it('should handle undefined content', () => {
            const request = createMockRequest();
            const result = defaultProfile.functions.getResult(request, undefined);
            expect(result).toBeUndefined();
        });
    });
});
