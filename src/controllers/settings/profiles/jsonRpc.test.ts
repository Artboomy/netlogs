/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { jsonRpcProfile, isJsonRpc } from './jsonRpc';
import { NetworkRequest } from 'models/types';

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

describe('jsonRpc profile functions', () => {
    describe('getName', () => {
        it('should return method name from params', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"eth_call","id":1}' }
                }
            });
            expect(jsonRpcProfile.functions.getName(request)).toBe('eth_call');
        });

        it('should return Unknown method if no method field', () => {
            const request = createMockRequest({
                request: {
                    method: 'GET',
                    url: 'https://example.com/api'
                }
            });
            expect(jsonRpcProfile.functions.getName(request)).toBe('Unknown method');
        });
    });

    describe('getTag', () => {
        it('should return RPC tag', () => {
            const request = createMockRequest();
            expect(jsonRpcProfile.functions.getTag(request)).toBe('RPC');
        });
    });

    describe('getParams', () => {
        it('should extract params field from RPC request', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"test","params":{"key":"value"}}' }
                }
            });
            const params = jsonRpcProfile.functions.getParams(request);
            expect(params).toEqual({ key: 'value' });
        });

        it('should return full object if no params field', () => {
            const request = createMockRequest({
                request: {
                    method: 'POST',
                    postData: { mimeType: 'application/json', text: '{"jsonrpc":"2.0","method":"test"}' }
                }
            });
            const params = jsonRpcProfile.functions.getParams(request);
            expect(params).toHaveProperty('jsonrpc');
        });
    });

    describe('isError', () => {
        it('should detect error in RPC response', () => {
            const request = createMockRequest({
                response: {
                    status: 200,
                    content: {
                        mimeType: 'application/json',
                        text: '{"jsonrpc":"2.0","error":{"code":-32600,"message":"Invalid Request"},"id":1}'
                    }
                }
            });
            expect(jsonRpcProfile.functions.isError(request)).toBe(true);
        });

        it('should return false for successful RPC response', () => {
            const request = createMockRequest({
                response: {
                    status: 200,
                    content: {
                        mimeType: 'application/json',
                        text: '{"jsonrpc":"2.0","result":"0x123","id":1}'
                    }
                }
            });
            expect(jsonRpcProfile.functions.isError(request)).toBe(false);
        });
    });

    describe('shouldShow', () => {
        it('should always return true', () => {
            const request = createMockRequest();
            expect(jsonRpcProfile.functions.shouldShow(request)).toBe(true);
        });
    });

    describe('getResult', () => {
        it('should unwrap result from RPC response', () => {
            const request = createMockRequest();
            const result = jsonRpcProfile.functions.getResult(
                request,
                '{"jsonrpc":"2.0","result":"0x123","id":1}'
            );
            expect(result).toBe('0x123');
        });

        it('should return error if present', () => {
            const request = createMockRequest();
            const result = jsonRpcProfile.functions.getResult(
                request,
                '{"jsonrpc":"2.0","error":{"code":-32600,"message":"Invalid"},"id":1}'
            );
            expect(result).toEqual({ code: -32600, message: 'Invalid' });
        });

        it('should handle non-RPC response', () => {
            const request = createMockRequest();
            const result = jsonRpcProfile.functions.getResult(request, '{"data":"test"}');
            expect(result).toEqual({ data: 'test' });
        });
    });
});

describe('isJsonRpc', () => {
    it('should detect JSON-RPC by standard match in params', () => {
        const params = { jsonrpc: '2.0', method: 'test', id: 1 };
        expect(isJsonRpc(params, null)).toBe(true);
    });

    it('should detect JSON-RPC by weak match in params', () => {
        const params = { id: 1, method: 'test', params: {} };
        expect(isJsonRpc(params, null)).toBe(true);
    });

    it('should detect JSON-RPC by standard match in result', () => {
        const params = {};
        const result = { jsonrpc: '2.0', result: 'test', id: 1 };
        expect(isJsonRpc(params, result)).toBe(true);
    });

    it('should return false for non-RPC params', () => {
        const params = { key: 'value' };
        expect(isJsonRpc(params, null)).toBe(false);
    });
});
